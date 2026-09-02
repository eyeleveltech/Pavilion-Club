import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';

export function createDb(connectionString?: string) {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required to create a database client');
  }
  const pool = new pg.Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

export type Database = ReturnType<typeof createDb>;
