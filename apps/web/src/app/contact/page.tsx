import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Navigation, Car, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Contact & Directions | The Pavilion Club Adyar',
  description: 'Find The Pavilion Club pickleball arena in Gandhi Nagar, Adyar, Chennai. Operating hours, location map, front desk phone, and amenities.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-12 text-sm text-ink leading-relaxed">
        {/* Page Header */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 border border-navy/15 text-navy text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Gandhi Nagar, Adyar &bull; Chennai</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            Contact & Directions
          </h1>
          <p className="text-ink-soft text-base max-w-2xl">
            Have questions about court availability, membership coaching, or corporate leagues? 
            Reach our Adyar reception desk directly or visit us on court.
          </p>
        </div>

        {/* Main Grid: Cards + Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Contact Cards */}
          <div className="space-y-4">
            {/* Arena Address */}
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-navy/30 transition space-y-3">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-navy/5 text-navy shrink-0">
                  <MapPin className="w-5 h-5 text-gold" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-bold text-navy text-base">Arena Address</h2>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    <strong className="text-ink">The Pavilion Club</strong><br />
                    4th Main Road, Gandhi Nagar, Adyar,<br />
                    Chennai, Tamil Nadu 600020<br />
                    <span className="text-[11px] text-ink-faint">Landmark: Near Adyar River &amp; Besant Avenue</span>
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <a
                  href="https://maps.google.com/?q=Adyar+Chennai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open in Google Maps &rarr;</span>
                </a>
                <span className="text-[11px] text-ink-soft font-mono">13.0067° N, 80.2570° E</span>
              </div>
            </div>

            {/* Front Desk Phone & WhatsApp */}
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-navy/30 transition space-y-3">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-navy/5 text-navy shrink-0">
                  <Phone className="w-5 h-5 text-gold" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-bold text-navy text-base">Front Desk &amp; WhatsApp</h2>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Direct Reception: <a href="tel:+919840012345" className="font-semibold text-navy hover:underline">+91 98400 12345</a><br />
                    WhatsApp Inquiries: <a href="https://wa.me/919840012346" target="_blank" rel="noopener noreferrer" className="font-semibold text-navy hover:underline">+91 98400 12346</a>
                  </p>
                  <p className="text-[11px] text-ink-faint">Desk active daily 06:00 AM &ndash; 11:00 PM IST</p>
                </div>
              </div>
            </div>

            {/* Email Support */}
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-navy/30 transition space-y-3">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-navy/5 text-navy shrink-0">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-bold text-navy text-base">Email Contact</h2>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Reservations: <a href="mailto:bookings@pavilionclub.in" className="text-navy hover:underline font-medium">bookings@pavilionclub.in</a><br />
                    Corporate &amp; Leagues: <a href="mailto:events@pavilionclub.in" className="text-navy hover:underline font-medium">events@pavilionclub.in</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Timetable, Rates, & Venue Amenities */}
          <div className="space-y-6">
            {/* Operating Hours Card */}
            <div className="p-8 rounded-2xl bg-surface border border-border shadow-xs space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-navy font-bold text-lg">
                  <Clock className="w-5 h-5 text-gold" />
                  <h2>Operating Hours &amp; Tariff</h2>
                </div>
                <ul className="space-y-3 text-xs divide-y divide-border">
                  <li className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-navy block">Monday &ndash; Friday</span>
                      <span className="text-[11px] text-ink-soft">Weekday Regular</span>
                    </div>
                    <div className="text-right">
                      <span className="text-ink-soft font-mono block">06:00 AM &ndash; 11:00 PM</span>
                      <span className="text-navy font-bold">₹800 / hour</span>
                    </div>
                  </li>
                  <li className="pt-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-navy block">Saturday &ndash; Sunday</span>
                      <span className="text-[11px] text-ink-soft">Weekend Prime</span>
                    </div>
                    <div className="text-right">
                      <span className="text-ink-soft font-mono block">06:00 AM &ndash; 11:00 PM</span>
                      <span className="text-gold font-bold">₹1,000 / hour</span>
                    </div>
                  </li>
                  <li className="pt-3 flex items-center justify-between">
                    <span className="font-semibold text-navy">Payment Method</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px]">
                      100% Pay at Venue (Cash / UPI)
                    </span>
                  </li>
                </ul>
              </div>

              {/* Instant Book CTA */}
              <div className="pt-2">
                <Link
                  href="/book"
                  className="block w-full text-center py-3.5 rounded-xl bg-navy text-white text-xs font-bold uppercase tracking-wider hover:bg-navy/90 transition shadow-sm"
                >
                  Check Live Availability &amp; Book &rarr;
                </Link>
              </div>
            </div>

            {/* Venue Amenities Card */}
            <div className="p-6 rounded-2xl bg-surface-2 border border-border space-y-4">
              <div className="flex items-center gap-2 text-navy font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                <h3>Club Facilities &amp; Guidelines</h3>
              </div>
              <ul className="space-y-2 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <Car className="w-3.5 h-3.5 text-navy shrink-0 mt-0.5" />
                  <span>Free dedicated parking for 4-wheelers &amp; 2-wheelers inside the arena compound.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-1.5"></span>
                  <span>Hygienic private hot water rain-shower cubicles and changing rooms available for players.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-1.5"></span>
                  <span>Non-marking court shoes strictly required on court. Paddle rental and equipment available at desk.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
