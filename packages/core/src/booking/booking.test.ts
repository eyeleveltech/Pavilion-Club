import { describe, expect, it } from 'vitest';

import { type Court, type CourtHours, computeAvailability } from '../availability/index.js';
import type { PriceRule } from '../pricing/index.js';
import { IST_OFFSET_MINUTES as IST, instantAt } from '../time/index.js';
import {
  REFERENCE_ALPHABET,
  assertTransition,
  canTransition,
  generateReference,
  isBlocking,
  isReference,
  isTerminal,
  needsPartnerCancelWarning,
  normaliseReference,
  refundQuote,
  validateBooking,
} from './index.js';

describe('reference', () => {
  it('looks like PC-8FK2QD', () => {
    expect(generateReference()).toMatch(/^PC-[A-Z2-9]{6}$/);
  });

  it('never uses a character that is misread aloud', () => {
    for (const bad of ['0', 'O', '1', 'I', 'L']) {
      expect(REFERENCE_ALPHABET).not.toContain(bad);
    }
    const many = Array.from({ length: 500 }, () => generateReference()).join('');
    expect(many).not.toMatch(/[0OIL1]/);
  });

  it('is deterministic when the generator is', () => {
    expect(generateReference(() => 0)).toBe('PC-222222');
  });

  it('validates its own output', () => {
    for (let i = 0; i < 100; i++) expect(isReference(generateReference())).toBe(true);
  });

  it('rejects malformed references', () => {
    expect(isReference('PC-8FK2Q')).toBe(false); // too short
    expect(isReference('8FK2QD')).toBe(false); // no prefix
    expect(isReference('PC-8FK2QO')).toBe(false); // excluded character
    expect(isReference(12345)).toBe(false);
  });

  it('tidies what a person types into the search box', () => {
    for (const typed of ['pc-8fk2qd', 'PC 8FK2QD', '8fk2qd', ' PC-8FK2QD ']) {
      expect(normaliseReference(typed)).toBe('PC-8FK2QD');
    }
  });

  it('does not invent a valid reference from a typo', () => {
    // Both sides of every confusable pair are absent from the alphabet, so
    // there is nothing safe to map onto. Failing to find beats finding wrong.
    expect(isReference(normaliseReference('PC-8FK2QO'))).toBe(false);
  });

  it('is unlikely to collide', () => {
    const refs = new Set(Array.from({ length: 5000 }, () => generateReference()));
    expect(refs.size).toBe(5000);
  });
});

describe('state machine', () => {
  it('blocks the court only while held or confirmed', () => {
    expect(isBlocking('held')).toBe(true);
    expect(isBlocking('confirmed')).toBe(true);
    expect(isBlocking('cancelled')).toBe(false);
    expect(isBlocking('completed')).toBe(false);
    expect(isBlocking('no_show')).toBe(false);
  });

  it('allows the real transitions', () => {
    expect(canTransition('held', 'confirmed')).toBe(true);
    expect(canTransition('held', 'cancelled')).toBe(true);
    expect(canTransition('confirmed', 'cancelled')).toBe(true);
    expect(canTransition('confirmed', 'completed')).toBe(true);
    expect(canTransition('confirmed', 'no_show')).toBe(true);
  });

  it('lets a completed booking be corrected to no-show', () => {
    // The nightly job marks everything past as completed, so without this a
    // no-show becomes unrecordable overnight — and no_show_count is what stops
    // a repeat offender holding Saturday courts for free.
    expect(canTransition('completed', 'no_show')).toBe(true);
  });

  it('refuses to resurrect a cancelled booking', () => {
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
    expect(canTransition('cancelled', 'held')).toBe(false);
    expect(isTerminal('cancelled')).toBe(true);
  });

  it('refuses to skip straight from held to completed', () => {
    expect(canTransition('held', 'completed')).toBe(false);
  });

  it('throws rather than returning false, so a caller cannot forget to check', () => {
    expect(() => assertTransition('cancelled', 'confirmed')).toThrow();
    expect(() => assertTransition('held', 'confirmed')).not.toThrow();
  });
});

// --- guards -----------------------------------------------------------------

