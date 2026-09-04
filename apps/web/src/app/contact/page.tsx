import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | The Pavilion Club',
  description: 'Reach The Pavilion Club badminton arena in Chennai. Operating hours, location directions, and desk contact.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10 text-sm text-ink leading-relaxed">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            Contact & Directions
          </h1>
          <p className="text-ink-soft text-base">
            Have a question about court reservations, coaching, or corporate bulk bookings? Reach our reception desk directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Cards */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-surface border border-border flex items-start gap-4">
              <div className="p-3 rounded-lg bg-navy/5 text-navy shrink-0">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-navy text-base">Arena Address</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  The Pavilion Club, Sports Arena Complex,<br />
                  Anna Nagar West Extension,<br />
                  Chennai, Tamil Nadu 600101
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border flex items-start gap-4">
              <div className="p-3 rounded-lg bg-navy/5 text-navy shrink-0">
                <Phone className="w-5 h-5 text-gold" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-navy text-base">Front Desk & WhatsApp</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  +91 98765 43210 / +91 98765 43211<br />
                  Available 06:00 AM - 11:00 PM IST daily
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border flex items-start gap-4">
              <div className="p-3 rounded-lg bg-navy/5 text-navy shrink-0">
                <Mail className="w-5 h-5 text-gold" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-navy text-base">Email & Grievance Contact</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Support: bookings@pavilionclub.in<br />
                  Manager: anand.manager@pavilionclub.in
                </p>
              </div>
            </div>
          </div>

          {/* Operating Hours Card */}
          <div className="p-8 rounded-xl bg-surface border border-border flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-navy font-bold text-lg">
                <Clock className="w-5 h-5 text-gold" />
                <h2>Operating Hours</h2>
              </div>
              <ul className="space-y-3 text-xs divide-y divide-border">
                <li className="pt-2 flex items-center justify-between">
                  <span className="font-semibold text-navy">Monday - Friday</span>
                  <span className="text-ink-soft font-mono">06:00 AM - 11:00 PM</span>
                </li>
                <li className="pt-3 flex items-center justify-between">
                  <span className="font-semibold text-navy">Saturday - Sunday</span>
                  <span className="text-ink-soft font-mono">06:00 AM - 12:00 Midnight</span>
                </li>
                <li className="pt-3 flex items-center justify-between">
                  <span className="font-semibold text-navy">Peak Hours</span>
                  <span className="text-gold font-mono font-medium">06:00 PM - 11:00 PM</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-navy/5 border border-navy/15 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
              <p className="text-[11px] text-ink-soft leading-snug">
                Parking facilities for both 2-wheelers and 4-wheelers are available inside the arena premises.
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}