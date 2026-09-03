import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-xs text-ink leading-relaxed">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          Cancellation & Refund Policy
        </h1>
        <p className="text-ink-soft">Last updated: September 2026</p>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">1. Venue Cancellation Rule</h2>
          <p>
            Players can cancel confirmed bookings free of charge up to <strong>24 hours prior</strong> to match start time directly through our &apos;My Bookings&apos; self-service portal.
          </p>
          <p>
            Cancellations made within 24 hours of scheduled game time are non-refundable and forfeit the slot, as court inventory cannot be reallocated on short notice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">2. Partner Bookings (Turf Town & Aggregators)</h2>
          <p className="font-semibold text-navy">
            Important Notice Regarding Third-Party Bookings:
          </p>
          <p>
            Bookings made through third-party platforms (such as Turf Town) are strictly governed by that platform&apos;s terms and cancellation policies. All refund requests, payment disputes, and modifications for such bookings must be addressed directly with the respective partner platform where the transaction occurred.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">3. Weather & Arena Maintenance Closures</h2>
          <p>
            In the rare event that a court is unavailable due to sudden power grid outage, emergency maintenance, or roof leakage during severe rainstorms, 100% of payment will be refunded or rescheduled to another date of your choice.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
