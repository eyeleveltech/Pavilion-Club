'use client';

import { useEffect, useRef } from 'react';

import { ChevronButton, cx } from './ui';

/**
 * The pieces of the "choose a time" screen: court pills, a date strip, period
 * tabs and the hour tracks. Presentational only — what is free, what is
 * selected and what a tap does are all decided by the booking flow.
 */

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

/* ------------------------------------------------------------------ */
/* Court                                                               */
/* ------------------------------------------------------------------ */

export function CourtPills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Court"
      className="-mx-5 flex gap-1 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.value)}
            className={cx(
              'h-11 flex-none whitespace-nowrap rounded-full px-5 text-[15px] font-semibold transition-colors',
              ring,
              on ? 'bg-navy text-white' : 'text-ink-faint hover:bg-surface-2 hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Shorten sibling names for a pill row by dropping the words they all start
 * with, keeping the last shared word: "PlayStation Deck 1/2/3" -> "Deck 1/2/3",
 * "Court 1/2/3" stays "Court 1/2/3". A lone name is left alone.
 */
export function shortNames(names: string[]): string[] {
  if (names.length < 2) return names;
  const words = names.map((n) => n.trim().split(/\s+/));
  let shared = 0;
  while (words.every((w) => w.length > shared + 1 && w[shared] === words[0]![shared])) shared += 1;
  const drop = Math.max(0, shared - 1);
  return words.map((w) => w.slice(drop).join(' '));
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

/** One tab per activity the venue offers. Scrolls sideways when there are many. */
export function ActivityTabs({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; note: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Activity"
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex h-12 flex-none items-center gap-2 rounded-lg border px-4 text-[15px] font-semibold transition-colors',
              ring,
              on ? 'border-navy bg-navy text-white' : 'border-border bg-surface text-ink hover:border-border-strong',
            )}
          >
            {option.label}
            <span
              className={cx(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                on ? 'bg-white/10 text-gold' : 'bg-surface-2 text-ink-faint',
              )}
            >
              {option.note}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Date                                                                */
/* ------------------------------------------------------------------ */

export interface DayOption {
  ymd: string;
  weekday: string;
  date: string;
}

export function DateStrip({
  days,
  value,
  onChange,
}: {
  days: DayOption[];
  value: string;
  onChange: (ymd: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the chosen day in view, e.g. after arriving with ?date=.
  useEffect(() => {
    scroller.current
      ?.querySelector<HTMLElement>('[aria-checked="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <ChevronButton direction="prev" label="Earlier dates" onClick={() => page(-1)} />
      <div
        ref={scroller}
        role="radiogroup"
        aria-label="Date"
        className="flex min-w-0 flex-1 snap-x gap-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((day) => {
          const on = day.ymd === value;
          return (
            <button
              key={day.ymd}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${day.weekday}, ${day.date}`}
              onClick={() => onChange(day.ymd)}
              className={cx(
                'grid w-[4.6rem] flex-none snap-start justify-items-center gap-0.5 rounded-xl py-3 transition-colors sm:w-[5.5rem]',
                ring,
                on ? 'bg-navy text-white' : 'text-ink-faint hover:bg-surface-2 hover:text-ink',
              )}
            >
              <span className="text-[15px] font-semibold">{day.weekday}</span>
              <span className={cx('text-[13px]', on ? 'text-gold' : '')}>{day.date}</span>
            </button>
          );
        })}
      </div>
      <ChevronButton direction="next" label="Later dates" onClick={() => page(1)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Period                                                              */
/* ------------------------------------------------------------------ */

export type PeriodKey = 'twilight' | 'morning' | 'noon' | 'evening';

/** Six hours each, so every period is exactly two tracks of three hours. */
export const PERIODS: { key: PeriodKey; label: string; from: number }[] = [
  { key: 'twilight', label: 'Twilight', from: 0 },
  { key: 'morning', label: 'Morning', from: 6 },
  { key: 'noon', label: 'Noon', from: 12 },
  { key: 'evening', label: 'Evening', from: 18 },
];

export function periodOf(hour: number): PeriodKey {
  return PERIODS[Math.floor((((hour % 24) + 24) % 24) / 6)]!.key;
}

function PeriodIcon({ period }: { period: PeriodKey }) {
  const paths: Record<PeriodKey, React.ReactNode> = {
    twilight: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
    morning: (
      <>
        <path d="M4 18h16M7 14a5 5 0 0 1 10 0" />
        <path d="M12 4v3M5.6 7.6l1.6 1.6M18.4 7.6l-1.6 1.6" />
      </>
    ),
    noon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
      </>
    ),
    evening: (
      <>
        <path d="M4 18h16M7 14a5 5 0 0 1 10 0" />
        <path d="M12 10V4M9.5 6.5L12 4l2.5 2.5" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[period]}
    </svg>
  );
}

export function PeriodTabs({
  value,
  onChange,
  open,
}: {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
  /** Periods with at least one bookable hour. The rest are shown but greyed. */
  open: Record<PeriodKey, boolean>;
}) {
  return (
    <div role="tablist" aria-label="Time of day" className="grid grid-cols-4 gap-1">
      {PERIODS.map((period) => {
        const on = period.key === value;
        return (
          <button
            key={period.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(period.key)}
            className={cx(
              'inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-2 text-[14px] font-semibold transition-colors sm:text-[15px]',
              ring,
              on ? 'bg-navy text-white' : 'text-ink-faint hover:bg-surface-2 hover:text-ink',
              !on && !open[period.key] && 'text-[#b3ada1]',
            )}
          >
            {on ? (
              <span className="hidden text-gold min-[400px]:inline">
                <PeriodIcon period={period.key} />
              </span>
            ) : null}
            {period.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hour tracks                                                         */
/* ------------------------------------------------------------------ */

export type CellState = 'open' | 'selected' | 'booked' | 'past' | 'closed';

export interface TrackCell {
  hour: number;
  state: CellState;
  /** Spoken label, e.g. "6 pm to 7 pm, ₹1,000". */
  label: string;
  /** Short text shown inside the cell, e.g. "2 left" when some courts are taken. */
  note?: string | undefined;
  onTap?: () => void;
}

export function hourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'am' : 'pm'}`;
}

function Track({ cells }: { cells: TrackCell[] }) {
  const first = cells[0]!.hour;
  const marks = [0, 1, 2, 3];
  return (
    <div>
      {/* hour marks sit on the cell boundaries, like a ruler */}
      <div className="relative mb-2 h-5 text-[13px] font-semibold text-ink">
        {marks.map((i) => (
          <span
            key={i}
            className={cx(
              'absolute top-0 whitespace-nowrap',
              i === 0 && 'left-0',
              i === 3 && 'right-0',
              (i === 1 || i === 2) && '-translate-x-1/2',
            )}
            style={i === 1 || i === 2 ? { left: `${(i / 3) * 100}%` } : undefined}
          >
            {hourLabel(first + i)}
          </span>
        ))}
      </div>
      <div className="grid h-12 grid-cols-3 divide-x divide-border-strong overflow-hidden rounded-full border border-border-strong bg-surface">
        {cells.map((cell) => {
          const tappable = cell.state === 'open' || cell.state === 'selected';
          return (
            <button
              key={cell.hour}
              type="button"
              disabled={!tappable}
              aria-pressed={cell.state === 'selected'}
              aria-label={cell.label}
              title={cell.label}
              onClick={cell.onTap}
              className={cx(
                'grid h-full place-items-center transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy',
                cell.state === 'open' && 'hover:bg-accent-soft',
                cell.state === 'selected' && 'bg-navy',
                cell.state === 'booked' &&
                  'cursor-not-allowed bg-surface-2 bg-[image:repeating-linear-gradient(135deg,transparent_0_6px,rgba(15,30,46,.07)_6px_8px)]',
                (cell.state === 'past' || cell.state === 'closed') && 'cursor-not-allowed bg-[#f3f0e8]',
              )}
            >
              {cell.note ? (
                <span
                  aria-hidden="true"
                  className={cx(
                    'text-[11px] font-semibold leading-none',
                    cell.state === 'selected' ? 'text-gold' : 'text-gold-text',
                  )}
                >
                  {cell.note}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HourTracks({
  cells,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  /** Exactly six cells: the period's hours in order. */
  cells: TrackCell[];
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <ChevronButton direction="prev" label="Earlier hours" onClick={onPrev} disabled={!canPrev} className="hidden sm:grid" />
      <div className="grid min-w-0 flex-1 gap-5">
        <Track cells={cells.slice(0, 3)} />
        <Track cells={cells.slice(3, 6)} />
      </div>
      <ChevronButton direction="next" label="Later hours" onClick={onNext} disabled={!canNext} className="hidden sm:grid" />
    </div>
  );
}

export function TrackLegend() {
  const item = (swatch: string, label: string) => (
    <span className="inline-flex items-center gap-2">
      <span className={cx('inline-block h-3 w-5 rounded-full border border-border-strong', swatch)} />
      {label}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-faint">
      {item('bg-surface', 'Free')}
      {item('bg-navy border-navy', 'Your pick')}
      {item('bg-surface-2 bg-[image:repeating-linear-gradient(135deg,transparent_0_3px,rgba(15,30,46,.15)_3px_4px)]', 'Booked')}
      {item('bg-[#f3f0e8] border-border', 'Closed')}
    </div>
  );
}
