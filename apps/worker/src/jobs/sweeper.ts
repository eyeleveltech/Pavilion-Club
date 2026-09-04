import type { Database } from '@pavilion/db';
import { expireStaleHolds } from '@pavilion/db';

export async function runHoldSweeper(db: Database): Promise<number> {
  try {
    const expiredCount = await expireStaleHolds(db);
    if (expiredCount > 0) {
      console.log(`[Sweeper] Successfully released ${expiredCount} expired slot hold(s).`);
    }
    return expiredCount;
  } catch (err) {
    console.error('[Sweeper] Error releasing expired holds:', err);
    return 0;
  }
}