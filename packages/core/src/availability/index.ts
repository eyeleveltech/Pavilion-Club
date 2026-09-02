/**
 * Availability — what is free.
 *
 * **R1: this is the only place that answers that question.** The public site,
 * the admin day grid and the Turf Town API all call this. There is no second
 * implementation and nothing caches in front of it, which is why those three
 * surfaces can never disagree.
 *
 * Nothing here touches a database. Data comes in, slots go out.
 *
 * See ../../../docs/system/05-booking-engine.md
 */

import type { Paise } from '../money/index.js';
import { type PriceRule, resolvePrice } from '../pricing/index.js';
import { type Ymd, dateRange, instantAt, weekdayOf } from '../time/index.js';

export type Court = {
  id: string;
  name: string;
  slotMinutes: number;
  sortOrder: number;
  isBookable: boolean;
};

/**
 * One opening period. A weekday may have several — a venue that shuts midday
 * is 06:00-11:00 and 16:00-23:00, two rows.
 *
 * `closeMinutes` may exceed 1440: a court open until 02:00 has 1560, and those
 * late slots still belong to this business date.
 */
export type CourtHours = {
  courtId: string;
  weekday: number;
  openMinutes: number;
  closeMinutes: number;
};

/** A booking as it blocks a slot. Only `held` and `confirmed` are passed in. */
export type BookingLike = {
  id: string;
  reference: string;
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  status: 'held' | 'confirmed';
  /** Set while held. A hold past this instant does NOT block — see below. */
  expiresAt: Date | null;
  channelCode: string;
  channelName: string;
  channelColourHex: string;
  customerName: string | null;
  customerPhone: string | null;
  partnerReference: string | null;
  amountPaise: Paise;
  paidPaise: Paise;
};

export type Blackout = {
  id: string;
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  reason: string;
};

/** What is occupying a slot, for the admin grid. */
export type SlotBooking = {
  id: string;
  reference: string;
  status: 'held' | 'confirmed';
  channelCode: string;
  channelName: string;
  channelColourHex: string;
  customerName: string | null;
  customerPhone: string | null;
  partnerReference: string | null;
  amountPaise: Paise;
  paidPaise: Paise;
  /** Fill vs outline in the day grid. A partner booking is never paid to us. */
  isPaid: boolean;
};

export type SlotState = 'free' | 'held' | 'booked' | 'blackout';

export type Slot = {
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  /** Minutes from local midnight of the business date. May exceed 1440. */
  startMinutes: number;
  state: SlotState;
  /**
   * Whether the slot has already finished. Kept separate from `state` on
   * purpose: a past booking must still render as a booking on the day grid,
   * dimmed — staff need to see who played. Collapsing this into the state
   * would erase that.
   */
  isPast: boolean;
  /** null means no price rule matched — the caller MUST refuse the booking. */
  pricePaise: Paise | null;
  booking?: SlotBooking;
  blackoutReason?: string;
};

export type AvailabilityInput = {
  date: Ymd;
  courts: readonly Court[];
  hours: readonly CourtHours[];
  bookings: readonly BookingLike[];
  blackouts: readonly Blackout[];
  priceRules: readonly PriceRule[];
  now: Date;
  offsetMinutes: number;
};

/** Half-open overlap: 18:00-19:00 and 19:00-20:00 do not overlap. */
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * An expired hold does not block.
 *
 * The database exclusion constraint cannot see `expires_at`, so a lapsed hold
 * still physically blocks the row until the sweeper reaches it. Availability
 * must not repeat that lie — otherwise a slot looks taken for up to thirty
 * seconds after it is free. The write path resolves the same situation with a
 * retry on `23P01`.
 */
function isBlocking(booking: BookingLike, now: Date): boolean {
  if (booking.status === 'confirmed') return true;
  return booking.expiresAt !== null && booking.expiresAt > now;
}

/** Every slot for one court on one business date, in time order. */
function generateSlots(
  court: Court,
  hours: readonly CourtHours[],
  date: Ymd,
  offsetMinutes: number,
): { startMinutes: number; startsAt: Date; endsAt: Date }[] {
  const weekday = weekdayOf(date);
  const periods = hours
    .filter((h) => h.courtId === court.id && h.weekday === weekday)
    .sort((a, b) => a.openMinutes - b.openMinutes);

  const slots: { startMinutes: number; startsAt: Date; endsAt: Date }[] = [];
  for (const period of periods) {
    // Only whole slots. A period that does not divide evenly leaves the
    // remainder unsold rather than selling a short game.
    for (
      let minutes = period.openMinutes;
      minutes + court.slotMinutes <= period.closeMinutes;
      minutes += court.slotMinutes
    ) {
      slots.push({
        startMinutes: minutes,
        startsAt: instantAt(date, minutes, offsetMinutes),
        endsAt: instantAt(date, minutes + court.slotMinutes, offsetMinutes),
      });
    }
  }
  return slots;
}

/**
 * What is free, held, booked and blacked out on one business date.
 *
 * Returns **every** slot, not only the free ones — the admin day grid needs the
 * taken ones to render. Public callers filter to `state === 'free'`.
 *
 * The booking window is deliberately NOT applied here. It is a write-path guard,
 * not an availability concept: the desk can book beyond it.
 */
