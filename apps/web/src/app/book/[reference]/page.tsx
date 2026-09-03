import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  createDb,
  bookings,
  courts,
  customers,
  eq,
} from '@pavilion/db';
import { minutesToLabel, localMinutes, IST_OFFSET_MINUTES } from '@pavilion/core';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  Share2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export const dynamic = 'force-dynamic';

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
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

  const booking = rows[0];
  if (!booking) notFound();

  const startMin = localMinutes(booking.startsAt, IST_OFFSET_MINUTES);
  const endMin = localMinutes(booking.endsAt, IST_OFFSET_MINUTES);
  const timeLabel = `${minutesToLabel(startMin)} – ${minutesToLabel(endMin)}`;

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />

      <main className="max-w-xl mx-auto px-4 py-12 w-full space-y-6">
        <div className="p-8 rounded-2xl bg-surface border border-border shadow-md text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-ok-soft text-ok flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold">
              The Pavilion Club
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Booking Confirmed!
            </h1>
            <p className="text-xs text-ink-soft">
              Your court has been reserved. See you on the court!
            </p>
          </div>

          {/* Golden Reference Pill */}
          <div className="p-3.5 rounded-xl bg-surface-2 border border-border inline-block mx-auto">
            <span className="text-[10px] uppercase tracking-wider font-bold text-ink-soft block mb-0.5">
              Booking Reference
            </span>
            <span className="text-xl font-mono font-bold text-navy tracking-wider select-all">
              {booking.reference}
            </span>
          </div>

          {/* Details Card */}
          <div className="divide-y divide-border border border-border rounded-xl text-xs text-left bg-surface-2/20">
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-ink-soft flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" />
                <span>Date:</span>
              </span>
              <span className="font-bold text-navy">{booking.businessDate}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-ink-soft flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                <span>Match Time:</span>
              </span>
              <span className="font-bold text-navy">{timeLabel}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-ink-soft flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span>Assigned Court:</span>
              </span>
              <span className="font-bold text-navy">{booking.courtName}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-ink-soft flex items-center gap-2">
                <Banknote className="w-4 h-4 text-gold" />
                <span>Amount Due at Venue:</span>
              </span>
              <span className="font-bold text-navy font-mono text-sm">
                ₹{(booking.amountPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-xl bg-surface-2 text-left text-xs space-y-2 border border-border">
            <h3 className="font-bold text-navy text-[11px] uppercase tracking-wider">
              Match Day Guidelines
            </h3>
            <ul className="list-disc list-inside space-y-1 text-ink-soft text-[11px]">
              <li>Please arrive 10 minutes early to clear payment at the front desk.</li>
              <li>Non-marking badminton shoes strictly required on court.</li>
              <li>Show your reference <strong>{booking.reference}</strong> at reception.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/book"
              className="w-full py-3 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Book Another Court</span>
              <ArrowRight className="w-4 h-4 text-gold" />
            </Link>

            <Link
              href="/my-bookings"
              className="w-full py-3 rounded-lg border border-border text-ink text-xs font-semibold hover:bg-surface-2 transition flex items-center justify-center"
            >
              View My Bookings
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
