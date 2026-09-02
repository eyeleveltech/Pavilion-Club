/**
 * The booking state machine.
 *
 * Only `held` and `confirmed` block a slot. Everything else is history.
 * A transition not listed here MUST be rejected — a cancelled booking silently
 * becoming confirmed again is how a court gets sold twice with a clean audit
 * trail.
 *
 * See ../../../docs/system/05-booking-engine.md §State transitions
 */

export type BookingStatus = 'held' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type CancelledBy = 'customer' | 'desk' | 'partner' | 'system_expiry' | 'system_admin';

/** Statuses that occupy the court, and therefore the exclusion constraint. */
export const BLOCKING_STATUSES: readonly BookingStatus[] = ['held', 'confirmed'];

export function isBlocking(status: BookingStatus): boolean {
  return BLOCKING_STATUSES.includes(status);
}

const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  // Paid, or accepted at the desk, or confirmed by a partner. Or it lapsed.
  held: ['confirmed', 'cancelled'],

  confirmed: ['cancelled', 'completed', 'no_show'],

  // A correction, not a reversal. The nightly job sets `completed` for anything
  // past its end time, which would otherwise make a no-show unrecordable by the
  // next morning — and no_show_count is what blocks a repeat offender from
  // holding Saturday courts for free under pay_at_venue.
  completed: ['no_show'],

  // Terminal. Re-booking a cancelled slot creates a NEW booking, so the
  // exclusion constraint gets to referee it.
  cancelled: [],
  no_show: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Throws rather than returning false, so a caller cannot forget to check. */
export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot move a booking from ${from} to ${to}`);
  }
}

export function isTerminal(status: BookingStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