export function computeAvailability(input: AvailabilityInput): Slot[] {
  const { date, courts, hours, bookings, blackouts, priceRules, now, offsetMinutes } = input;
  const weekday = weekdayOf(date);
  const blocking = bookings.filter((b) => isBlocking(b, now));

  const out: Slot[] = [];

  for (const court of [...courts].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!court.isBookable) continue;

    for (const slot of generateSlots(court, hours, date, offsetMinutes)) {
      const price = resolvePrice(priceRules, {
        courtId: court.id,
        weekday,
        startMinutes: slot.startMinutes % 1440,
        date,
      });

      const base = {
        courtId: court.id,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        startMinutes: slot.startMinutes,
        isPast: slot.endsAt <= now,
        pricePaise: price?.pricePaise ?? null,
      };

      const booking = blocking.find(
        (b) => b.courtId === court.id && overlaps(slot.startsAt, slot.endsAt, b.startsAt, b.endsAt),
      );

      if (booking) {
        out.push({
          ...base,
          state: booking.status === 'held' ? 'held' : 'booked',
          booking: {
            id: booking.id,
            reference: booking.reference,
            status: booking.status,
            channelCode: booking.channelCode,
            channelName: booking.channelName,
            channelColourHex: booking.channelColourHex,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            partnerReference: booking.partnerReference,
            amountPaise: booking.amountPaise,
            paidPaise: booking.paidPaise,
            isPaid: booking.paidPaise >= booking.amountPaise,
          },
        });
        continue;
      }

      const blackout = blackouts.find(
        (b) => b.courtId === court.id && overlaps(slot.startsAt, slot.endsAt, b.startsAt, b.endsAt),
      );

      if (blackout) {
        out.push({ ...base, state: 'blackout', blackoutReason: blackout.reason });
        continue;
      }

      out.push({ ...base, state: 'free' });
    }
  }

  return out;
}

/**
 * Availability across a date range.
 *
 * The month calendar needs thirty days and the dashboard needs seven. The
 * caller fetches bookings and blackouts covering the whole range **once**, then
 * this splits them per day — thirty computations, one query.
 */
export function computeAvailabilityRange(
  from: Ymd,
  to: Ymd,
  input: Omit<AvailabilityInput, 'date'>,
): Map<Ymd, Slot[]> {
  const byDate = new Map<Ymd, Slot[]>();
  for (const date of dateRange(from, to)) {
    byDate.set(date, computeAvailability({ ...input, date }));
  }
  return byDate;
}

export type Summary = {
  total: number;
  free: number;
  booked: number;
  held: number;
  blackout: number;
  /** 0-100, of bookable capacity. Blackouts are removed from the denominator. */
  fillPercent: number;
};

/** Counts for the month calendar, the dashboard strip and the occupancy report. */
export function summarise(slots: readonly Slot[]): Summary {
  const count = (state: SlotState) => slots.filter((s) => s.state === state).length;
  const booked = count('booked');
  const held = count('held');
  const blackout = count('blackout');
  const capacity = slots.length - blackout;

  return {
    total: slots.length,
    free: count('free'),
    booked,
    held,
    blackout,
    fillPercent: capacity === 0 ? 0 : Math.round(((booked + held) / capacity) * 100),
  };
}

export type Run = {
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  slots: Slot[];
  /** null if any slot in the run is unpriced — the run must not be sold. */
  pricePaise: Paise | null;
};

/**
 * Runs of consecutive free slots on one court.
 *
 * Answers "find me two hours on Saturday evening", which the public booking
 * flow needs and a per-slot list cannot express. Runs may overlap: 18:00-20:00
 * and 19:00-21:00 are both offered when three consecutive hours are free.
 *
 * Pass `now` to exclude slots that have already **started**. `isPast` only
 * covers slots that have *ended*, and at 20:30 the 20:00-21:00 slot has done
 * neither — it is in progress. The day grid should keep showing it, because the
 * desk may still want it; a customer choosing two hours online should not be
 * offered thirty minutes of one.
 */
export function findContiguous(
  slots: readonly Slot[],
  slotCount: number,
  opts: { now?: Date } = {},
): Run[] {
  if (slotCount < 1) return [];

  const byCourt = new Map<string, Slot[]>();
  for (const slot of slots) {
    if (slot.state !== 'free' || slot.isPast) continue;
    if (opts.now && slot.startsAt < opts.now) continue;
    const list = byCourt.get(slot.courtId);
    if (list) list.push(slot);
    else byCourt.set(slot.courtId, [slot]);
  }

  const runs: Run[] = [];

  for (const [courtId, courtSlots] of byCourt) {
    const ordered = courtSlots.sort((a, b) => a.startMinutes - b.startMinutes);

    for (let i = 0; i + slotCount <= ordered.length; i++) {
      const window = ordered.slice(i, i + slotCount);

      // Contiguous means each slot starts exactly where the last one ended.
      const unbroken = window.every(
        (slot, index) => index === 0 || slot.startsAt.getTime() === window[index - 1]!.endsAt.getTime(),
      );
      if (!unbroken) continue;

      const unpriced = window.some((slot) => slot.pricePaise === null);
      runs.push({
        courtId,
        startsAt: window[0]!.startsAt,
        endsAt: window[window.length - 1]!.endsAt,
        slots: window,
        pricePaise: unpriced ? null : window.reduce((sum, s) => sum + (s.pricePaise ?? 0), 0),
      });
    }
  }

  return runs.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
