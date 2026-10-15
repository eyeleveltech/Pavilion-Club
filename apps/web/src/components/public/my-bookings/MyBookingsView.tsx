'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  cancelMyBooking,
  fetchMyBookings,
  formatPaise,
  formatRange,
  formatShortDate,
  logoutSession,
  requestLoginCode,
  TurfApiError,
  verifyLoginCode,
  type MyBooking,
} from '@/lib/turfos-client';

import { buttonClass, Column, cx, Pill, Segmented, Spinner, textButtonClass } from '../book/ui';

/**
 * My bookings.
 *
 * Sign-in is an emailed six-digit code: no password, no SMS. The session token
 * lives in this browser only, opens only this venue's "my bookings" endpoints,
 * and is destroyed on the server at sign-out.
 *
 * Everything shown comes from the server — including the refund a cancellation
 * would give, which is the same figure the cancel endpoint then applies
 * (docs/ui P6: say what will happen, before it happens).
 */

const STORAGE_KEY = 'pavilion_session';
const RESEND_SECONDS = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Stage = 'loading' | 'email' | 'code' | 'list';

const readToken = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
const writeToken = (token: string | null) => {
  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode: the session simply lasts as long as the tab */
  }
};

const inputClass =
  'h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-base text-ink placeholder:text-[#a39f96] transition-colors focus:border-navy focus:outline-none focus:ring-[3px] focus:ring-accent-soft aria-[invalid=true]:border-danger';

