'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  confirmAtVenue,
  createHold,
  fetchBooking,
  fetchDay,
  formatLongDate,
  formatPaise,
  formatRange,
  formatShortDate,
  hourIn,
  startPayment,
  TurfApiError,
  type CourtDay,
  type DaySlot,
  type Hold,
  type VenueDay,
} from '@/lib/turfos-client';
import { openCheckout } from '@/lib/razorpay';

import { ActionBar, ArrowLeft, buttonClass, Column, cx, Mark, Pill, SectionLabel, Spinner, textButtonClass } from './book/ui';
import {
  ActivityTabs,
  CourtPills,
  DateStrip,
  HourTracks,
  hourLabel,
  PeriodTabs,
  PERIODS,
  shortNames,
  TrackLegend,
  type CellState,
  type DayOption,
  type PeriodKey,
  type TrackCell,
} from './book/pickers';

/**
 * The booking flow. Two screens and a wait:
 *
 *   Choose   court -> date -> time of day -> tap a start hour, tap an end hour
 *   Details  name, mobile, email -> hold -> Razorpay
 *   Wait     until the SERVER says "confirmed", then the pass
 *
 * There is no separate "how long" question: the length is the range you tap
 * on the hour track. A range is only accepted if one court is free for every
 * hour of it, so what you select is always something that can be held.
 *
 * It never confirms anything itself. The browser's "payment succeeded"
 * callback only starts the wait; the booking is confirmed when Razorpay's
 * webhook reaches TurfOS. Prices before the hold are indicative; the hold's
 * figures are the ones charged.
 */

/** The engine holds at most six consecutive hours. */
const MAX_HOURS = 6;
const DAYS_AHEAD = 14;
const POLL_MS = 2000;
const POLL_GIVE_UP_MS = 120_000;
const FALLBACK_TZ = 'Asia/Kolkata';

type Step = 'pick' | 'details' | 'waiting';

/* ------------------------------------------------------------------ */

function buildDays(): DayOption[] {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: FALLBACK_TZ });
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  return Array.from({ length: DAYS_AHEAD }, (_, offset) => {
    const date = new Date(Date.UTC(y, m - 1, d + offset));
    return {
      ymd: date.toISOString().slice(0, 10),
      weekday: offset === 0 ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }),
      date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
    };
  });
}

interface HourCell {
  startsAt: string;
  endsAt: string;
  perCourt: Map<string, DaySlot>;
}