const COURTS: Court[] = [
  { id: 'c1', name: 'Court 1', slotMinutes: 60, sortOrder: 1, isBookable: true },
];
const HOURS: CourtHours[] = [{ courtId: 'c1', weekday: 6, openMinutes: 360, closeMinutes: 1440 }];
const PRICES: PriceRule[] = [
  {
    id: 'base',
    name: 'Base',
    courtId: null,
    weekdays: null,
    fromMinutes: null,
    toMinutes: null,
    pricePaise: 120000,
    priority: 0,
    validFrom: null,
    validTo: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const SATURDAY = '2026-09-05';
const NOW = instantAt(SATURDAY, 600, IST); // 10:00 Saturday
const slotsFor = (over: Parameters<typeof computeAvailability>[0] extends infer T ? Partial<T> : never = {}) =>
  computeAvailability({
    date: SATURDAY,
    courts: COURTS,
    hours: HOURS,
    bookings: [],
    blackouts: [],
    priceRules: PRICES,
    now: NOW,
    offsetMinutes: IST,
    ...over,
  });

const check = (over: Partial<Parameters<typeof validateBooking>[0]> = {}) =>
  validateBooking({
    courtId: 'c1',
    startsAt: instantAt(SATURDAY, 1140, IST), // 19:00
    endsAt: instantAt(SATURDAY, 1200, IST), // 20:00
    slots: slotsFor(),
    now: NOW,
    actor: 'public',
    businessDate: SATURDAY,
    todayBusinessDate: SATURDAY,
    bookingWindowDays: 30,
    ...over,
  });

describe('guards', () => {
  it('accepts a free future slot and returns the resolved price', () => {
    const result = check();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.amountPaise).toBe(120000);
      expect(result.slots).toHaveLength(1);
    }
  });

  it('sums a multi-hour booking', () => {
    const result = check({ endsAt: instantAt(SATURDAY, 1260, IST) }); // 19:00-21:00
    expect(result.ok && result.amountPaise).toBe(240000);
  });

  it('refuses a slot outside opening hours', () => {
    const result = check({
      startsAt: instantAt(SATURDAY, 180, IST), // 03:00
      endsAt: instantAt(SATURDAY, 240, IST),
    });
    expect(result).toEqual({ ok: false, reason: 'CLOSED' });
  });

  it('refuses a part-hour request', () => {
    const result = check({ endsAt: instantAt(SATURDAY, 1185, IST) }); // 19:00-19:45
    expect(result).toEqual({ ok: false, reason: 'NOT_CONTIGUOUS' });
  });

  it('refuses a zero-length or reversed range', () => {
    expect(check({ endsAt: instantAt(SATURDAY, 1140, IST) })).toEqual({
      ok: false,
      reason: 'NOT_CONTIGUOUS',
    });
  });

  it('refuses a past slot for the public', () => {
    const result = check({
      startsAt: instantAt(SATURDAY, 480, IST), // 08:00, before NOW
      endsAt: instantAt(SATURDAY, 540, IST),
    });
    expect(result).toEqual({ ok: false, reason: 'PAST' });
  });

  it('lets the desk back-date into the slot in progress', () => {
    // Someone walks in at 10:10 for the 10:00 slot; the money is in the till.
    const now = instantAt(SATURDAY, 610, IST);
    const result = check({
      actor: 'desk',
      now,
      slots: slotsFor({ now }),
      startsAt: instantAt(SATURDAY, 600, IST),
      endsAt: instantAt(SATURDAY, 660, IST),
    });
    expect(result.ok).toBe(true);
  });

  it('still refuses the desk a slot that has finished', () => {
    const result = check({
      actor: 'desk',
      startsAt: instantAt(SATURDAY, 480, IST),
      endsAt: instantAt(SATURDAY, 540, IST),
    });
    expect(result).toEqual({ ok: false, reason: 'PAST' });
  });

  it('refuses the public beyond the booking window', () => {
    const result = check({ businessDate: '2026-10-30' });
    expect(result).toEqual({ ok: false, reason: 'OUTSIDE_WINDOW' });
  });

  it('exempts the desk from the booking window', () => {
    const result = check({ actor: 'desk', businessDate: '2026-10-30' });
    expect(result.ok).toBe(true);
  });

  it('refuses a taken slot', () => {
    const taken = slotsFor({
      bookings: [
        {
          id: 'b1',
          reference: 'PC-AAAAAA',
          courtId: 'c1',
          startsAt: instantAt(SATURDAY, 1140, IST),
          endsAt: instantAt(SATURDAY, 1200, IST),
          status: 'confirmed',
          expiresAt: null,
          channelCode: 'website',
          channelName: 'Website',
          channelColourHex: '#0D5F52',
          customerName: 'Rahul',
          customerPhone: null,
          partnerReference: null,
          amountPaise: 120000,
          paidPaise: 120000,
        },
      ],
    });
    expect(check({ slots: taken })).toEqual({ ok: false, reason: 'JUST_TAKEN' });
  });

  it('refuses a blacked-out slot, and says so rather than "taken"', () => {
    const blacked = slotsFor({
      blackouts: [
        {
          id: 'bo1',
          courtId: 'c1',
          startsAt: instantAt(SATURDAY, 1140, IST),
          endsAt: instantAt(SATURDAY, 1200, IST),
          reason: 'Maintenance',
        },
      ],
    });
    expect(check({ slots: blacked })).toEqual({ ok: false, reason: 'BLACKOUT' });
  });

  it('refuses rather than selling an unpriced court', () => {
    expect(check({ slots: slotsFor({ priceRules: [] }) })).toEqual({
      ok: false,
      reason: 'NO_PRICE',
    });
  });

  it('refuses a blocked customer before anything else', () => {
    expect(check({ customerIsBlocked: true })).toEqual({ ok: false, reason: 'BLOCKED' });
  });

  it('never takes an amount from the caller — there is no such field', () => {
    const result = check();
    // The only amount that exists is the one resolved from the price rules.
    expect(result.ok && result.amountPaise).toBe(120000);
    expect(Object.keys(check())).not.toContain('requestedAmountPaise');
  });
});

