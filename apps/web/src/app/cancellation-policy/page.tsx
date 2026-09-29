import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Clock, ShieldAlert, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Cancellation & Refund Policy | The Pavilion Club Adyar',
  description: 'Official cancellation terms, refund procedures, and third-party partner booking policies for The Pavilion Club badminton arena in Chennai.',
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10 text-xs text-ink leading-relaxed">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 border border-navy/15 text-navy text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 text-gold" />
            <span>Fair Play Booking Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-ink-soft text-sm">
            Last updated: September 2026 &bull; The Pavilion Club, Gandhi Nagar, Adyar, Chennai
          </p>
        </div>

        {/* Highlight Card: Zero Pre-Payment Model */}
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pay at Venue &bull; Hassle-Free Online Booking</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Because online reservations at The Pavilion Club require zero advance card deposit, you can cancel your slot anytime through our self-service portal without cancellation charges. We kindly ask that you cancel at least 2 hours ahead so other waiting badminton players can book the court.
          </p>
        </div>

        {/* Section 1: Venue Direct Cancellation Rules */}
        <section className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center gap-2 text-navy font-bold text-base">
            <Clock className="w-5 h-5 text-gold" />
            <h2>1. Direct Venue Cancellation Windows</h2>
          </div>
          <div className="space-y-3 text-ink-soft text-xs">
            <p>
              Players can cancel or reschedule bookings directly online via the <Link href="/my-bookings" className="text-navy font-semibold underline hover:text-gold">My Bookings</Link> portal using their registered phone number and OTP verification:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-1">
                <span className="font-bold text-navy block text-xs">&gt; 2 Hours Before Game</span>
                <span className="text-emerald-700 font-bold block text-xs">100% Free Cancellation</span>
                <p className="text-[11px] text-ink-soft">Your slot is released with zero penalty. For prepaid corporate bookings, a full credit note or refund is issued.</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-1">
                <span className="font-bold text-navy block text-xs">&lt; 2 Hours or No-Show</span>
                <span className="text-amber-800 font-bold block text-xs">Late Cancellation</span>
                <p className="text-[11px] text-ink-soft">As courts cannot be reallocated on short notice, repeated no-shows may limit advance hold privileges.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Partner & Aggregator Bookings (CRITICAL CLAUSE) */}
        <section className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center gap-2 text-navy font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-gold" />
            <h2>2. Third-Party &amp; Partner Bookings (Turf Town, Playo, etc.)</h2>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-2">
            <p className="font-bold text-amber-950">
              Important Legal Notice Regarding Partner Platform Transactions:
            </p>
            <p className="text-amber-900 leading-relaxed">
              Bookings made through third-party platforms (including Turf Town, Playo, or corporate partner portals) are strictly governed by that respective platform&apos;s cancellation, rescheduling, and refund terms.
            </p>
            <p className="text-amber-900 leading-relaxed">
              All payment disputes, refund claims, and cancellation requests for such bookings <strong>must be initiated directly with the partner platform</strong> where the payment was transacted. The Pavilion Club reception desk cannot process refunds or cancellations for third-party marketplace bookings.
            </p>
          </div>
        </section>

        {/* Section 3: Weather & Arena Closures */}
        <section className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center gap-2 text-navy font-bold text-base">
            <AlertCircle className="w-5 h-5 text-gold" />
            <h2>3. Force Majeure &amp; Facility Maintenance Closures</h2>
          </div>
          <p className="text-ink-soft">
            In the rare event that a court cannot be provided due to sudden power outages, government weather advisories, or unscheduled court maintenance:
          </p>
          <ul className="space-y-1.5 text-xs text-ink-soft list-disc list-inside">
            <li>Our front desk team will proactively contact affected players via phone or WhatsApp.</li>
            <li>Players will be offered immediate priority rescheduling to any available court slot of their choice, or a 100% full refund with zero deductions.</li>
          </ul>
        </section>

        {/* Section 4: Refund Method & Timelines */}
        <section className="p-6 rounded-2xl bg-surface border border-border space-y-3">
          <h2 className="text-sm font-bold text-navy">4. Refund Method &amp; Processing Timelines</h2>
          <p className="text-ink-soft">
            Where a monetary refund is applicable (prepaid corporate sessions or tournament deposits):
          </p>
          <ul className="space-y-1 text-xs text-ink-soft list-disc list-inside">
            <li><strong>Online UPI / Card Payments:</strong> Processed back to the source bank account within 5 to 7 working days.</li>
            <li><strong>Desk Payments (Cash / UPI):</strong> Reimbursed instantly at the Adyar reception counter upon verification of the Booking ID.</li>
          </ul>
        </section>

        {/* Section 5: How to Cancel */}
        <div className="p-6 rounded-2xl bg-surface-2 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-navy text-sm">Need to cancel or view an upcoming booking?</h3>
            <p className="text-xs text-ink-soft">Access your confirmed reservations using your mobile number and OTP.</p>
          </div>
          <Link
            href="/my-bookings"
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition shadow-xs whitespace-nowrap"
          >
            Go to My Bookings &rarr;
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
