import { describe, expect, it } from 'vitest';

import { type PriceRule, resolvePrice, resolveRangePrice } from './index.js';

const COURT_1 = 'court-1';
const COURT_2 = 'court-2';

function rule(over: Partial<PriceRule> & Pick<PriceRule, 'id' | 'pricePaise'>): PriceRule {
  return {
    name: over.id,
    courtId: null,
    weekdays: null,
    fromMinutes: null,
    toMinutes: null,
    priority: 0,
    validFrom: null,
    validTo: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

/** Saturday, 19:00, Court 1. */
const SATURDAY_EVENING = {
  courtId: COURT_1,
  weekday: 6,
  startMinutes: 1140,
  date: '2026-09-05',
};

describe('specificity', () => {
  it('prefers court + weekday + time over a court-only rule, even at lower priority', () => {
    const rules = [
      rule({ id: 'court-only', courtId: COURT_1, pricePaise: 80000, priority: 99 }),
      rule({
        id: 'peak',
        courtId: COURT_1,
        weekdays: [6, 0],
        fromMinutes: 1080,
        toMinutes: 1380,
        pricePaise: 120000,
        priority: 0,
      }),
    ];
    expect(resolvePrice(rules, SATURDAY_EVENING)).toEqual({
      pricePaise: 120000,
      ruleId: 'peak',
    });
  });

  it('prefers a weekday rule over a base rule', () => {
    const rules = [
      rule({ id: 'base', pricePaise: 80000 }),
      rule({ id: 'weekend', weekdays: [6, 0], pricePaise: 100000 }),
    ];
    expect(resolvePrice(rules, SATURDAY_EVENING)?.ruleId).toBe('weekend');
  });

  it('falls back to the base rule when nothing narrower matches', () => {
    const rules = [
      rule({ id: 'base', pricePaise: 80000 }),
      rule({ id: 'other-court', courtId: COURT_2, pricePaise: 200000 }),
    ];
    expect(resolvePrice(rules, SATURDAY_EVENING)?.ruleId).toBe('base');
  });
});

describe('tie-breaks', () => {
  it('uses priority when specificity is equal', () => {
    const rules = [
      rule({ id: 'low', weekdays: [6], pricePaise: 90000, priority: 1 }),
      rule({ id: 'high', weekdays: [6], pricePaise: 110000, priority: 5 }),
    ];
    expect(resolvePrice(rules, SATURDAY_EVENING)?.ruleId).toBe('high');
  });

  it('uses the newest rule when specificity and priority are equal', () => {
    const rules = [
      rule({ id: 'older', weekdays: [6], pricePaise: 90000, createdAt: '2026-01-01T00:00:00Z' }),
      rule({ id: 'newer', weekdays: [6], pricePaise: 110000, createdAt: '2026-06-01T00:00:00Z' }),
    ];
    expect(resolvePrice(rules, SATURDAY_EVENING)?.ruleId).toBe('newer');
  });
});

describe('time bands are half-open', () => {
  const evening = [
    rule({
      id: 'evening',
      fromMinutes: 1080, // 18:00
      toMinutes: 1380, // 23:00
      pricePaise: 120000,
    }),
  ];

  it('includes the slot starting exactly at fromMinutes', () => {
    expect(resolvePrice(evening, { ...SATURDAY_EVENING, startMinutes: 1080 })).not.toBeNull();
  });

  it('excludes the slot starting exactly at toMinutes', () => {
    expect(resolvePrice(evening, { ...SATURDAY_EVENING, startMinutes: 1380 })).toBeNull();
  });

  it('excludes a slot before the band', () => {
    expect(resolvePrice(evening, { ...SATURDAY_EVENING, startMinutes: 1020 })).toBeNull();
  });
});

describe('validity window and active flag', () => {
  it('ignores an inactive rule', () => {
    const rules = [
      rule({ id: 'off', weekdays: [6], pricePaise: 999999, isActive: false }),
      rule({ id: 'base', pricePaise: 80000 }),
    ];
    expect(resolvePrice(rules, SATURDAY_EVENING)?.ruleId).toBe('base');
  });

  it('ignores a rule that has not started', () => {
    const rules = [rule({ id: 'future', pricePaise: 80000, validFrom: '2026-10-01' })];
    expect(resolvePrice(rules, SATURDAY_EVENING)).toBeNull();
  });

  it('ignores a rule that has expired', () => {
    const rules = [rule({ id: 'past', pricePaise: 80000, validTo: '2026-08-31' })];
    expect(resolvePrice(rules, SATURDAY_EVENING)).toBeNull();
  });

  it('includes a rule on its boundary dates', () => {
    const rules = [
      rule({ id: 'window', pricePaise: 80000, validFrom: '2026-09-05', validTo: '2026-09-05' }),
    ];
    expect(resolvePrice(rules, SATURDAY_EVENING)?.ruleId).toBe('window');
  });
});

describe('no price configured', () => {
  // Null is not zero. The caller must refuse the booking, and the refusal is
  // logged so a missing rule shows on the dashboard.
  it('returns null rather than a free court', () => {
    expect(resolvePrice([], SATURDAY_EVENING)).toBeNull();
  });

  it('returns null when only another court is priced', () => {
    const rules = [rule({ id: 'c2', courtId: COURT_2, pricePaise: 80000 })];
    expect(resolvePrice(rules, SATURDAY_EVENING)).toBeNull();
  });
});

describe('multi-slot pricing', () => {
  const rules = [
    rule({ id: 'day', pricePaise: 80000 }),
    rule({ id: 'peak', fromMinutes: 1080, toMinutes: 1380, pricePaise: 120000 }),
  ];

  it('sums per slot so a booking crossing peak is priced correctly', () => {
    // 17:00-19:00 crosses the 18:00 peak boundary: ₹800 + ₹1,200.
    const total = resolveRangePrice(rules, SATURDAY_EVENING, [1020, 1080]);
    expect(total).toEqual({ pricePaise: 200000, ruleIds: ['day', 'peak'] });
  });

  it('prices two peak hours at the peak rate', () => {
    const total = resolveRangePrice(rules, SATURDAY_EVENING, [1140, 1200]);
    expect(total?.pricePaise).toBe(240000);
  });

  it('refuses the whole range if any single slot is unpriced', () => {
    const partial = [rule({ id: 'peak', fromMinutes: 1080, toMinutes: 1380, pricePaise: 120000 })];
    expect(resolveRangePrice(partial, SATURDAY_EVENING, [1020, 1080])).toBeNull();
  });
});

describe('Pavilion Club grid', () => {
  // Placeholder until the real price grid arrives (Q16).
  const grid = [
    rule({ id: 'base', pricePaise: 80000 }),
    rule({ id: 'evening', fromMinutes: 1080, toMinutes: 1380, pricePaise: 100000 }),
    rule({
      id: 'weekend-evening',
      weekdays: [6, 0],
      fromMinutes: 1080,
      toMinutes: 1380,
      pricePaise: 120000,
      priority: 1,
    }),
  ];

  it('charges ₹800 on a weekday morning', () => {
    expect(
      resolvePrice(grid, { courtId: COURT_1, weekday: 2, startMinutes: 540, date: '2026-09-08' })
        ?.pricePaise,
    ).toBe(80000);
  });

  it('charges ₹1,000 on a weekday evening', () => {
    expect(
      resolvePrice(grid, { courtId: COURT_1, weekday: 2, startMinutes: 1140, date: '2026-09-08' })
        ?.pricePaise,
    ).toBe(100000);
  });

  it('charges ₹1,200 on a Saturday evening', () => {
    expect(resolvePrice(grid, SATURDAY_EVENING)?.pricePaise).toBe(120000);
  });

  it('charges the base rate for the 23:00 slot, outside the evening band', () => {
    expect(resolvePrice(grid, { ...SATURDAY_EVENING, startMinutes: 1380 })?.pricePaise).toBe(80000);
  });
});
