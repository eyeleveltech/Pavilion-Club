import type { Database } from '../client.js';
import { sql } from 'drizzle-orm';

export async function expireStaleHolds(db: Database): Promise<number> {
  const result = await db.execute<{ expire_stale_holds: number }>(sql`SELECT expire_stale_holds()`);
  const count = result.rows[0]?.expire_stale_holds;
  return Number(count ?? 0);
}
