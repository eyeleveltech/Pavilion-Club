import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

function findPgDump() {
  if (process.env.PG_DUMP_PATH) return process.env.PG_DUMP_PATH;
  if (process.platform === 'win32') {
    const defaultWinPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';
    if (fs.existsSync(defaultWinPath)) return `"${defaultWinPath}"`;
  }
  return 'pg_dump';
}

/**
 * Production Backup Script
 * Dumps PostgreSQL database, compresses with gzip, and encrypts with AES-256-GCM before off-box export.
 */
export async function runBackup(options = {}) {
  const dbUrl = options.databaseUrl || process.env.DATABASE_URL;
  const encKey = options.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY || 'pavilion_secure_backup_key_2026_32char!';
  const outDir = options.outputDir || path.resolve(process.cwd(), 'backups');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `pavilion_backup_${timestamp}.sql.gz.enc`;
  const outPath = path.join(outDir, filename);

  console.log(`[Backup] Starting encrypted dump to ${filename}...`);

  const pgDumpCmd = findPgDump();

  // 1. pg_dump
  const dumpSql = execSync(`${pgDumpCmd} "${dbUrl}" --no-owner --no-privileges`, {
    maxBuffer: 100 * 1024 * 1024,
    encoding: 'utf8',
  });

  // 2. Compress gzip
  const compressed = zlib.gzipSync(Buffer.from(dumpSql, 'utf8'));

  // 3. Encrypt with AES-256-GCM
  const key = crypto.createHash('sha256').update(encKey).digest(); // 32 bytes
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // File structure: [16 bytes IV][16 bytes AuthTag][Encrypted Data]
  const finalPayload = Buffer.concat([iv, authTag, encrypted]);
  fs.writeFileSync(outPath, finalPayload);

  console.log(`[Backup] Success! Encrypted backup written: ${outPath} (${(finalPayload.length / 1024).toFixed(1)} KB)`);
  return { filename, path: outPath, sizeBytes: finalPayload.length };
}

if (process.argv[1]?.endsWith('backup.mjs')) {
  runBackup().catch((err) => {
    console.error('[Backup] Failed:', err);
    process.exit(1);
  });
}
