import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * The few pieces the booking, pass and my-bookings screens share.
 *
 * Kept deliberately small: one primary button style, one segmented control,
 * one status pill. Public pages are "one decision per screen" (docs/ui P3), so
 * there is little else to share.
 *
 * Focus is drawn with a ring (box-shadow), not an outline: globals.css removes
 * button outlines with !important.
 */

export function cx(...values: ClassValue[]): string {
  return twMerge(clsx(values));
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

export function buttonClass(
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
  size: 'md' | 'sm' = 'md',
): string {
  return cx(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40',
    focusRing,
    size === 'md' ? 'h-12 px-6 text-[15px]' : 'h-10 px-4 text-sm',
    variant === 'primary' && 'bg-navy text-white hover:bg-[#23364a]',
    variant === 'secondary' && 'bg-surface text-ink ring-1 ring-inset ring-border-strong hover:bg-surface-2',
    variant === 'danger' && 'bg-danger text-white hover:bg-[#8a281d]',
  );
}

export const textButtonClass = cx(
  'inline-flex min-h-10 items-center text-sm font-semibold text-ink underline decoration-border-strong decoration-[1.5px] underline-offset-4 transition-colors hover:decoration-ink disabled:cursor-not-allowed disabled:text-ink-faint disabled:no-underline',
  focusRing,
);

/** A small uppercase label above a section. */
export function SectionLabel({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{children}</h2>
      {aside ? <span className="text-[13px] text-ink-faint">{aside}</span> : null}
    </div>
  );
}

export interface SegmentOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** iOS-style segmented control. Equal-width options, one selected. */
export function Segmented({
  label,
  options,
  value,
  onChange,
  role = 'radiogroup',
}: {
  label: string;
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  role?: 'radiogroup' | 'tablist';
}) {
  const itemRole = role === 'tablist' ? 'tab' : 'radio';
  return (
    <div
      role={role}
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-[3px] rounded-lg border border-border bg-surface-2 p-[3px]"
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role={itemRole}
            aria-checked={itemRole === 'radio' ? on : undefined}
            aria-selected={itemRole === 'tab' ? on : undefined}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cx(
              'h-11 whitespace-nowrap rounded-md px-2 text-[15px] font-medium text-ink-soft transition-colors hover:text-ink',
              focusRing,
              on && 'bg-surface font-semibold text-ink shadow-[0_0_0_1px_var(--border-strong)]',
              option.disabled && 'cursor-not-allowed text-[#b3ada1] hover:text-[#b3ada1]',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Pill({
  tone,
  children,
}: {
  tone: 'ok' | 'bad' | 'off' | 'wait';
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]',
        tone === 'ok' && 'bg-ok-soft text-ok',
        tone === 'bad' && 'bg-danger-soft text-danger',
        tone === 'off' && 'bg-surface-2 text-ink-faint',
        tone === 'wait' && 'bg-warn-soft text-warn',
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx('inline-block size-8 animate-spin rounded-full border-2 border-border border-t-navy', className)}
    />
  );
}

/** A status mark: tick, waiting dots or a cross, on a pale disc. */
export function Mark({ tone }: { tone: 'ok' | 'wait' | 'bad' }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'grid size-12 place-items-center rounded-full',
        tone === 'ok' && 'bg-ok-soft text-ok',
        tone === 'wait' && 'bg-warn-soft text-warn',
        tone === 'bad' && 'bg-danger-soft text-danger',
      )}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        {tone === 'ok' ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : null}
        {tone === 'wait' ? <path d="M12 7v5l3 2" /> : null}
        {tone === 'bad' ? <path d="M7 7l10 10M17 7L7 17" /> : null}
      </svg>
    </span>
  );
}

export function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

/** Round ‹ › button used beside the date strip and the hour tracks. */
export function ChevronButton({
  direction,
  label,
  onClick,
  disabled,
  className,
}: {
  direction: 'prev' | 'next';
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'grid size-9 flex-none place-items-center rounded-full border border-border-strong bg-surface text-ink transition-colors hover:border-navy disabled:cursor-not-allowed disabled:opacity-30',
        focusRing,
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={direction === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}

/** The page's centred column. One width for every booking screen. */
export function Column({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-xl px-5', className)}>{children}</div>;
}

/** Sticky bar at the bottom of the screen: what you are buying, and the one next step. */
export function ActionBar({
  caption,
  amount,
  children,
}: {
  caption: string;
  amount: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 mt-10 border-t border-border bg-[#f9f6edee] backdrop-blur-md">
      <Column className="flex items-center gap-4 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-ink-faint">{caption}</p>
          <p className="text-xl font-bold tabular-nums leading-snug">{amount}</p>
        </div>
        {children}
      </Column>
    </div>
  );
}
