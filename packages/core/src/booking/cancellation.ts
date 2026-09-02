/**
 * Cancellation and refunds.
 *
 * **The one rule everything follows from: whoever collected the money handles
 * the refund.** Decided with the client, 2026-09-01.
 *
 * A partner booking has no `payments` row, because Turf Town holds the money.
 * So the quote comes out at zero **by construction** — there is no channel
 * check anywhere in this file, and there must never be one (R6).
 *
 * See ../../../docs/system/05-booking-engine.md §Cancellation and refunds
 */

import type { Paise } from '../money/index.js';

export type RefundInput = {
  /** What was actually paid **to us**. Never the booking's face value. */
  paidPaise: Paise;
  startsAt: Date;
  now: Date;
  cancellationCutoffHours: number;
  /** Percentage of the paid amount returned before the cutoff. */
  cancellationRefundPct: number;
  /**
   * Partner bookings carry no cutoff — they may cancel at any time and the
   * slot frees. Pavilion Club knowingly absorbs that. This is the ONE place
   * the distinction appears, and it is a boolean the caller supplies from
   * `channels.settles_later`, not a channel name.
   */
  cutoffApplies?: boolean;
};

export type RefundQuote = {
  refundPaise: Paise;
  /** Shown to the user before they confirm, and stored on the refund row. */
  reason: string;
  hoursUntilStart: number;
};

export function refundQuote(input: RefundInput): RefundQuote {
  const {
    paidPaise,
    startsAt,
    now,
    cancellationCutoffHours,
    cancellationRefundPct,
    cutoffApplies = true,
  } = input;

  const hoursUntilStart = (startsAt.getTime() - now.getTime()) / 3_600_000;

  // Falls out of the money model: no payments row, no refund from us.
  if (paidPaise <= 0) {
    return {
      refundPaise: 0,
      reason: 'Nothing was paid to us for this booking.',
      hoursUntilStart,
    };
  }

  if (cutoffApplies && hoursUntilStart < cancellationCutoffHours) {
    return {
      refundPaise: 0,
      reason: `Cancelled within ${cancellationCutoffHours} hours of the booking.`,
      hoursUntilStart,
    };
  }

  const refundPaise = Math.round((paidPaise * cancellationRefundPct) / 100);
  return {
    refundPaise,
    reason:
      cancellationRefundPct === 100
        ? 'Cancelled in good time — full refund.'
        : `Cancelled in good time — ${cancellationRefundPct}% refunded.`,
    hoursUntilStart,
  };
}

/**
 * Should the desk be warned before cancelling this booking?
 *
 * A partner customer standing at the counter asking to cancel is a trap: doing
 * it here frees the court but refunds nothing, and they leave believing they
 * have been refunded.
 */
export function needsPartnerCancelWarning(settlesLater: boolean, paidPaise: Paise): boolean {
  return settlesLater && paidPaise <= 0;
}
