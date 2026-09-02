import { describe, expect, it } from 'vitest';

import {
  IST_OFFSET_MINUTES as IST,
  businessDate,
  dateRange,
  daysBetween,
  instantAt,
  isYmd,
  labelToMinutes,
  localDate,
  localMinutes,
  localWeekday,
  minutesToLabel,
  shiftDate,
  weekdayOf,
} from './index.js';

/** A wall-clock IST time, as a real instant. Keeps the tests readable. */
const ist = (s: string) => new Date(`${s}+05:30`);

describe('business date', () => {
  // The rule the whole reporting model rests on: a venue open past midnight
  // closes one night, not two days.
  it('puts 00:30 on the previous business date', () => {
    expect(businessDate(ist('2026-09-06T00:30'), IST, 5)).toBe('2026-09-05');
  });

  it('puts 04:59 on the previous business date', () => {
    expect(businessDate(ist('2026-09-06T04:59'), IST, 5)).toBe('2026-09-05');
  });

  it('starts the new business date exactly at the start hour', () => {
    expect(businessDate(ist('2026-09-06T05:00'), IST, 5)).toBe('2026-09-06');
  });

  it('keeps a 23:00 booking on its own date', () => {
    expect(businessDate(ist('2026-09-06T23:00'), IST, 5)).toBe('2026-09-06');
  });

  it('rolls the month boundary backwards', () => {
    expect(businessDate(ist('2026-10-01T01:00'), IST, 5)).toBe('2026-09-30');
  });

  it('rolls the year boundary backwards', () => {
    expect(businessDate(ist('2027-01-01T02:30'), IST, 5)).toBe('2026-12-31');
  });

  it('is unaffected by the UTC date differing from the local one', () => {
    // 2026-09-05T19:00Z is 2026-09-06T00:30 IST.
    expect(businessDate(new Date('2026-09-05T19:00:00Z'), IST, 5)).toBe('2026-09-05');
  });
});

describe('local fields', () => {
  it('reads the local date, not the UTC one', () => {
    expect(localDate(new Date('2026-09-05T19:00:00Z'), IST)).toBe('2026-09-06');
  });

  it('reads minutes from local midnight', () => {
    expect(localMinutes(ist('2026-09-06T19:00'), IST)).toBe(1140);
    expect(localMinutes(ist('2026-09-06T00:00'), IST)).toBe(0);
  });

  it('reads the local weekday with Sunday as 0', () => {
    expect(localWeekday(ist('2026-09-06T12:00'), IST)).toBe(0); // Sunday
    expect(localWeekday(ist('2026-09-05T12:00'), IST)).toBe(6); // Saturday
  });
});

describe('instantAt', () => {
  it('converts a slot start to UTC', () => {
    // Saturday 19:00 IST is 13:30 UTC.
    expect(instantAt('2026-09-05', 1140, IST).toISOString()).toBe('2026-09-05T13:30:00.000Z');
  });

  it('treats 1440 as midnight ending the day', () => {
    // Pavilion Club's weekend close. The last slot is 23:00-00:00.
    expect(instantAt('2026-09-05', 1440, IST).toISOString()).toBe('2026-09-05T18:30:00.000Z');
  });

  it('carries past midnight for a late-closing venue', () => {
    // close_minutes 1560 = 02:00 the next morning, still Saturday's sheet.
    expect(instantAt('2026-09-05', 1560, IST).toISOString()).toBe('2026-09-05T20:30:00.000Z');
  });

  it('round-trips with businessDate for a cross-midnight slot', () => {
    const at = instantAt('2026-09-05', 1500, IST); // 01:00 Sunday
    expect(localDate(at, IST)).toBe('2026-09-06'); // calendar date is Sunday
    expect(businessDate(at, IST, 5)).toBe('2026-09-05'); // but it reports as Saturday
  });
});

describe('minute labels', () => {
  it('formats within the day', () => {
    expect(minutesToLabel(360)).toBe('06:00');
    expect(minutesToLabel(1380)).toBe('23:00');
  });

  it('formats midnight as 00:00, not 24:00', () => {
    expect(minutesToLabel(1440)).toBe('00:00');
  });

  it('wraps past midnight', () => {
    expect(minutesToLabel(1560)).toBe('02:00');
  });

  it('parses back', () => {
    expect(labelToMinutes('06:00')).toBe(360);
    expect(labelToMinutes('6:00')).toBe(360);
    expect(labelToMinutes('23:00')).toBe(1380);
  });

  it('rejects nonsense', () => {
    expect(() => labelToMinutes('evening')).toThrow();
  });
});

describe('calendar arithmetic', () => {
  it('shifts dates across a month boundary', () => {
    expect(shiftDate('2026-09-30', 1)).toBe('2026-10-01');
    expect(shiftDate('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('handles a leap day', () => {
    expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('counts days between', () => {
    expect(daysBetween('2026-09-01', '2026-09-30')).toBe(29);
  });

  it('builds an inclusive range', () => {
    expect(dateRange('2026-09-05', '2026-09-07')).toEqual([
      '2026-09-05',
      '2026-09-06',
      '2026-09-07',
    ]);
  });

  it('reads the weekday of a date', () => {
    expect(weekdayOf('2026-09-06')).toBe(0); // Sunday
    expect(weekdayOf('2026-09-05')).toBe(6); // Saturday
  });
});

describe('isYmd', () => {
  it('accepts a real date', () => {
    expect(isYmd('2026-09-05')).toBe(true);
  });

  it('rejects a date that does not exist', () => {
    expect(isYmd('2026-02-30')).toBe(false);
  });

  it('rejects wrong shapes and non-strings', () => {
    expect(isYmd('05-09-2026')).toBe(false);
    expect(isYmd('2026-9-5')).toBe(false);
    expect(isYmd(20260905)).toBe(false);
    expect(isYmd(undefined)).toBe(false);
  });
});

describe('Pavilion Club hours', () => {
  // Mon-Fri 06:00-23:00 (360-1380), Sat-Sun 06:00-00:00 (360-1440).
  it('gives 17 hourly slots on a weekday', () => {
    expect((1380 - 360) / 60).toBe(17);
  });

  it('gives 18 hourly slots at the weekend', () => {
    expect((1440 - 360) / 60).toBe(18);
  });

  it('ends the weekend exactly at midnight, so nothing crosses into the next day', () => {
    const lastSlotEnd = instantAt('2026-09-05', 1440, IST);
    expect(localMinutes(lastSlotEnd, IST)).toBe(0);
    expect(localDate(lastSlotEnd, IST)).toBe('2026-09-06');
    // ...but it still belongs to Saturday's sheet.
    expect(businessDate(new Date(lastSlotEnd.getTime() - 1), IST, 5)).toBe('2026-09-05');
  });
});
