import Link from 'next/link';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export const dynamic = 'force-dynamic';

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />

      <main className="flex-1 space-y-16 sm:space-y-24">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-surface border-b border-border">
          <div className="max-w-6xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 border border-navy/15 text-navy text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>Chennai&apos;s Premier Badminton Arena</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-navy leading-[1.15]">
                Championship Badminton Courts at <span className="text-gold font-serif italic">The Pavilion</span>
              </h1>

              <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
                3 international BWF-standard wooden synthetic courts, glare-free LED lighting, and premium locker facilities. Book your slot online in seconds — pay at the venue.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center md:justify-start">
                <Link
                  href="/book"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-navy text-white text-sm font-bold hover:opacity-90 transition shadow-md flex items-center justify-center gap-2 group"
                >
                  <span>Book a Court Now</span>
                  <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/my-bookings"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-lg border border-border bg-surface text-ink text-sm font-semibold hover:bg-surface-2 transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-ink-soft" />
                  <span>My Bookings</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4 text-xs text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-ok" />
                  <span>Instant Confirmation</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-ok" />
                  <span>No Upfront Payment Required</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-ok" />
                  <span>Free 24h Cancellation</span>
                </span>
              </div>
            </div>

            {/* Right Hero Card: Court Snapshot */}
            <div className="w-full md:w-96 rounded-2xl bg-gradient-to-br from-navy to-navy/90 text-white p-6 shadow-xl border border-border-dark space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold font-bold">
                    Now Playing
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">Arena Status</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-ok"></span>
                  </span>
                  <span className="text-xs font-semibold text-ok">Open Today</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">Court 1 & 2</h4>
                    <p className="text-[11px] text-ink-on-dark/70">BWF Wooden Synthetic</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ok-soft text-ok">
                    Available
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">Court 3</h4>
                    <p className="text-[11px] text-ink-on-dark/70">Championship Synthetic</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ok-soft text-ok">
                    Available
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-ink-on-dark/70">Standard Court Rate:</span>
                <span className="font-bold text-gold text-sm font-mono">₹800 / hour</span>
              </div>

              <Link
                href="/book"
                className="w-full py-2.5 rounded-lg bg-gold text-navy font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5"
              >
                <span>Select Date & Court</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Court Amenities & Specs */}
        <section className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">
              World-Class Arena Standards
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft">
              Every detail engineered for performance, player comfort, and injury prevention
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center">
                <Zap className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-bold text-navy text-base">BWF Wooden Synthetic Flooring</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                Dual-sprung cushioned subfloor with anti-skid PVC top layer to reduce knee and joint impact during intense rallies.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-bold text-navy text-base">Glare-Free High-Bay LED Lights</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                400+ lux vertical beam lighting calibrated specifically to prevent shuttlecock glare during high smashes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-bold text-navy text-base">Showers & Changing Lounges</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                Clean private changing rooms, hot showers, locker storage, and a climate-controlled spectator gallery.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Transparent Pricing */}
        <section className="max-w-4xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft">
              No subscription or membership required. Pay per 60-minute session.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-surface border border-border shadow-xs space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                Regular Hours
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-navy font-mono">₹800</span>
                <span className="text-xs text-ink-soft">/ 60 min</span>
              </div>
              <p className="text-xs text-ink-soft">
                Monday to Friday: 06:00 AM – 06:00 PM
              </p>
              <ul className="space-y-2 text-xs text-ink pt-2 border-t border-border">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
                  <span>All 3 Courts Available</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
                  <span>Free Shuttle Cock Warmup Zone</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-navy/30 ring-1 ring-navy/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold font-semibold">
                  Peak & Weekends
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy text-gold uppercase">
                  Popular
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-navy font-mono">₹1,000</span>
                <span className="text-xs text-ink-soft">/ 60 min</span>
              </div>
              <p className="text-xs text-ink-soft">
                Evenings (06:00 PM – 11:00 PM) & All Day Saturday & Sunday
              </p>
              <ul className="space-y-2 text-xs text-ink pt-2 border-t border-border">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
                  <span>Prime Court Allocation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
                  <span>Match Scoring Board Access</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Ready to Play CTA */}
        <section className="max-w-6xl mx-auto px-4">
          <div className="p-8 sm:p-12 rounded-2xl bg-navy text-white text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Ready for your next game?
              </h2>
              <p className="text-xs sm:text-sm text-ink-on-dark/70 leading-relaxed">
                Select your preferred date, pick a slot, and receive instant confirmation on your phone.
              </p>
              <div className="pt-4">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gold text-navy font-bold text-sm hover:opacity-90 transition shadow-md"
                >
                  <span>Book a Slot in 30 Seconds</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
