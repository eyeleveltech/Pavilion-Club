import type { Database } from '@pavilion/db';
import { bookings, eq, and, lte } from '@pavilion/db';

export async function runBookingCompletionJob(db: Database): Promise<number> {
  const now = new Date();
  try {
    const updated = await db
      .update(bookings)
      .set({ status: 'completed' })
      .where(and(eq(bookings.status, 'confirmed'), lte(bookings.endsAt, now)))
      .returning({ id: bookings.id });

    if (updated.length > 0) {
      console.log(`[Completion] Marked ${updated.length} past booking(s) as completed.`);
    }
    return updated.length;
  } catch (err) {
    console.error('[Completion] Error marking past bookings as completed:', err);
    return 0;
  }
}