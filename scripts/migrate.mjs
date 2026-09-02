#!/usr/bin/env node
/**
 * Migration runner.
 *
 * Numbered, forward-only, plain SQL. Each file runs in its own transaction, so
 * a failure leaves the database on the last complete migration rather than half
 * way through one.
 *
 *   node scripts/migrate.mjs            apply everything pending
 *   node scripts/migrate.mjs --status   list applied and pending
 *   node scripts/migrate.mjs --seed     apply, then load db/seed
 *   node scripts/migrate.mjs --reset    DROP the schema and rebuild (dev only)
 *
 * Drizzle never owns the schema. It reads what these files create.
 */

import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', 'db', 'migrations');
const SEEDS = join(HERE, '..', 'db', 'seed');

const args = new Set(process.argv.slice(2));
const flag = (name) => args.has(`--${name}`);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });

const sqlFiles = async (dir) =>
  (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.sql')).sort();

/** Content hash, so an edited-after-applying migration is caught rather than skipped. */
const digest = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

async function ensureLedger() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text PRIMARY KEY,
      checksum   text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
}

async function applied() {
  const { rows } = await client.query('SELECT filename, checksum FROM schema_migrations');
  return new Map(rows.map((r) => [r.filename, r.checksum]));
}

async function run(dir, files, ledger) {
  for (const file of files) {
    const sql = await readFile(join(dir, file), 'utf8');
    const sum = digest(sql);
    const previous = ledger?.get(file);

    if (previous === sum) continue;
    if (previous && previous !== sum) {
      throw new Error(
        `${file} has changed since it was applied. Migrations are forward-only — ` +
          `add a new file instead of editing this one.`,
      );
    }

    process.stdout.write(`  ${file} ... `);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      if (ledger) {
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [file, sum],
        );
      }
      await client.query('COMMIT');
      console.log('ok');
    } catch (error) {
      await client.query('ROLLBACK');
      console.log('FAILED');
      throw error;
    }
  }
}

try {
  await client.connect();

  if (flag('reset')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to reset in production.');
    }
    console.log('Dropping and recreating the public schema...');
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  }

  await ensureLedger();
  const ledger = await applied();
  const files = await sqlFiles(MIGRATIONS);

  if (flag('status')) {
    console.log('\nMigrations:');
    for (const file of files) {
      console.log(`  ${ledger.has(file) ? '[applied]' : '[pending]'} ${file}`);
    }
    console.log();
  } else {
    const pending = files.filter((f) => !ledger.has(f));
    console.log(pending.length ? `\nApplying ${pending.length} migration(s):` : '\nUp to date.');
    await run(MIGRATIONS, files, ledger);
  }

  if (flag('seed') || flag('reset')) {
    const seeds = await sqlFiles(SEEDS);
    if (seeds.length) {
      console.log('\nSeeding:');
      await run(SEEDS, seeds, null);
    }
  }

  console.log('\nDone.\n');
} catch (error) {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
} finally {
  await client.end();
}
