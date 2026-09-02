import { describe, expect, it } from 'vitest';

import { applyBps, formatPaise, formatPaiseBare, isPaise, rupeesToPaise, sumPaise } from './index.js';

describe('formatting', () => {
  it('formats whole rupees without decimals', () => {
    expect(formatPaise(120000)).toBe('₹1,200');
    expect(formatPaise(0)).toBe('₹0');
  });

  it('shows paise only when there are any', () => {
    expect(formatPaise(120050)).toBe('₹1,200.50');
  });

  it('uses Indian grouping for large amounts', () => {
    // An Indian owner reads 1,20,000 — not 120,000.
    expect(formatPaise(12000000)).toBe('₹1,20,000');
  });

  it('strips the symbol when the header carries it', () => {
    expect(formatPaiseBare(120000)).toBe('1,200');
  });
});

describe('parsing', () => {
  it('converts rupees to paise', () => {
    expect(rupeesToPaise('1200')).toBe(120000);
    expect(rupeesToPaise(1200)).toBe(120000);
  });

  it('avoids float error on fractional rupees', () => {
    // 12.30 * 100 is 1229.9999999999998 in IEEE 754.
    expect(rupeesToPaise('12.30')).toBe(1230);
    expect(rupeesToPaise('0.01')).toBe(1);
    expect(rupeesToPaise('1200.05')).toBe(120005);
  });

  it('accepts an amount as typed by a person', () => {
    expect(rupeesToPaise('₹1,200.50')).toBe(120050);
    expect(rupeesToPaise('  1200  ')).toBe(120000);
  });

  it('pads a single decimal place', () => {
    expect(rupeesToPaise('12.5')).toBe(1250);
  });

  it('rejects anything that is not an amount', () => {
    expect(() => rupeesToPaise('free')).toThrow();
    expect(() => rupeesToPaise('12.345')).toThrow();
    expect(() => rupeesToPaise('')).toThrow();
  });

  it('round-trips through formatting', () => {
    for (const paise of [0, 1, 99, 100, 120000, 12000000]) {
      expect(rupeesToPaise(formatPaise(paise))).toBe(paise);
    }
  });
});

describe('arithmetic', () => {
  it('sums, tolerating an empty list', () => {
    expect(sumPaise([])).toBe(0);
    expect(sumPaise([120000, 80000, 100000])).toBe(300000);
  });

  it('applies basis points for partner commission', () => {
    // 15% of ₹1,200 is ₹180.
    expect(applyBps(120000, 1500)).toBe(18000);
    expect(applyBps(120000, 0)).toBe(0);
  });

  it('rounds a fractional commission to whole paise', () => {
    expect(applyBps(12345, 1500)).toBe(1852); // 1851.75
  });

  it('stays an integer across a month of bookings', () => {
    const month = Array.from({ length: 37 }, () => 120000);
    const gross = sumPaise(month);
    const commission = applyBps(gross, 1500);
    expect(Number.isInteger(commission)).toBe(true);
    expect(gross - commission).toBe(3774000); // ₹37,740 net
  });
});

describe('isPaise', () => {
  it('accepts a storable amount', () => {
    expect(isPaise(0)).toBe(true);
    expect(isPaise(120000)).toBe(true);
  });

  it('rejects floats, negatives and non-numbers', () => {
    expect(isPaise(1200.5)).toBe(false);
    expect(isPaise(-1)).toBe(false);
    expect(isPaise('1200')).toBe(false);
    expect(isPaise(NaN)).toBe(false);
  });
});