function hourCells(courts: CourtDay[]): HourCell[] {
  const cells = new Map<string, HourCell>();
  for (const court of courts) {
    for (const slot of court.slots) {
      let cell = cells.get(slot.startsAt);
      if (!cell) {
        cell = { startsAt: slot.startsAt, endsAt: slot.endsAt, perCourt: new Map() };
        cells.set(slot.startsAt, cell);
      }
      cell.perCourt.set(court.id, slot);
    }
  }
  return [...cells.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

const pad = (n: number) => String(n).padStart(2, '0');
const countdown = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const hrs = (h: number) => `${h} hr${h === 1 ? '' : 's'}`;

function normaliseMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
}

const inputClass =
  'h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-base text-ink placeholder:text-[#a39f96] transition-colors focus:border-navy focus:outline-none focus:ring-[3px] focus:ring-accent-soft read-only:bg-surface-2 read-only:text-ink-faint aria-[invalid=true]:border-danger';

/* ------------------------------------------------------------------ */

export function PublicBookingFlow({ initialDate }: { initialDate: string }) {
  const router = useRouter();
  const days = useMemo(buildDays, []);

  const [date, setDate] = useState(() =>
    days.some((day) => day.ymd === initialDate) ? initialDate : days[0]!.ymd,
  );
  const [day, setDay] = useState<VenueDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** The activity (TurfOS sport type) being booked. Null = the venue's main one. */
  const [activity, setActivity] = useState<string | null>(null);
  const [choice, setChoice] = useState('any');
  const [period, setPeriod] = useState<PeriodKey>('morning');
  /** The selected hours, by start time, always consecutive. */
  const [selected, setSelected] = useState<string[]>([]);

  const [step, setStep] = useState<Step>('pick');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [hold, setHold] = useState<Hold | null>(null);
  const [holdCourt, setHoldCourt] = useState<CourtDay | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [stillWaiting, setStillWaiting] = useState(false);

  const timezone = day?.timezone ?? FALLBACK_TZ;
  /** The venue takes payment at the front desk (a TurfOS setting), so no Razorpay step. */
  const atVenue = day?.payment === 'at_venue';

  /* ---- load a day --------------------------------------------------- */

  const loadDay = useCallback(async (ymd: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      setDay(await fetchDay(ymd));
    } catch (error) {
      setDay(null);
      setLoadError(error instanceof TurfApiError ? error.message : 'Could not load times. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDay(date);
  }, [date, loadDay]);

  /* ---- what is free ------------------------------------------------- */

  // Activities are data: whatever sport types the venue's courts carry in
  // TurfOS. A venue adds "Yoga & Aerobics" by adding a space with that type —
  // there is no list of activities in this code. The one with the most spaces
  // leads, which for this venue is pickleball.
  const activities = useMemo(() => {
    const bySport = new Map<string, CourtDay[]>();
    for (const court of day?.courts ?? []) {
      bySport.set(court.sport, [...(bySport.get(court.sport) ?? []), court]);
    }
    return [...bySport.entries()]
      .map(([sport, list]) => ({ sport, courts: list }))
      .sort((a, b) => b.courts.length - a.courts.length || a.sport.localeCompare(b.sport));
  }, [day]);
  const current = activities.find((a) => a.sport === activity) ?? activities[0] ?? null;
  const courts = useMemo(() => current?.courts ?? [], [current]);
  /** "court" for courts, "space" for a studio or a games room. Presentation only. */
  const unit = courts.length && courts.every((c) => /court/i.test(c.name)) ? 'court' : 'space';

  const visibleCourts = useMemo(
    () => (choice === 'any' ? courts : courts.filter((court) => court.id === choice)),
    [courts, choice],
  );
  const cells = useMemo(() => hourCells(visibleCourts), [visibleCourts]);
  const indexOf = useMemo(() => new Map(cells.map((cell, i) => [cell.startsAt, i])), [cells]);
  const byHour = useMemo(() => {
    const map = new Map<number, HourCell>();
    for (const cell of cells) {
      const hour = hourIn(cell.startsAt, timezone);
      if (!map.has(hour)) map.set(hour, cell);
    }
    return map;
  }, [cells, timezone]);

  const freeCourts = useCallback(
    (run: HourCell[]) =>
      visibleCourts.filter((court) => run.every((cell) => cell.perCourt.get(court.id)?.available)),
    [visibleCourts],
  );

  const isPast = (cell: HourCell) => new Date(cell.startsAt).getTime() <= Date.now();
  const isFree = useCallback(
    (cell: HourCell) => new Date(cell.startsAt).getTime() > Date.now() && freeCourts([cell]).length > 0,
    [freeCourts],
  );

  /** A run can be held if it is consecutive, in the future, and one court has every hour. */
  const holdable = useCallback(
    (run: HourCell[]) =>
      run.length > 0 &&
      run.length <= MAX_HOURS &&
      run.every((cell, i) => i === 0 || run[i - 1]!.endsAt === cell.startsAt) &&
      run.every(isFree) &&
      freeCourts(run).length > 0,
    [isFree, freeCourts],
  );

  /** Cheapest court-hire for a run, and the court that gives it. */
  const bestFor = useCallback(
    (run: HourCell[]) => {
      let best: { court: CourtDay; paise: number; fee: number } | null = null;
      for (const court of freeCourts(run)) {
        const slots = run.map((cell) => cell.perCourt.get(court.id)!);
        const paise = slots.reduce((sum, slot) => sum + slot.pricePaise, 0);
        if (!best || paise < best.paise) best = { court, paise, fee: slots[0]!.feePaise };
      }
      return best;
    },
    [freeCourts],
  );

  const run = useMemo(() => {
    const picked = selected.map((s) => cells[indexOf.get(s) ?? -1]).filter(Boolean) as HourCell[];
    return picked.length === selected.length && holdable(picked) ? picked : [];
  }, [selected, cells, indexOf, holdable]);
  const best = run.length ? bestFor(run) : null;

  // A selection that stopped being holdable (someone else took an hour, the
  // day reloaded) is dropped rather than shown as if it were still available.
  useEffect(() => {
    if (selected.length && !run.length && !loading) setSelected([]);
  }, [selected, run, loading]);

  const openPeriods = useMemo(() => {
    const open = { twilight: false, morning: false, noon: false, evening: false } as Record<PeriodKey, boolean>;
    for (const p of PERIODS) {
      for (let h = p.from; h < p.from + 6; h += 1) {
        const cell = byHour.get(h);
        if (cell && isFree(cell)) open[p.key] = true;
      }
    }
    return open;
  }, [byHour, isFree]);

  // Land on the first part of the day that has something to book.
  useEffect(() => {
    if (loading || selected.length) return;
    const first = PERIODS.find((p) => openPeriods[p.key]);
    if (first) setPeriod(first.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, loading]);

  const priceRange = useMemo(() => {
    const prices = cells
      .filter(isFree)
      .map((cell) => Math.min(...freeCourts([cell]).map((c) => cell.perCourt.get(c.id)!.pricePaise)));
    return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
  }, [cells, isFree, freeCourts]);

  /* ---- tapping the track -------------------------------------------- */

  const tap = (cell: HourCell) => {
    const s = cell.startsAt;
    if (!selected.length) {
      setSelected([s]);
      return;
    }
    if (selected.includes(s)) {
      setSelected(selected.length === 1 ? [] : [s]);
      return;
    }
    const i = indexOf.get(s)!;
    const a = indexOf.get(selected[0]!)!;
    const b = indexOf.get(selected[selected.length - 1]!)!;
    // A later hour extends to it; an earlier one extends back to it — when the
    // whole stretch can be held on one court. Otherwise it starts afresh.
    const stretch = i > b ? cells.slice(a, i + 1) : cells.slice(i, b + 1);
    setSelected(holdable(stretch) ? stretch.map((c) => c.startsAt) : [s]);
  };

  const trackCells: TrackCell[] = useMemo(() => {
    const from = PERIODS.find((p) => p.key === period)!.from;
    return Array.from({ length: 6 }, (_, i) => {
      const hour = from + i;
      const cell = byHour.get(hour);
      const span = `${hourLabel(hour)} to ${hourLabel(hour + 1)}`;
      if (!cell) return { hour, state: 'closed' as CellState, label: `${span}, closed` };
      if (selected.includes(cell.startsAt)) {
        return { hour, state: 'selected' as CellState, label: `${span}, selected`, onTap: () => tap(cell) };
      }
      if (isPast(cell)) return { hour, state: 'past' as CellState, label: `${span}, already passed` };
      if (!isFree(cell)) return { hour, state: 'booked' as CellState, label: `${span}, booked` };
      const price = Math.min(...freeCourts([cell]).map((c) => cell.perCourt.get(c.id)!.pricePaise));
      return { hour, state: 'open' as CellState, label: `${span}, ${formatPaise(price)}`, onTap: () => tap(cell) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, byHour, selected, isFree, freeCourts]);

  const periodIndex = PERIODS.findIndex((p) => p.key === period);

  /* ---- choices ------------------------------------------------------ */

  const chooseDate = (ymd: string) => {
    setDate(ymd);
    setSelected([]);
    setNotice(null);
  };
  const chooseCourt = (id: string) => {
    setChoice(id);
    setSelected([]);
  };
  const chooseActivity = (sport: string) => {
    setActivity(sport);
    setChoice('any');
    setSelected([]);
    setNotice(null);
  };

  const backToPick = useCallback(
    (text: string | null, tone: 'info' | 'error' = 'info') => {
      setHold(null);
      setHoldCourt(null);
      setBusy(false);
      setStep('pick');
      setSelected([]);
      setNotice(text ? { tone, text } : null);
      void loadDay(date);
    },
    [date, loadDay],
  );

  /* ---- hold countdown ----------------------------------------------- */

  useEffect(() => {
    if (!hold) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && step === 'details') {
        backToPick('Your hold ran out before payment. Please choose the time again — nothing was charged.');
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [hold, step, backToPick]);

  /* ---- wait for the server to confirm ------------------------------- */

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
  };
  useEffect(() => stopPolling, []);

  const waitForConfirmation = (bookingId: string) => {
    setStep('waiting');
    setStillWaiting(false);
    stopPolling();
    const startedAt = Date.now();

    pollTimer.current = setInterval(async () => {
      try {
        const booking = await fetchBooking(bookingId);
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          stopPolling();
          router.push(`/book/pass?ref=${encodeURIComponent(bookingId)}`);
          return;
        }
        if (booking.status === 'cancelled') {
          stopPolling();
          backToPick(
            'The hold ended before your payment reached us. If money left your account it is refunded automatically.',
            'error',
          );
          return;
        }
      } catch {
        // A blip is not a verdict. Keep asking until the deadline.
      }
      if (Date.now() - startedAt > POLL_GIVE_UP_MS) {
        stopPolling();
        setStillWaiting(true);
      }
    }, POLL_MS);
  };

  /* ---- pay ---------------------------------------------------------- */

  const pay = async (current: Hold) => {
    setNotice(null);
    setBusy(true);
    try {
      const order = await startPayment(current.bookingId);
      await openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        venueName: order.venueName || 'The Pavilion Club',
        description: 'Court booking',
        prefill: order.prefill,
        onSuccess: () => waitForConfirmation(current.bookingId),
        onDismiss: () => {
          setBusy(false);
          setNotice({ tone: 'info', text: 'Payment window closed. Your court is still held — press Pay to try again.' });
        },
        onFailure: (reason) => {
          setBusy(false);
          setNotice({ tone: 'error', text: `${reason} You can try again while your court is held.` });
        },
      });
    } catch (error) {
      setBusy(false);
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Payment could not be started.' });
    }
  };

  const validate = (): boolean => {
    if (name.trim().length < 2) {
      setFieldError({ field: 'name', message: 'Please enter your name.' });
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(normaliseMobile(phone))) {
      setFieldError({ field: 'phone', message: 'Enter a 10-digit mobile number.' });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setFieldError({ field: 'email', message: 'Enter a valid email — your confirmation goes there.' });
      return false;
    }
    setFieldError(null);
    return true;
  };

  /**
   * Pay-at-venue venues: no gateway — ask TurfOS to confirm the hold as a
   * desk-paid booking, then show the pass. TurfOS decides whether that is
   * allowed (the venue's switch), not this page.
   */
  const confirmHere = async (current: Hold) => {
    setBusy(true);
    setNotice(null);
    try {
      await confirmAtVenue(current.bookingId);
      router.push(`/book/pass?ref=${encodeURIComponent(current.bookingId)}`);
    } catch (error) {
      setBusy(false);
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not confirm the booking.',
      });
    }
  };

  const settle = (current: Hold) => (atVenue ? confirmHere(current) : pay(current));

  const submitDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (hold) {
      await settle(hold);
      return;
    }
    if (!best || !run.length || !validate()) return;

    setBusy(true);
    setNotice(null);
    try {
      const created = await createHold({
        courtId: best.court.id,
        startsAt: run[0]!.startsAt,
        hours: run.length,
        name: name.trim(),
        phone: normaliseMobile(phone),
        email: email.trim().toLowerCase(),
      });
      setHold(created);
      setHoldCourt(best.court);
      await settle(created);
    } catch (error) {
      setBusy(false);
      if (error instanceof TurfApiError && ['slot_taken', 'slot_unavailable', 'not_consecutive'].includes(error.code)) {
        backToPick('Sorry — that time was just taken. Please choose another.', 'error');
        return;
      }
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Could not hold that time.' });
    }
  };

  /* ---- what the bar and the recap show ------------------------------ */

  const court = holdCourt ?? best?.court ?? null;
  const from = hold?.startsAt ?? run[0]?.startsAt ?? null;
  const to = hold?.endsAt ?? run[run.length - 1]?.endsAt ?? null;
  const slotPaise = hold ? hold.slotPaise : (best?.paise ?? 0);
  const feePaise = hold ? hold.feePaise : (best?.fee ?? 0);
  const total = slotPaise + feePaise;
  const ready = Boolean(court && from && to);
  const caption = ready
    ? `${formatShortDate(from!, timezone)} · ${formatRange(from!, to!, timezone)}`
    : 'Tap a start hour';

  const message = notice ? (
    <p
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'rounded-md px-4 py-3 text-sm leading-relaxed',
        notice.tone === 'error' ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-ink-soft',
      )}
    >
      {notice.text}
    </p>
  ) : null;

  /* ---- waiting ------------------------------------------------------ */

  if (step === 'waiting') {
    return (
      <Column className="grid flex-1 place-content-center justify-items-center py-16 text-center">
        <div role="status" aria-live="polite" className="grid justify-items-center gap-4">
          {stillWaiting ? (
            <>
              <Mark tone="wait" />
              <h1 className="font-serif text-3xl font-semibold">Still confirming</h1>
              <p className="max-w-sm text-ink-soft">
                Your payment is taking longer than usual to reach us. Please don&rsquo;t pay again — your
                confirmation will be emailed as soon as it lands.
              </p>
              <a className={buttonClass('primary')} href={`/book/pass?ref=${encodeURIComponent(hold?.bookingId ?? '')}`}>
                Check my booking
              </a>
            </>
          ) : (
            <>
              <Spinner />
              <h1 className="font-serif text-3xl font-semibold">Confirming your court</h1>
              <p className="max-w-sm text-ink-soft">Payment received. This takes a few seconds — please keep this page open.</p>
            </>
          )}
        </div>
      </Column>
    );
  }

  /* ---- details ------------------------------------------------------ */

  if (step === 'details' && ready) {
    return (
      <div className="flex flex-1 flex-col">
        <Column className="flex-1 pt-6">
          <button
            type="button"
            disabled={busy}
            onClick={() => backToPick(hold ? 'Your earlier hold releases by itself within ten minutes.' : null)}
            className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-faint hover:text-ink disabled:opacity-40"
          >
            <ArrowLeft /> Change time
          </button>

          <h1 className="font-serif text-[2.4rem] font-semibold leading-none tracking-tight">Your details</h1>
          <p className="mt-2 text-[15px] text-ink-faint">Your confirmation is emailed to you.</p>

          <dl className="mt-7 divide-y divide-border rounded-lg border border-border bg-surface px-4 text-[15px]">
            {[
              ['Date', formatLongDate(from!, timezone)],
              ['Time', `${formatRange(from!, to!, timezone)} (${hrs(Math.round((new Date(to!).getTime() - new Date(from!).getTime()) / 3_600_000))})`],
              [unit === 'court' ? 'Court' : 'Space', court!.name],
              [unit === 'court' ? 'Court hire' : 'Hire', formatPaise(slotPaise)],
              ...(feePaise > 0 ? [['Booking fee', formatPaise(feePaise)]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3">
                <dt className="text-ink-faint">{label}</dt>
                <dd className="text-right font-medium tabular-nums">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 py-3">
              <dt className="font-semibold">{atVenue ? 'Pay at the venue' : 'Total'}</dt>
              <dd className="text-right text-lg font-bold tabular-nums">{formatPaise(total)}</dd>
            </div>
          </dl>

          {hold ? (
            <p className="mt-4" role="timer">
              <Pill tone="wait">
                Court held for you · <span className="font-mono text-xs tracking-normal">{countdown(secondsLeft)}</span>
              </Pill>
            </p>
          ) : null}

          <form id="bk-details" onSubmit={submitDetails} noValidate className="mt-7 grid gap-5">
            <div className="grid gap-1.5">
              <label htmlFor="bk-name" className="text-sm font-semibold">Full name</label>
              <input
                id="bk-name"
                autoComplete="name"
                value={name}
                readOnly={Boolean(hold)}
                aria-invalid={fieldError?.field === 'name'}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
              {fieldError?.field === 'name' ? (
                <small role="alert" className="text-[13px] font-medium text-danger">{fieldError.message}</small>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="bk-phone" className="text-sm font-semibold">Mobile number</label>
              <div
                className={cx(
                  'flex h-12 items-center rounded-md border border-border-strong bg-surface transition-colors focus-within:border-navy focus-within:ring-[3px] focus-within:ring-accent-soft',
                  fieldError?.field === 'phone' && 'border-danger',
                  hold && 'bg-surface-2',
                )}
              >
                <span className="pl-4 pr-1 tabular-nums text-ink-faint">+91</span>
                <input
                  id="bk-phone"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  readOnly={Boolean(hold)}
                  aria-invalid={fieldError?.field === 'phone'}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-full w-full bg-transparent px-2 text-base text-ink focus:outline-none read-only:text-ink-faint"
                />
              </div>
              {fieldError?.field === 'phone' ? (
                <small role="alert" className="text-[13px] font-medium text-danger">{fieldError.message}</small>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="bk-email" className="text-sm font-semibold">Email</label>
              <input
                id="bk-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                readOnly={Boolean(hold)}
                aria-invalid={fieldError?.field === 'email'}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
              {fieldError?.field === 'email' ? (
                <small role="alert" className="text-[13px] font-medium text-danger">{fieldError.message}</small>
              ) : (
                <small className="text-[13px] text-ink-faint">You&rsquo;ll also use this to see your bookings later.</small>
              )}
            </div>

            {message}

            <p className="text-[13px] leading-relaxed text-ink-faint">
              {atVenue
                ? 'No online payment — pay at the front desk when you arrive (cash or UPI). Free cancellation up to 24 hours before.'
                : 'Pay securely with UPI, card or netbanking (Razorpay). We hold the court for ten minutes while you pay. Free cancellation up to 24 hours before.'}
            </p>
          </form>
        </Column>

        <ActionBar caption={`${caption} · ${court!.name}`} amount={formatPaise(total)}>
          <button type="submit" form="bk-details" disabled={busy} className={buttonClass('primary')}>
            {busy ? 'Please wait…' : atVenue ? 'Confirm booking' : `Pay ${formatPaise(total)}`}
          </button>
        </ActionBar>
      </div>
    );
  }

  /* ---- choose ------------------------------------------------------- */

  return (
    <div className="flex flex-1 flex-col">
      <Column className="flex-1 pt-8">
        <h1 className="font-serif text-[2.4rem] font-semibold leading-none tracking-tight">
          {activities.length > 1 ? 'Book a session' : 'Book a court'}
        </h1>
        <p className="mt-2 text-[15px] text-ink-faint">
          {current ? current.sport : 'Pickleball'}
          {courts.length > 1 ? ` · ${courts.length} ${unit}s` : ''}
          {priceRange
            ? ` · ${formatPaise(priceRange.min)}${priceRange.max > priceRange.min ? `–${formatPaise(priceRange.max)}` : ''} per hour`
            : ''}
          {atVenue ? ' · pay at the venue' : ''}
        </p>

        {message ? <div className="mt-6">{message}</div> : null}

        {activities.length > 1 ? (
          <section className="mt-8">
            <SectionLabel>Activity</SectionLabel>
            <ActivityTabs
              value={current?.sport ?? ''}
              onChange={chooseActivity}
              options={activities.map((a) => ({
                value: a.sport,
                label: a.sport,
                note: `${a.courts.length} ${a.courts.every((c) => /court/i.test(c.name)) ? 'court' : 'space'}${a.courts.length === 1 ? '' : 's'}`,
              }))}
            />
          </section>
        ) : null}

        {courts.length > 1 ? (
          <section className={activities.length > 1 ? 'mt-6' : 'mt-8'}>
            <SectionLabel>{unit === 'court' ? 'Court' : 'Space'}</SectionLabel>
            <CourtPills
              value={choice}
              onChange={chooseCourt}
              options={[
                { value: 'any', label: 'Any' },
                ...shortNames(courts.map((c) => c.name)).map((label, i) => ({ value: courts[i]!.id, label })),
              ]}
            />
          </section>
        ) : null}

        <section className="mt-6 border-t border-border pt-6">
          <DateStrip days={days} value={date} onChange={chooseDate} />
        </section>

        <section className="mt-6 border-t border-border pt-6" aria-label="Time">
          <PeriodTabs value={period} onChange={setPeriod} open={openPeriods} />

          <div className="mt-6">
            {loading ? (
              <div aria-busy="true" aria-label="Loading times" className="grid gap-5">
                {[0, 1].map((i) => (
                  <div key={i}>
                    <div className="mb-2 h-5 w-full animate-pulse rounded bg-surface-2" />
                    <div className="h-12 animate-pulse rounded-full bg-surface-2" />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-lg border border-dashed border-border-strong p-6 text-center text-[15px] text-ink-soft">
                {loadError}{' '}
                <button type="button" className={textButtonClass} onClick={() => void loadDay(date)}>
                  Try again
                </button>
              </div>
            ) : (
              <HourTracks
                cells={trackCells}
                canPrev={periodIndex > 0}
                canNext={periodIndex < PERIODS.length - 1}
                onPrev={() => setPeriod(PERIODS[Math.max(0, periodIndex - 1)]!.key)}
                onNext={() => setPeriod(PERIODS[Math.min(PERIODS.length - 1, periodIndex + 1)]!.key)}
              />
            )}
          </div>

          {!loading && !loadError ? (
            <div className="mt-5 grid gap-3">
              <p className="text-sm text-ink-soft" aria-live="polite">
                {run.length
                  ? `${formatRange(run[0]!.startsAt, run[run.length - 1]!.endsAt, timezone)} · ${hrs(run.length)} · ${best!.court.name}. Tap another hour to change.`
                  : openPeriods[period]
                    ? 'Tap a start hour. Tap a later hour to book longer.'
                    : 'Nothing free in this part of the day — try another.'}
              </p>
              <TrackLegend />
            </div>
          ) : null}
        </section>
      </Column>

      <ActionBar caption={caption} amount={ready ? formatPaise(total) : '—'}>
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            setNotice(null);
            setStep('details');
          }}
          className={buttonClass('primary')}
        >
          Continue
        </button>
      </ActionBar>
    </div>
  );
}
