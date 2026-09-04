import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Sparkles, Trophy, Shield, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'About The Pavilion Club | Chennai Badminton Arena',
  description: 'World-class BWF standard badminton courts, pro synthetic flooring, and tournament-grade LED lighting in Chennai.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12 text-sm text-ink leading-relaxed">
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 border border-navy/15 text-navy text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Chennai&apos;s Benchmark Badminton Experience</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            About <span className="text-gold font-serif italic">The Pavilion</span>
          </h1>
          <p className="text-ink-soft max-w-2xl text-base">
            Engineered for passionate badminton athletes, weekend warriors, and tournament champions. We combine international court specifications with warm hospitality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-surface border border-border space-y-3">
            <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-base font-bold text-navy">BWF-Standard Courts</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              3 international standard wooden sprung synthetic mat courts designed for optimal shock absorption and joint protection.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border space-y-3">
            <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-base font-bold text-navy">Glare-Free LED</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Professional high-bay indirect LED lighting with zero vertical glare, ensuring sharp shuttlecock tracking from high smashes.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border space-y-3">
            <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center font-bold">
              <Shield className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-base font-bold text-navy">Premium Amenities</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Hygienic locker facilities, showers, racket restringing service, and a viewing gallery for family and friends.
            </p>
          </div>
        </div>

        <section className="space-y-4 rounded-xl bg-surface-2 p-8 border border-border">
          <h2 className="text-xl font-bold text-navy">Our Rules & Court Etiquette</h2>
          <ul className="space-y-2 text-xs text-ink-soft">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span>Non-marking badminton shoes are strictly mandatory on synthetic mats.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span>Report 10 minutes before your reserved match window.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span>Shuttlecocks and pro rental rackets are available at the front desk.</span>
            </li>
          </ul>
          <div className="pt-4">
            <Link
              href="/book"
              className="inline-block px-6 py-3 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition shadow-sm"
            >
              Book a Slot Now
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}