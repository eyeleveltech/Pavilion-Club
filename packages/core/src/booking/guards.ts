/**
 * Write-path guards — may this booking be created?
 *
 * Runs against the slots `computeAvailability` produced, never against its own
 * query. That is R1: there is one answer to "what is free", and the write path
 * asks the same function every screen asks.
 *
 * These guards can all pass and the insert can still fail, because someone else
 * may take the slot in between. That is expected and correct — the database is
 * the referee (R2). The guards exist to give a useful reason *before* we try.
 *
 * See ../../../docs/system/05-booking-engine.md §Creating a booking
 */

import type { Paise } from '../money/index.js';
import type { Slot } from '../availability/index.js';
import { type Ymd, daysBetween } from '../time/index.js';

/** Who is asking. The desk is trusted with things the public is not. */
export type BookingActor = 'public' | 'desk' | 'partner';

/**
 * Why a booking was refused. Every value is also a `booking_attempts.outcome`,
 * so refusals become the missed-demand report rather than vanishing.
 */
export type RefusalReason =
  | 'JUST_TAKEN'
  | 'CLOSED'
  | 'PAST'
  | 'OUTSIDE_WINDOW'
  | 'BLACKOUT'
  | 'NO_PRICE'
  | 'NOT_CONTIGUOUS'
  | 'BLOCKED';

export type ValidateInput = {
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  /** Every slot for this court's business date, from `computeAvailability`. */
  slots: readonly Slot[];
  now: Date;
  actor: BookingActor;
  /** The business date the booking falls on. */
  businessDate: Ymd;
  /** Today's business date, for the window check. */
  todayBusinessDate: Ymd;
  bookingWindowDays: number;
  customerIsBlocked?: boolean;
};

export type ValidateResult =
  | { ok: true; slots: Slot[]; amountPaise: Paise }
  | { ok: false; reason: RefusalReason };

/**
 * Order matters. The reason a person sees should be the most useful one, and
 * the reason logged should be the most diagnostic one — a slot that is both
 * outside the booking window and already taken is reported as taken, because
 * that is what is actually true about the court.
 */
export function validateBooking(input: ValidateInput): ValidateResult {
  const {
    courtId,
    startsAt,
    endsAt,
    slots,
    now,
    actor,
    businessDate,
    todayBusinessDate,
    bookingWindowDays,
    customerIsBlocked,
  } = input;

  if (customerIsBlocked) return { ok: false, reason: 'BLOCKED' };
  if (endsAt <= startsAt) return { ok: false, reason: 'NOT_CONTIGUOUS' };

  // Slots that OVERLAP the request, not slots contained by it. Selecting only
  // contained slots makes a part-hour request (19:00-19:45) match nothing and
  // report CLOSED — telling a customer the venue is shut when it is open and
  // their request was simply the wrong shape.
  const covered = slots
    .filter((s) => s.courtId === courtId && s.startsAt < endsAt && startsAt < s.endsAt)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  // No overlap at all means the court is shut then, or does not exist.
  if (covered.length === 0) return { ok: false, reason: 'CLOSED' };

  // The requested range must be exactly tiled by whole slots. A request for
  // 19:00-19:45 or one spanning a midday closure is not bookable.
  const tiled =
    covered[0]!.startsAt.getTime() === startsAt.getTime() &&
    covered[covered.length - 1]!.endsAt.getTime() === endsAt.getTime() &&
    covered.every(
      (slot, i) => i === 0 || slot.startsAt.getTime() === covered[i - 1]!.endsAt.getTime(),
    );
  if (!tiled) return { ok: false, reason: 'NOT_CONTIGUOUS' };

  // The desk may back-date — someone walks in at 19:10 for the 19:00 slot, and
  // the money is already in the till. The public and partners may not.
  if (actor !== 'desk' && startsAt < now) return { ok: false, reason: 'PAST' };
  if (actor === 'desk' && endsAt <= now) return { ok: false, reason: 'PAST' };

  // The window is a write-path guard, not an availability concept, which is why
  // it lives here and not in computeAvailability. The desk is exempt.
  if (actor !== 'desk') {
    const ahead = daysBetween(todayBusinessDate, businessDate);
    if (ahead < 0 || ahead > bookingWindowDays) return { ok: false, reason: 'OUTSIDE_WINDOW' };
  }

  if (covered.some((s) => s.state === 'blackout')) return { ok: false, reason: 'BLACKOUT' };
  if (covered.some((s) => s.state !== 'free')) return { ok: false, reason: 'JUST_TAKEN' };

  // Null is not zero. A missing price rule refuses the booking and surfaces on
  // the dashboard, rather than sending a court out free.
  if (covered.some((s) => s.pricePaise === null)) return { ok: false, reason: 'NO_PRICE' };

  return {
    ok: true,
    slots: covered,
    amountPaise: covered.reduce((total, slot) => total + (slot.pricePaise ?? 0), 0),
  };
}

/** What a person should be told. Machine-readable codes stay in the API. */
export const REFUSAL_MESSAGES: Record<RefusalReason, string> = {
  JUST_TAKEN: 'That slot was just taken.',
  CLOSED: 'The venue is closed at that time.',
  PAST: 'That time has already passed.',
  OUTSIDE_WINDOW: 'Bookings are not open that far ahead yet.',
  BLACKOUT: 'That court is unavailable at that time.',
  NO_PRICE: 'No price is set for that slot. Please call the venue.',
  NOT_CONTIGUOUS: 'Please choose whole, consecutive slots.',
  BLOCKED: 'Please call the venue to make this booking.',
};
