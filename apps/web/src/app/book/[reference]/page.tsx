import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  createDb,
  bookings,
  courts,
  customers,
  eq,
} from '@pavilion/db';
import { localMinutes, IST_OFFSET_MINUTES } from '@pavilion/core';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { DigitalMatchPassActions } from '@/components/public/DigitalMatchPassActions';

export const dynamic = 'force-dynamic';

const TURFOS_API_URL = process.env.TURFOS_API_URL || 'http://localhost:3000';
const TURFOS_API_KEY = process.env.TURFOS_API_KEY || 'tk_live_lfRJCbZ7byy4us4J8QaxeNH7sJaddAX0';

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  let booking: {
    id: string;
    reference: string;
    businessDate: string;
    startsAt: Date;
    endsAt: Date;
    amountPaise: number;
    status: string;
    courtName: string;
    customerName: string | null;
    customerPhone: string | null;
  } | null = null;

  // 1. First attempt to load booking from TurfOS Engine
  try {
    const turfRes = await fetch(`${TURFOS_API_URL}/api/v1/bookings/${reference}`, {
      headers: {
        Authorization: `Bearer ${TURFOS_API_KEY}`,
      },
      cache: 'no-store',
    });

    if (turfRes.ok) {
      const data = await turfRes.json();
      booking = {
        id: data.booking_id,
        reference: data.booking_id,
        businessDate: data.business_date,
        startsAt: new Date(data.starts_at),
        endsAt: new Date(data.ends_at),
        amountPaise: data.amounts?.slot_paise || 80000,
        status: data.status,
        courtName: data.court?.display_name || 'Court 1',
        customerName: data.customer?.name ?? 'Player',
        customerPhone: data.customer?.phone ?? null,
      };
    }
  } catch (err) {
    console.error('Failed to fetch from TurfOS, falling back to local DB:', err);
  }

  // 2. Fallback to local DB if not found in TurfOS
  if (!booking) {
    try {
      const db = createDb();
      const rows = await db
        .select({
          id: bookings.id,
          reference: bookings.reference,
          businessDate: bookings.businessDate,
          startsAt: bookings.startsAt,
          endsAt: bookings.endsAt,
          amountPaise: bookings.amountPaise,
          status: bookings.status,
          courtName: courts.name,
          customerName: customers.name,
          customerPhone: customers.phone,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .leftJoin(customers, eq(bookings.customerId, customers.id))
        .where(eq(bookings.reference, reference))
        .limit(1);

      if (rows[0]) {
        booking = {
          ...rows[0],
          customerName: rows[0].customerName ?? null,
          customerPhone: rows[0].customerPhone ?? null,
        };
      }
    } catch (e) {
      console.error('Local DB lookup error:', e);
    }
  }

  if (!booking) notFound();

  const startMin = localMinutes(booking.startsAt, IST_OFFSET_MINUTES);
  const endMin = localMinutes(booking.endsAt, IST_OFFSET_MINUTES);
  function format12h(min: number): string {
    const wrapped = ((min % 1440) + 1440) % 1440;
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  const timeLabel = `${format12h(startMin)} – ${format12h(endMin)}`;

  // ISO dates for calendar event creation
  const startsAtISO = booking.startsAt.toISOString();
  const endsAtISO = booking.endsAt.toISOString();

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />

      <main className="max-w-xl mx-auto px-4 py-8 sm:py-12 w-full space-y-6">
        
        {/* Luxury Boarding Pass Ticket Container */}
        <div className="relative rounded-2xl bg-surface border border-border shadow-lg overflow-hidden">
          
          {/* Top Ticket Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-surface-2/70 to-surface border-b border-border/80 text-center space-y-3 relative">
            
            {/* Success Icon */}
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

          {/* Ticket Body Content */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* Interactive Actions: Copy Reference, WhatsApp Share, Calendar, Google Maps */}
            <DigitalMatchPassActions
              reference={booking.reference}
              businessDate={booking.businessDate}
              timeLabel={timeLabel}
              courtName={booking.courtName}
              amountPaise={booking.amountPaise}
              customerName={booking.customerName}
              startsAt={startsAtISO}
              endsAt={endsAtISO}
            />

            {/* Match Specification Details Card */}
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
                  ₹{(booking.amountPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Match Day Guidelines */}
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

            {/* Navigation Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/book"
                className="w-full py-3.5 rounded-xl bg-navy text-white text-xs font-bold hover:opacity-95 transition shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <span>Book Another Court</span>
                <ArrowRight className="w-4 h-4 text-gold" />
              </Link>

              <Link
                href="/my-bookings"
                className="w-full py-3.5 rounded-xl border border-border text-ink text-xs font-semibold hover:bg-surface-2 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <span>Manage in My Bookings</span>
                <span className="text-gold font-bold">&rarr;</span>
              </Link>
            </div>

          </div>
        </div>

      </main>

      <PublicFooter />
    </div>
  );
}
