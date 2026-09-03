import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-xs text-ink leading-relaxed">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Terms of Service</h1>
        <p className="text-ink-soft">Last updated: September 2026</p>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">1. Court Licence & Use</h2>
          <p>
            Booking a slot at The Pavilion Club grants a temporary, revocable licence to use the designated badminton court for the reserved time window. Players must strictly wear non-marking badminton shoes. Barefoot play, running shoes, or black-soled footwear are strictly prohibited to preserve court surface integrity.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">2. Payment & Arrival</h2>
          <p>
            For bookings under &apos;Pay at Venue&apos; mode, full payment via cash, UPI, or card must be cleared at the front desk prior to entering the court. Customers are requested to arrive at least 10 minutes prior to their match time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy">3. Code of Conduct & Safety</h2>
          <p>
            Players are responsible for their personal physical fitness and safety. The Pavilion Club accepts no liability for personal injuries or lost belongings. Abusive behavior, foul language, or intentional damage to nets and equipment will result in immediate expulsion and permanent blacklisting.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