const STATUS: Record<string, { label: string; tone: 'ok' | 'bad' | 'off' }> = {
  confirmed: { label: 'Confirmed', tone: 'ok' },
  completed: { label: 'Played', tone: 'off' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
  no_show: { label: 'Missed', tone: 'bad' },
};

export function MyBookingsView() {
  const [stage, setStage] = useState<Stage>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [firstName, setFirstName] = useState<string | null>(null);
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const signOutLocally = useCallback(() => {
    writeToken(null);
    setToken(null);
    setBookings([]);
    setStage('email');
  }, []);

  const load = useCallback(
    async (activeToken: string) => {
      try {
        const data = await fetchMyBookings(activeToken);
        setFirstName(data.firstName);
        setBookings(data.bookings);
        setError(null);
        setStage('list');
      } catch (failure) {
        if (failure instanceof TurfApiError && failure.status === 401) {
          signOutLocally();
        } else {
          setError(failure instanceof Error ? failure.message : 'Could not load your bookings.');
          setStage('list');
        }
      }
    },
    [signOutLocally],
  );

  useEffect(() => {
    const saved = readToken();
    if (saved) {
      setToken(saved);
      void load(saved);
    } else {
      setStage('email');
    }
  }, [load]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  /* ---- sign in ------------------------------------------------------ */

  const sendCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (busy) return;
    setError(null);
    if (!EMAIL.test(email.trim())) {
      setError('Enter the email address you booked with.');
      return;
    }
    setBusy(true);
    try {
      await requestLoginCode(email.trim().toLowerCase());
      setStage('code');
      setCode('');
      setCooldown(RESEND_SECONDS);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  };

  const checkCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setBusy(true);
    try {
      const result = await verifyLoginCode(email.trim().toLowerCase(), code);
      writeToken(result.token);
      setToken(result.token);
      setFirstName(result.firstName);
      await load(result.token);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'That code didn’t work.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (token) await logoutSession(token);
    signOutLocally();
    setEmail('');
    setFlash(null);
  };

  /* ---- cancel ------------------------------------------------------- */

  const cancel = async (booking: MyBooking) => {
    if (!token) return;
    setCancelling(booking.bookingId);
    setError(null);
    try {
      const result = await cancelMyBooking(token, booking.bookingId);
      setConfirming(null);
      setFlash(
        result.refundPaise > 0
          ? `Cancelled. ${formatPaise(result.refundPaise)} will be refunded to how you paid.`
          : booking.paidPaise === 0
            ? 'Cancelled. The court is free for someone else.'
            : 'Cancelled. No refund applies under the cancellation policy.',
      );
      await load(token);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not cancel that booking.');
    } finally {
      setCancelling(null);
    }
  };

  /* ---- render: loading / sign in ------------------------------------ */

  if (stage === 'loading') {
    return (
      <Column className="grid flex-1 place-content-center justify-items-center py-16">
        <Spinner />
      </Column>
    );
  }

  const heading = (title: string, sub: React.ReactNode) => (
    <>
      <h1 className="font-serif text-[2.4rem] font-semibold leading-none tracking-tight">{title}</h1>
      <p className="mt-2 text-[15px] text-ink-faint">{sub}</p>
    </>
  );

  if (stage === 'email') {
    return (
      <Column className="py-8">
        {heading('My bookings', 'See your courts, or cancel if plans change.')}
        <form onSubmit={sendCode} noValidate className="mt-8 grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="mb-email" className="text-sm font-semibold">
              Email you booked with
            </label>
            <input
              id="mb-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              className={inputClass}
            />
            {error ? (
              <small role="alert" className="text-[13px] font-medium text-danger">{error}</small>
            ) : (
              <small className="text-[13px] text-ink-faint">We&rsquo;ll email you a code. No password needed.</small>
            )}
          </div>
          <button type="submit" disabled={busy} className={cx(buttonClass('primary'), 'w-full')}>
            {busy ? 'Sending…' : 'Send code'}
          </button>
        </form>
      </Column>
    );
  }

  if (stage === 'code') {
    return (
      <Column className="py-8">
        {heading(
          'Check your email',
          <>
            If <b className="font-semibold text-ink">{email.trim().toLowerCase()}</b> has booked
            with us, a 6-digit code is on its way. It works for 10 minutes.
          </>,
        )}
        <form onSubmit={checkCode} noValidate className="mt-8 grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="mb-code" className="text-sm font-semibold">Code</label>
            <input
              id="mb-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              aria-invalid={Boolean(error)}
              className={cx(inputClass, 'h-14 pl-[1.4rem] text-center font-mono text-2xl tracking-[0.5em]')}
            />
            {error ? (
              <small role="alert" className="text-[13px] font-medium text-danger">{error}</small>
            ) : (
              <small className="text-[13px] text-ink-faint">Not there? Check spam.</small>
            )}
          </div>
          <button type="submit" disabled={busy || code.length !== 6} className={cx(buttonClass('primary'), 'w-full')}>
            {busy ? 'Checking…' : 'Show my bookings'}
          </button>
          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={() => void sendCode()}
              className={textButtonClass}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage('email');
                setError(null);
              }}
              className={cx(textButtonClass, 'font-medium text-ink-faint')}
            >
              Different email
            </button>
          </div>
        </form>
      </Column>
    );
  }

  /* ---- render: the list --------------------------------------------- */

  const now = Date.now();
  const isUpcoming = (b: MyBooking) => b.status === 'confirmed' && new Date(b.endsAt).getTime() > now;
  const upcoming = bookings.filter(isUpcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = bookings.filter((b) => !isUpcoming(b));
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <Column className="py-8">
      {heading(firstName ? `Hi ${firstName}` : 'My bookings', 'Your courts at The Pavilion Club.')}

      {flash ? (
        <p role="status" className="mt-6 rounded-md bg-ok-soft px-4 py-3 text-sm text-ok">{flash}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-6 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <div className="mt-7">
        <Segmented
          role="tablist"
          label="Bookings"
          value={tab}
          onChange={(value) => {
            setTab(value as 'upcoming' | 'past');
            setConfirming(null);
          }}
          options={[
            { value: 'upcoming', label: `Upcoming · ${upcoming.length}` },
            { value: 'past', label: `Past · ${past.length}` },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 grid justify-items-center gap-4 rounded-lg border border-dashed border-border-strong px-6 py-10 text-center">
          <p className="text-[15px] text-ink-soft">
            {tab === 'upcoming' ? 'No upcoming bookings.' : 'Nothing here yet.'}
          </p>
          {tab === 'upcoming' ? (
            <Link href="/book" className={buttonClass('primary')}>Book a court</Link>
          ) : null}
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {shown.map((b) => {
            const status = STATUS[b.status] ?? { label: b.status, tone: 'off' as const };
            const open = confirming === b.bookingId;
            return (
              <li key={b.bookingId} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{formatShortDate(b.startsAt, b.timezone)}</p>
                    <p className="text-[15px] tabular-nums text-ink-soft">
                      {formatRange(b.startsAt, b.endsAt, b.timezone)} · {b.courtName}
                    </p>
                  </div>
                  <Pill tone={status.tone}>{status.label}</Pill>
                </div>
                <p className="mt-1.5 text-[13px] text-ink-faint">
                  Ref <span className="font-mono text-ink-soft">{b.reference}</span> ·{' '}
                  {b.payAtVenue && b.paidPaise < b.totalPaise && b.status === 'confirmed'
                    ? `Pay at venue ${formatPaise(b.totalPaise - b.paidPaise)}`
                    : `Paid ${formatPaise(b.paidPaise)}`}
                </p>

                {open ? (
                  <div role="group" aria-label="Confirm cancellation" className="mt-3 grid gap-3 rounded-lg bg-danger-soft p-4 text-sm">
                    <p>
                      <b className="font-semibold">Cancel this booking?</b>{' '}
                      {b.refund && b.refund.totalPaise > 0
                        ? `You’ll get ${formatPaise(b.refund.totalPaise)} back. ${b.refund.explanation}`
                        : b.paidPaise === 0
                          ? 'Nothing has been paid, so there is nothing to refund.'
                          : 'No refund applies at this point under the cancellation policy.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        disabled={cancelling === b.bookingId}
                        onClick={() => void cancel(b)}
                        className={buttonClass('danger', 'sm')}
                      >
                        {cancelling === b.bookingId ? 'Cancelling…' : 'Yes, cancel'}
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className={textButtonClass}>
                        Keep it
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-5">
                    <Link href={`/book/pass?ref=${b.bookingId}`} className={textButtonClass}>
                      View pass
                    </Link>
                    {b.canCancel ? (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirming(b.bookingId);
                          setFlash(null);
                        }}
                        className={cx(textButtonClass, 'font-medium text-ink-faint')}
                      >
                        Cancel booking
                      </button>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/book" className={buttonClass('primary')}>Book a court</Link>
        <button type="button" onClick={() => void signOut()} className={cx(textButtonClass, 'font-medium text-ink-faint')}>
          Sign out
        </button>
      </div>
    </Column>
  );
}