// --- refunds ----------------------------------------------------------------

const quote = (over: Partial<Parameters<typeof refundQuote>[0]> = {}) =>
  refundQuote({
    paidPaise: 120000,
    startsAt: instantAt(SATURDAY, 1140, IST), // 19:00 Saturday
    now: instantAt('2026-09-01', 600, IST), // days ahead
    cancellationCutoffHours: 24,
    cancellationRefundPct: 100,
    ...over,
  });

describe('refund quote', () => {
  it('refunds in full when cancelled in good time', () => {
    expect(quote().refundPaise).toBe(120000);
  });

  it('refunds nothing inside the cutoff', () => {
    const result = quote({ now: instantAt(SATURDAY, 1080, IST) }); // 1 hour before
    expect(result.refundPaise).toBe(0);
    expect(result.reason).toContain('24 hours');
  });

  it('applies a partial percentage', () => {
    expect(quote({ cancellationRefundPct: 50 }).refundPaise).toBe(60000);
  });

  it('gives zero for a partner booking, with no channel check anywhere', () => {
    // No payments row means nothing was paid to us. It falls straight out of
    // the money model — there is no `if (channel === 'turftown')` in the code.
    const result = quote({ paidPaise: 0 });
    expect(result.refundPaise).toBe(0);
    expect(result.reason).toContain('Nothing was paid to us');
  });

  it('refunds only what was actually paid, not the booking value', () => {
    // Part-paid at the desk: ₹500 of a ₹1,200 booking.
    expect(quote({ paidPaise: 50000 }).refundPaise).toBe(50000);
  });

  it('ignores the cutoff for a partner, who may cancel at any time', () => {
    const result = quote({
      now: instantAt(SATURDAY, 1080, IST),
      cutoffApplies: false,
      paidPaise: 120000,
    });
    expect(result.refundPaise).toBe(120000);
  });
});

describe('partner cancel warning', () => {
  it('warns when the desk cancels a partner booking we were never paid for', () => {
    expect(needsPartnerCancelWarning(true, 0)).toBe(true);
  });

  it('does not warn for an ordinary paid booking', () => {
    expect(needsPartnerCancelWarning(false, 120000)).toBe(false);
  });

  it('does not warn once a partner booking has been settled', () => {
    expect(needsPartnerCancelWarning(true, 120000)).toBe(false);
  });
});
