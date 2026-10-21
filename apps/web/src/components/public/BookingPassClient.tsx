'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  fetchBooking,
  formatLongDate,
  formatPaise,
  formatRange,
  TurfApiError,
  type BookingView,
} from '@/lib/turfos-client';

import { buttonClass, Column, Mark, Spinner, textButtonClass } from './book/ui';

/**
 * The booking pass.
 *
 * It shows what the SERVER says and nothing else. An earlier version fell back
 * to a made-up "Booking Confirmed" when the lookup failed. Here a failed lookup
 * is a failed lookup, and a booking still waiting for its payment says so and
 * keeps asking.
 */

const POLL_MS = 3000;

const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function downloadCalendar(booking: BookingView) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Pavilion Club//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${booking.bookingId}@pavilionclub`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(booking.startsAt)}`,
    `DTEND:${icsDate(booking.endsAt)}`,
    `SUMMARY:${booking.sport} · ${booking.courtName}`,
    `LOCATION:${(booking.venueAddress ?? booking.venueName).replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:Booking reference ${booking.reference}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `pavilion-${booking.reference}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function Notice({
  tone,
  title,
  body,
}: {
  tone: 'wait' | 'bad';
  title: string;
  body: string;
}) {
  return (
    <Column className="grid flex-1 place-content-center justify-items-center gap-4 py-16 text-center">
      {tone === 'wait' ? <Spinner /> : <Mark tone="bad" />}
      <h1 className="font-serif text-3xl font-semibold">{title}</h1>
      <p className="max-w-sm text-ink-soft" role={tone === 'bad' ? 'alert' : undefined}>
        {body}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-5">
        <Link className={buttonClass('primary')} href="/my-bookings/">My bookings</Link>
        <Link className={textButtonClass} href="/book/">Book a court</Link>
      </div>
    </Column>
  );
}

export function BookingPassClient({ initialRef }: { initialRef?: string }) {
  const params = useSearchParams();
  const raw = params.get('ref') ?? initialRef ?? '';
  const id = raw === 'pass' || raw === 'confirmed' ? '' : raw;

  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const load = useCallback(async () => {
    try {
      const view = await fetchBooking(id);
      setBooking(view);
      setError(null);
      if (view.status !== 'held') stop();
    } catch (failure) {
      if (failure instanceof TurfApiError && failure.status === 404) {
        setError('We couldn’t find that booking. Check the link in your confirmation email.');
        stop();
      } else {
        setError('Couldn’t load your booking just now. Please refresh in a moment.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void load();
    timer.current = setInterval(load, POLL_MS);
    return stop;
  }, [id, load]);

  if (!id) {
    return (
      <Notice
        tone="bad"
        title="No booking to show"
        body="Open the link from your confirmation email, or sign in to see all your bookings."
      />
    );
  }

  if (loading) {
    return (
      <Column className="grid flex-1 place-content-center justify-items-center gap-4 py-16" >
        <Spinner />
        <p className="text-ink-faint">Loading your booking…</p>
      </Column>
    );
  }

  if (error || !booking) {
    return <Notice tone="bad" title="Booking not found" body={error ?? 'Booking not found.'} />;
  }

  const tz = booking.timezone;
  const confirmed = booking.status === 'confirmed' || booking.status === 'completed';
  const pending = booking.status === 'held';
  /** Confirmed, to be paid at the front desk (venue in pay-at-venue mode). */
  const dueAtVenue = confirmed && booking.payAtVenue && booking.paidPaise < booking.totalPaise;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(booking.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the reference is on screen anyway */
    }
  };

  return (
    <Column className="py-8">
      <div className="grid justify-items-start gap-4">
        <Mark tone={confirmed ? 'ok' : pending ? 'wait' : 'bad'} />
        <h1 className="font-serif text-[2.4rem] font-semibold leading-none tracking-tight">
          {confirmed ? 'You’re booked' : pending ? 'Almost there' : 'Not booked'}
        </h1>
        <p className="text-[15px] text-ink-soft">
          {confirmed
            ? dueAtVenue
              ? `${booking.firstName ? `${booking.firstName}, your` : 'Your'} court is confirmed. Please pay ${formatPaise(booking.totalPaise - booking.paidPaise)} at the front desk when you arrive.`
              : `${booking.firstName ? `${booking.firstName}, your` : 'Your'} court is confirmed and paid. A confirmation is in your email.`
            : pending
              ? 'We’re waiting for your payment to be confirmed. This page updates by itself — please don’t pay again.'
              : booking.status === 'cancelled'
                ? 'This booking was cancelled, or its hold ended before payment. Any money taken is refunded automatically.'
                : 'This booking is closed.'}
        </p>
      </div>

      <div className="mt-7 rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Booking reference</p>
            <p className="font-mono text-xl font-semibold tracking-wider">{booking.reference}</p>
          </div>
          <button type="button" onClick={() => void copy()} className={textButtonClass}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <dl className="divide-y divide-border px-4 text-[15px]">
          {[
            ['Date', formatLongDate(booking.startsAt, tz)],
            ['Time', formatRange(booking.startsAt, booking.endsAt, tz)],
            ['Booked', `${booking.sport} · ${booking.courtName}`],
            dueAtVenue
              ? ['Pay at the venue', formatPaise(booking.totalPaise - booking.paidPaise)]
              : [confirmed ? 'Paid' : 'Amount', formatPaise(confirmed ? booking.paidPaise || booking.totalPaise : booking.totalPaise)],
            ...(booking.venueAddress ? [['Where', booking.venueAddress]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-3">
              <dt className="text-ink-faint">{label}</dt>
              <dd className="text-right font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {confirmed ? (
        <ul className="mt-6 grid gap-2 text-sm text-ink-soft">
          {[
            dueAtVenue
              ? 'Arrive ten minutes early, show this reference at the front desk and pay there (cash or UPI).'
              : 'Arrive ten minutes early and show this reference at the front desk.',
            'Non-marking court shoes only.',
            'Free cancellation up to 24 hours before, from My bookings.',
          ].map((tip) => (
            <li key={tip} className="relative pl-4 before:absolute before:left-0 before:top-[0.6em] before:size-1.5 before:rounded-full before:bg-gold">
              {tip}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        {confirmed ? (
          <button type="button" onClick={() => downloadCalendar(booking)} className={buttonClass('primary')}>
            Add to calendar
          </button>
        ) : null}
        <Link className={buttonClass(confirmed ? 'secondary' : 'primary')} href="/my-bookings/">
          My bookings
        </Link>
        <Link className={textButtonClass} href="/book/">
          Book another
        </Link>
      </div>
    </Column>
  );
}
