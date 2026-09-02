/**
 * Time, in one place.
 *
 * Everything in the database is `timestamptz` (UTC). Everything a person sees
 * is the venue's local wall clock. This module is the only thing that converts
 * between them.
 *
 * India has no daylight saving, so a fixed numeric offset is exact — but the
 * offset is always passed in rather than hardcoded, because
 * `venue_settings.timezone` is the source of truth and a component must never
 * assume Asia/Kolkata.
 *
 * See ../../../plan/05-booking-engine.md
 */

/** Asia/Kolkata is UTC+05:30, year round. */
export const IST_OFFSET_MINUTES = 330;

export const MINUTES_PER_DAY = 1440;

/** A calendar date in the venue's timezone, as `YYYY-MM-DD`. */
export type Ymd = string;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/**
 * Shift an instant so its UTC fields read as the venue's wall clock.
 * Internal: the result is NOT a real instant, only a convenient carrier.
 */
function asWallClock(at: Date, offsetMinutes: number): Date {
  return new Date(at.getTime() + offsetMinutes * 60_000);
}

/** `YYYY-MM-DD` from a wall-clock carrier. */
function ymdOf(wall: Date): Ymd {
  return `${wall.getUTCFullYear()}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}`;
}

/** The venue-local calendar date of an instant. Not the business date. */
export function localDate(at: Date, offsetMinutes: number): Ymd {
  return ymdOf(asWallClock(at, offsetMinutes));
}

/** Minutes from local midnight. 23:00 is 1380. */
export function localMinutes(at: Date, offsetMinutes: number): number {
  const wall = asWallClock(at, offsetMinutes);
  return wall.getUTCHours() * 60 + wall.getUTCMinutes();
}

/** Day of week in the venue's timezone. 0 = Sunday, matching `court_hours.weekday`. */
export function localWeekday(at: Date, offsetMinutes: number): number {
  return asWallClock(at, offsetMinutes).getUTCDay();
}

/**
 * The business date an instant belongs to.
 *
 * A venue open past midnight closes one *night*, not two days. With
 * `startHour = 5`, a 00:30 booking reports against the previous calendar date,
 * so the daily close at 23:45 covers the whole evening.
 *
 * MUST be computed here and written onto the row. Postgres rejects
 * `AT TIME ZONE` inside a generated column — it is STABLE, not IMMUTABLE.
 */
export function businessDate(at: Date, offsetMinutes: number, startHour: number): Ymd {
  const wall = asWallClock(at, offsetMinutes);
  if (wall.getUTCHours() < startHour) {
    wall.setUTCDate(wall.getUTCDate() - 1);
  }
  return ymdOf(wall);
}

/**
 * The instant at which `minutes` past midnight on `date` occurs.
 *
 * `minutes` may exceed 1440: a court open 06:00–02:00 has
 * `close_minutes = 1560`, and 1500 means 01:00 the following morning — still
 * part of `date`'s sheet.
 */
export function instantAt(date: Ymd, minutes: number, offsetMinutes: number): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d) + (minutes - offsetMinutes) * 60_000);
}

/** `1380` → `"23:00"`, `1440` → `"00:00"`, `1560` → `"02:00"`. */
export function minutesToLabel(minutes: number): string {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

/** `"23:00"` → `1380`. Accepts `"6:00"` as well as `"06:00"`. */
export function labelToMinutes(label: string): number {
  const [h, m] = label.split(':').map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) {
    throw new Error(`Not a time: ${label}`);
  }
  return h * 60 + m;
}

/** Shift a `YYYY-MM-DD` by whole days. Timezone-free — it is a calendar date. */
export function shiftDate(date: Ymd, days: number): Ymd {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return ymdOf(new Date(Date.UTC(y, m - 1, d + days)));
}

/** Whole days between two dates, `to - from`. */
export function daysBetween(from: Ymd, to: Ymd): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Every date from `from` to `to`, inclusive. */
export function dateRange(from: Ymd, to: Ymd): Ymd[] {
  const out: Ymd[] = [];
  for (let i = 0; i <= daysBetween(from, to); i++) out.push(shiftDate(from, i));
  return out;
}

/** Weekday of a `YYYY-MM-DD`. 0 = Sunday. */
export function weekdayOf(date: Ymd): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Is this a valid `YYYY-MM-DD`? Rejects `2026-02-30`. */
export function isYmd(value: unknown): value is Ymd {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && ymdOf(parsed) === value;
}
