import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';

const PoolConstructor = pg.Pool || (pg as unknown as { default: { Pool: typeof pg.Pool } }).default?.Pool;

export function createDb(connectionString?: string) {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required to create a database client');
  }
  const pool = new PoolConstructor({ connectionString: url });
  return drizzle(pool, { schema });
}

export type Database = ReturnType<typeof createDb>;
