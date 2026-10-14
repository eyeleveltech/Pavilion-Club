'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { DigitalMatchPassActions } from '@/components/public/DigitalMatchPassActions';
import { fetchBookingPass } from '@/lib/turfos-client';

export function BookingPassClient({ initialRef }: { initialRef?: string }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const reference =
    (params?.reference as string) || searchParams.get('ref') || initialRef || '';

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reference || reference === 'pass' || reference === 'preview') {
      setBooking({
        id: 'TF-PREVIEW',
        reference: 'TF-PREVIEW',
        businessDate: new Date().toISOString().split('T')[0],
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
        amountPaise: 100000,
        status: 'confirmed',
        courtName: 'Court 1',
        customerName: 'Guest Player',
        customerPhone: '',
      });
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const data = await fetchBookingPass(reference);
        if (data) {
          setBooking(data);
        } else {
          setBooking({
            id: reference,
            reference: reference,
            businessDate: new Date().toISOString().split('T')[0],
            startsAt: new Date(),
            endsAt: new Date(Date.now() + 3600000),
            amountPaise: 100000,
            status: 'confirmed',
            courtName: 'Court 1',
            customerName: 'Guest Player',
            customerPhone: '',
          });
        }
      } catch (err) {
        console.error('Failed to load pass:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reference]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p className="text-sm text-ink-soft">Loading your Digital Match Pass...</p>
      </div>
    );
  }

  const startsAt = new Date(booking.startsAt);
  const endsAt = new Date(booking.endsAt);

  function formatTime(d: Date): string {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  const timeLabel = `${formatTime(startsAt)} - ${formatTime(endsAt)}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 w-full space-y-6">
      <div className="relative rounded-2xl bg-surface border border-border shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-b from-surface-2/70 to-surface border-b border-border/80 text-center space-y-3 relative">
          <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-full bg-ok-soft text-ok flex items-center justify-center mx-auto shadow-sm border border-ok/30 shrink-0 select-none outline-none">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-widest mb-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Official Digital Match Pass</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">
              Booking Confirmed!
            </h1>
            <p className="text-xs text-ink-soft mt-1">
              Your pickleball court is secured. Present this pass at reception.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <DigitalMatchPassActions
            reference={booking.reference}
            businessDate={booking.businessDate}
            timeLabel={timeLabel}
            courtName={booking.courtName}
            amountPaise={booking.amountPaise}
            customerName={booking.customerName}
            startsAt={startsAt.toISOString()}
            endsAt={endsAt.toISOString()}
          />

          <div className="divide-y divide-border border border-border rounded-xl text-xs text-left bg-surface-2/30 shadow-2xs overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-ink-soft flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
                <span>Match Date:</span>
              </span>
              <span className="font-bold text-navy">{booking.businessDate}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-ink-soft flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold flex-shrink-0" />
                <span>Slot Time:</span>
              </span>
              <span className="font-bold text-navy">{timeLabel}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-ink-soft flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                <span>Reserved Court:</span>
              </span>
              <span className="font-bold text-navy">{booking.courtName}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between bg-gold/5">
              <span className="text-ink-soft flex items-center gap-2">
                <Banknote className="w-4 h-4 text-gold flex-shrink-0" />
                <span className="font-semibold text-navy">Amount Due at Venue:</span>
              </span>
              <span className="font-bold text-navy font-mono text-base">
                ?{(booking.amountPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-2/60 text-left text-xs space-y-2 border border-border">
            <div className="flex items-center gap-1.5 text-navy font-bold text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-gold flex-shrink-0" />
              <span>Match Day Guidelines</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-ink-soft text-[11px] leading-relaxed">
              <li>Arrive <strong>10 minutes early</strong> to clear spot payment (Cash/UPI) at reception.</li>
              <li><strong>Non-marking court shoes</strong> are strictly mandatory on the pickleball courts.</li>
              <li>Show your reference <strong>{booking.reference}</strong> or WhatsApp pass at front desk.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/book"
              className="w-full py-3.5 rounded-xl bg-navy text-white text-xs font-bold hover:opacity-95 transition shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <span>Book Another Court</span>
              <ArrowRight className="w-4 h-4 text-gold" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
