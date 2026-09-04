import type { Database } from '@pavilion/db';
import { messageOutbox, eq, or, and, lt, lte, sql } from '@pavilion/db';
import { defaultDispatcher } from '../providers/dispatcher.js';

export async function runMessageOutboxDrain(db: Database): Promise<number> {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + 60 * 1000); // 1-minute lease

  try {
    const pending = await db
      .select()
      .from(messageOutbox)
      .where(
        and(
          or(
            eq(messageOutbox.status, 'queued'),
            and(
              eq(messageOutbox.status, 'failed'),
              lt(messageOutbox.attempts, 5)
            )
          ),
          or(
            sql`${messageOutbox.leasedUntil} IS NULL`,
            lte(messageOutbox.leasedUntil, now)
          )
        )
      )
      .limit(20);

    if (pending.length === 0) return 0;

    let processed = 0;

    for (const msg of pending) {
      await db
        .update(messageOutbox)
        .set({ leasedUntil: leaseUntil })
        .where(eq(messageOutbox.id, msg.id));

      try {
        // Dispatch message via WhatsApp with automatic SMS fallback
        const result = await defaultDispatcher.dispatch({
          id: msg.id,
          toPhone: msg.toPhone,
          toEmail: msg.toEmail,
          template: msg.template,
          payload: (msg.payload as Record<string, unknown>) || {},
        });

        console.log(
          `[Outbox] Delivered notification via ${result.channel} (${result.provider}) to ${msg.toPhone || msg.toEmail || 'recipient'}`
        );

        await db
          .update(messageOutbox)
          .set({
            status: 'sent',
            sentAt: new Date(),
            leasedUntil: null,
            channel: result.channel,
          })
          .where(eq(messageOutbox.id, msg.id));

        processed++;
      } catch (sendErr: any) {
        const nextAttempts = (msg.attempts || 0) + 1;
        const newStatus = nextAttempts >= 5 ? 'dead' : 'failed';
        console.error(
          `[Outbox] Failed to send message ${msg.id} (attempt ${nextAttempts}):`,
          sendErr.message
        );

        await db
          .update(messageOutbox)
          .set({
            status: newStatus,
            attempts: nextAttempts,
            lastError: sendErr.message,
            leasedUntil: null,
          })
          .where(eq(messageOutbox.id, msg.id));
      }
    }

    return processed;
  } catch (err) {
    console.error('[Outbox] Error draining message outbox:', err);
    return 0;
  }
}