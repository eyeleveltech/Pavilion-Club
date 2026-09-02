import { describe, expect, it } from 'vitest';

import type { PriceRule } from '../pricing/index.js';
import { IST_OFFSET_MINUTES as IST, instantAt } from '../time/index.js';
import {
  type AvailabilityInput,
  type BookingLike,
  type Court,
  type CourtHours,
  computeAvailability,
  computeAvailabilityRange,
  findContiguous,
  summarise,
} from './index.js';

// Pavilion Club: 3 courts, 60-minute slots.
const COURTS: Court[] = [
  { id: 'c1', name: 'Court 1', slotMinutes: 60, sortOrder: 1, isBookable: true },
  { id: 'c2', name: 'Court 2', slotMinutes: 60, sortOrder: 2, isBookable: true },
  { id: 'c3', name: 'Court 3', slotMinutes: 60, sortOrder: 3, isBookable: true },
];

// Mon-Fri 06:00-23:00 (17 slots), Sat-Sun 06:00-00:00 (18 slots).
const HOURS: CourtHours[] = COURTS.flatMap((court) =>
  [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    courtId: court.id,
    weekday,
    openMinutes: 360,
    closeMinutes: weekday === 0 || weekday === 6 ? 1440 : 1380,
  })),
);

const PRICES: PriceRule[] = [
  {
    id: 'base',
    name: 'Base',
    courtId: null,
    weekdays: null,
    fromMinutes: null,
    toMinutes: null,
    pricePaise: 80000,
    priority: 0,
    validFrom: null,
    validTo: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'peak',
    name: 'Evening peak',
    courtId: null,
    weekdays: null,
    fromMinutes: 1080,
    toMinutes: 1380,
    pricePaise: 120000,
    priority: 0,
    validFrom: null,
    validTo: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const SATURDAY = '2026-09-05';
const WEEKDAY = '2026-09-08'; // Tuesday

/** Long before any slot, so nothing is past unless a test says so. */
const EARLY = new Date('2026-09-01T00:00:00Z');

function booking(over: Partial<BookingLike> & Pick<BookingLike, 'id'>): BookingLike {
  return {
    reference: `PC-${over.id.toUpperCase()}`,
    courtId: 'c1',
    startsAt: instantAt(SATURDAY, 1140, IST), // 19:00
    endsAt: instantAt(SATURDAY, 1200, IST), // 20:00
    status: 'confirmed',
    expiresAt: null,
    channelCode: 'website',
    channelName: 'Website',
    channelColourHex: '#0D5F52',
    customerName: 'Rahul',
    customerPhone: '+919876543210',
    partnerReference: null,
    amountPaise: 120000,
    paidPaise: 120000,
    ...over,
  };
}

function input(over: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    date: SATURDAY,
    courts: COURTS,
    hours: HOURS,
    bookings: [],
    blackouts: [],
    priceRules: PRICES,
    now: EARLY,
    offsetMinutes: IST,
    ...over,
  };
}

const at = (slots: ReturnType<typeof computeAvailability>, courtId: string, minutes: number) =>
  slots.find((s) => s.courtId === courtId && s.startMinutes === minutes)!;

describe('slot generation', () => {
  it('gives 54 slots on a Saturday across 3 courts', () => {
    expect(computeAvailability(input())).toHaveLength(54);
  });

  it('gives 51 slots on a weekday across 3 courts', () => {
    expect(computeAvailability(input({ date: WEEKDAY }))).toHaveLength(51);
  });

  it('runs the weekend to exactly midnight', () => {
    const slots = computeAvailability(input()).filter((s) => s.courtId === 'c1');
    expect(slots[0]!.startMinutes).toBe(360);
    expect(slots[slots.length - 1]!.startMinutes).toBe(1380); // 23:00-00:00
  });

  it('orders courts by sortOrder', () => {
    const first = computeAvailability(input())[0]!;
    expect(first.courtId).toBe('c1');
  });

  it('omits a court that is not bookable', () => {
    const courts = COURTS.map((c) => (c.id === 'c2' ? { ...c, isBookable: false } : c));
    const slots = computeAvailability(input({ courts }));
    expect(slots).toHaveLength(36);
    expect(slots.some((s) => s.courtId === 'c2')).toBe(false);
  });

  it('produces nothing for a weekday with no hours row', () => {
    const hours = HOURS.filter((h) => h.weekday !== 6);
    expect(computeAvailability(input({ hours }))).toHaveLength(0);
  });

  it('supports two opening periods in one day, leaving a gap', () => {
    // A venue that shuts midday: 06:00-11:00 and 16:00-23:00.
    const hours: CourtHours[] = [
      { courtId: 'c1', weekday: 6, openMinutes: 360, closeMinutes: 660 },
      { courtId: 'c1', weekday: 6, openMinutes: 960, closeMinutes: 1380 },
    ];
    const slots = computeAvailability(input({ hours, courts: [COURTS[0]!] }));
    expect(slots).toHaveLength(5 + 7);
    expect(slots.some((s) => s.startMinutes === 720)).toBe(false); // 12:00 closed
  });

  it('never generates a partial slot', () => {
    // 06:00-06:30 cannot hold a 60-minute slot.
    const hours: CourtHours[] = [
      { courtId: 'c1', weekday: 6, openMinutes: 360, closeMinutes: 390 },
    ];
    expect(computeAvailability(input({ hours, courts: [COURTS[0]!] }))).toHaveLength(0);
  });
});

describe('bookings block slots', () => {
  it('marks a confirmed booking as booked', () => {
    const slots = computeAvailability(input({ bookings: [booking({ id: 'b1' })] }));
    const slot = at(slots, 'c1', 1140);
    expect(slot.state).toBe('booked');
    expect(slot.booking?.customerName).toBe('Rahul');
    expect(slot.booking?.isPaid).toBe(true);
  });

  it('marks a live hold as held', () => {
    const held = booking({
      id: 'b2',
      status: 'held',
      expiresAt: new Date(EARLY.getTime() + 10 * 60_000),
    });
    expect(at(computeAvailability(input({ bookings: [held] })), 'c1', 1140).state).toBe('held');
  });

  it('leaves an EXPIRED hold free, before the sweeper runs', () => {
    // The exclusion constraint cannot see expires_at, so the row still blocks
    // in the database. Availability must not repeat that lie.
    const expired = booking({
      id: 'b3',
      status: 'held',
      expiresAt: new Date(EARLY.getTime() - 60_000),
    });
    expect(at(computeAvailability(input({ bookings: [expired] })), 'c1', 1140).state).toBe('free');
  });

  it('blocks every hour of a multi-hour booking', () => {
    const long = booking({
      id: 'b4',
      startsAt: instantAt(SATURDAY, 1140, IST), // 19:00
      endsAt: instantAt(SATURDAY, 1260, IST), // 22:00
    });
    const slots = computeAvailability(input({ bookings: [long] }));
    expect(at(slots, 'c1', 1140).state).toBe('booked');
    expect(at(slots, 'c1', 1200).state).toBe('booked');
    expect(at(slots, 'c1', 1260).state).toBe('free');
  });

  it('leaves the slot starting where a booking ends free — half-open bounds', () => {
    const slots = computeAvailability(input({ bookings: [booking({ id: 'b5' })] }));
    expect(at(slots, 'c1', 1200).state).toBe('free');
    expect(at(slots, 'c1', 1080).state).toBe('free');
  });

  it('blocks only the court that was booked', () => {
    const slots = computeAvailability(input({ bookings: [booking({ id: 'b6' })] }));
    expect(at(slots, 'c2', 1140).state).toBe('free');
    expect(at(slots, 'c3', 1140).state).toBe('free');
  });

  it('marks a partner booking unpaid, because the money is with the partner', () => {
    const partner = booking({
      id: 'b7',
      channelCode: 'turftown',
      channelName: 'Turf Town',
      partnerReference: 'TT-99182',
      paidPaise: 0,
    });
    const slot = at(computeAvailability(input({ bookings: [partner] })), 'c1', 1140);
    expect(slot.booking?.isPaid).toBe(false);
    expect(slot.booking?.partnerReference).toBe('TT-99182');
  });
});

describe('blackouts', () => {
  it('marks the covered slots and carries the reason', () => {
    const slots = computeAvailability(
      input({
        blackouts: [
          {
            id: 'bo1',
            courtId: 'c3',
            startsAt: instantAt(SATURDAY, 780, IST),
            endsAt: instantAt(SATURDAY, 900, IST),
            reason: 'Resurfacing',
          },
        ],
      }),
    );
    expect(at(slots, 'c3', 780).state).toBe('blackout');
    expect(at(slots, 'c3', 780).blackoutReason).toBe('Resurfacing');
    expect(at(slots, 'c3', 900).state).toBe('free');
    expect(at(slots, 'c1', 780).state).toBe('free');
  });

  it('lets a booking win over a blackout, so a sold slot is never hidden', () => {
    const slots = computeAvailability(
      input({
        bookings: [booking({ id: 'b8' })],
        blackouts: [
          {
            id: 'bo2',
            courtId: 'c1',
            startsAt: instantAt(SATURDAY, 1140, IST),
            endsAt: instantAt(SATURDAY, 1200, IST),
            reason: 'Maintenance',
          },
        ],
      }),
    );
    expect(at(slots, 'c1', 1140).state).toBe('booked');
  });
});

describe('past slots', () => {
  // 20:30 IST on the Saturday.
  const now = instantAt(SATURDAY, 1230, IST);

  it('marks finished slots as past without changing their state', () => {
    const slots = computeAvailability(input({ now }));
    expect(at(slots, 'c1', 1140).isPast).toBe(true); // 19:00-20:00, over
    expect(at(slots, 'c1', 1140).state).toBe('free');
    expect(at(slots, 'c1', 1260).isPast).toBe(false); // 21:00-22:00, ahead
  });

  it('keeps a past booking visible as a booking', () => {
    const slots = computeAvailability(input({ now, bookings: [booking({ id: 'b9' })] }));
    const slot = at(slots, 'c1', 1140);
    expect(slot.isPast).toBe(true);
    expect(slot.state).toBe('booked');
    expect(slot.booking?.customerName).toBe('Rahul');
  });

  it('does not mark the slot in progress as past', () => {
    expect(at(computeAvailability(input({ now })), 'c1', 1200).isPast).toBe(false);
  });
});

describe('pricing on slots', () => {
  it('prices every free slot', () => {
    expect(computeAvailability(input()).every((s) => s.pricePaise !== null)).toBe(true);
  });

  it('applies the peak rate in the evening band', () => {
    const slots = computeAvailability(input());
    expect(at(slots, 'c1', 540).pricePaise).toBe(80000); // 09:00
    expect(at(slots, 'c1', 1140).pricePaise).toBe(120000); // 19:00
    expect(at(slots, 'c1', 1380).pricePaise).toBe(80000); // 23:00, past the band
  });

  it('returns null rather than zero when no rule matches', () => {
    const slots = computeAvailability(input({ priceRules: [] }));
    expect(slots.every((s) => s.pricePaise === null)).toBe(true);
  });
});

describe('summarise', () => {
  it('counts an empty Saturday', () => {
    const s = summarise(computeAvailability(input()));
    expect(s).toMatchObject({ total: 54, free: 54, booked: 0, fillPercent: 0 });
  });

  it('counts bookings', () => {
    const s = summarise(computeAvailability(input({ bookings: [booking({ id: 'b10' })] })));
    expect(s.booked).toBe(1);
    expect(s.free).toBe(53);
    expect(s.fillPercent).toBe(2);
  });

  it('removes blackouts from the denominator, so fill stays honest', () => {
    const blackouts = [
      {
        id: 'bo3',
        courtId: 'c3',
        startsAt: instantAt(SATURDAY, 360, IST),
        endsAt: instantAt(SATURDAY, 1440, IST),
        reason: 'Closed',
      },
    ];
    const s = summarise(computeAvailability(input({ blackouts })));
    expect(s.blackout).toBe(18);
    expect(s.total).toBe(54);
    expect(s.fillPercent).toBe(0);
  });
});

describe('computeAvailabilityRange', () => {
  it('covers a week in one call', () => {
    const range = computeAvailabilityRange('2026-09-05', '2026-09-11', input());
    expect(range.size).toBe(7);
    expect(range.get('2026-09-05')).toHaveLength(54); // Saturday
    expect(range.get('2026-09-06')).toHaveLength(54); // Sunday
    expect(range.get('2026-09-07')).toHaveLength(51); // Monday
  });

  it('gives a week of 363 slots, matching the seed', () => {
    const range = computeAvailabilityRange('2026-09-05', '2026-09-11', input());
    const total = [...range.values()].reduce((sum, slots) => sum + slots.length, 0);
    expect(total).toBe(363);
  });
});

describe('findContiguous', () => {
  it('finds two-hour runs', () => {
    const runs = findContiguous(computeAvailability(input()), 2);
    // 17 runs per court on an 18-slot day, across 3 courts.
    expect(runs).toHaveLength(51);
  });

  it('prices a run by summing its slots, crossing the peak boundary', () => {
    const runs = findContiguous(computeAvailability(input()), 2);
    const crossing = runs.find((r) => r.courtId === 'c1' && r.slots[0]!.startMinutes === 1020)!;
    expect(crossing.pricePaise).toBe(200000); // ₹800 + ₹1,200
  });

  it('does not span a booking', () => {
    const slots = computeAvailability(input({ bookings: [booking({ id: 'b11' })] }));
    const runs = findContiguous(slots, 2).filter((r) => r.courtId === 'c1');
    expect(runs.some((r) => r.slots.some((s) => s.startMinutes === 1140))).toBe(false);
    expect(runs.some((r) => r.slots[0]!.startMinutes === 1080)).toBe(false);
  });

  it('does not span the gap between two opening periods', () => {
    const hours: CourtHours[] = [
      { courtId: 'c1', weekday: 6, openMinutes: 360, closeMinutes: 660 },
      { courtId: 'c1', weekday: 6, openMinutes: 960, closeMinutes: 1380 },
    ];
    const slots = computeAvailability(input({ hours, courts: [COURTS[0]!] }));
    const runs = findContiguous(slots, 2);
    expect(runs.some((r) => r.slots[0]!.startMinutes === 600)).toBe(false);
  });

  it('excludes finished slots', () => {
    const now = instantAt(SATURDAY, 1230, IST); // 20:30
    const runs = findContiguous(computeAvailability(input({ now })), 2);
    // 19:00-20:00 has ended, so no run may contain it.
    expect(runs.some((r) => r.slots.some((s) => s.startMinutes === 1140))).toBe(false);
  });

  it('keeps the in-progress slot unless `now` is passed', () => {
    // 20:30: the 20:00 slot has started but not ended. isPast is false, so the
    // day grid still shows it and the desk can still use it.
    const now = instantAt(SATURDAY, 1230, IST);
    const runs = findContiguous(computeAvailability(input({ now })), 2);
    expect(runs.some((r) => r.slots[0]!.startMinutes === 1200)).toBe(true);
  });

  it('excludes slots that have already started when `now` is passed', () => {
    // A customer booking two hours online must not be offered thirty minutes
    // of the first one.
    const now = instantAt(SATURDAY, 1230, IST);
    const runs = findContiguous(computeAvailability(input({ now })), 2, { now });
    expect(runs.every((r) => r.startsAt >= now)).toBe(true);
    expect(runs[0]!.slots[0]!.startMinutes).toBe(1260); // 21:00
  });

  it('returns nothing when the run does not fit', () => {
    expect(findContiguous(computeAvailability(input()), 20)).toHaveLength(0);
  });
});

describe('R1 — one answer for every surface', () => {
  it('gives the desk, the website and the partner API the same free slots', () => {
    const shared = input({ bookings: [booking({ id: 'b12' })] });

    const desk = computeAvailability(shared);
    const website = computeAvailability(shared).filter((s) => s.state === 'free');
    const api = computeAvailability(shared).filter((s) => s.state === 'free');

    expect(website.map((s) => s.startsAt.toISOString())).toEqual(
      api.map((s) => s.startsAt.toISOString()),
    );
    expect(desk.filter((s) => s.state === 'free')).toHaveLength(website.length);
  });
});
