import Link from 'next/link';
import { MapPin, Phone, Clock, Mail } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-navy text-white pt-12 pb-8 border-t border-border-dark mt-16 text-xs">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1: About */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gold text-navy flex items-center justify-center font-bold text-sm">
              P
            </div>
            <span className="font-bold tracking-wider text-base uppercase text-white">
              The Pavilion Club
            </span>
          </div>
          <p className="text-ink-on-dark/70 text-xs leading-relaxed">
            Premier indoor badminton & sports arena. 3 professional BWF-grade wooden synthetic courts, glare-free lighting, and luxury player amenities.
          </p>
        </div>

        {/* Col 2: Hours & Rates */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold tracking-wider text-gold">Operating Hours</h3>
          <div className="space-y-1 text-ink-on-dark/80 text-xs">
            <p>Mon – Fri: 06:00 AM – 11:00 PM</p>
            <p>Sat – Sun: 06:00 AM – 12:00 Midnight</p>
            <div className="pt-2 border-t border-white/10 text-gold font-medium">
              ₹800/hr Regular · ₹1,000/hr Peak
            </div>
          </div>
        </div>

        {/* Col 3: Location */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold tracking-wider text-gold">Location & Contact</h3>
          <div className="space-y-1 text-ink-on-dark/80 text-xs">
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>42 Club Road, Adyar, Chennai 600020</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>+91 98765 43210</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>bookings@pavilion.club</span>
            </p>
          </div>
        </div>

        {/* Col 4: Legal */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold tracking-wider text-gold">Club Policies</h3>
          <ul className="space-y-1.5 text-xs text-ink-on-dark/70">
            <li>
              <Link href="/terms" className="hover:text-gold transition">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-gold transition">
                Privacy Policy (DPDP 2023)
              </Link>
            </li>
            <li>
              <Link href="/cancellation-policy" className="hover:text-gold transition">
                Cancellation & Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-ink-on-dark/50 gap-2">
        <p>© 2026 The Pavilion Club. All rights reserved.</p>
        <p>Non-marking badminton shoes strictly required on all courts.</p>
      </div>
    </footer>
  );
}
