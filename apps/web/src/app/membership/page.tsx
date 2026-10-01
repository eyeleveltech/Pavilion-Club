'use client';

import Link from 'next/link';
import { Shield, Sparkles, Trophy, Calendar, Users, Coffee, ArrowRight, CheckCircle2, Phone, Mail } from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function MembershipPage() {
  const tiers = [
    {
      name: 'Resident Player',
      category: 'Regular Play',
      price: '₹3,500',
      period: 'per month',
      description: 'Designed for active weekly players seeking regular game time and court-side community privileges.',
      badge: 'Popular',
      features: [
        '7-day advance booking window (vs 3-day guest limit)',
        '15% privilege discount on all court bookings',
        '2 complimentary guest guest passes per month',
        'Guaranteed slot in Thursday Night League & Ladders',
        'Access to member locker & shower suites',
        'Court-side café courtesy: 10% on all orders'
      ],
      cta: 'Apply for Resident Tier',
      highlight: false
    },
    {
      name: 'Founding Patron',
      category: 'Flagship Tier · Limited to 50',
      price: '₹32,000',
      period: 'annual membership',
      description: 'The definitive Pavilion Club experience. Maximum flexibility, prestige benefits, and unlimited off-peak play.',
      badge: 'Exclusive',
      features: [
        '14-day advance booking window — secure prime court hours first',
        'Unlimited off-peak court bookings (Mon–Fri 06:00 – 16:00)',
        '20% privilege discount on peak evening & weekend slots',
        '5 complimentary guest passes per month',
        'Personal engraved paddle sleeve & dedicated kit locker',
        'Exclusive invitation to Chennai Invitational & Club Cup',
        'Complimentary hydration bar & 15% café courtesy'
      ],
      cta: 'Request Founding Invitation',
      highlight: true
    },
    {
      name: 'Corporate Guild',
      category: 'Companies & Syndicates',
      price: 'Custom',
      period: 'annual syndicate',
      description: 'Tailored for corporate teams, founders, and private sporting syndicates requiring recurring prime courts.',
      badge: 'Teams',
      features: [
        'Up to 10 designated corporate players',
        'Reserved 2-hour recurring weekly prime slot',
        'Dedicated corporate concierge & consolidated monthly billing',
        'Quarterly private tournament hosting privileges',
        'Executive meeting lounge & hospitality package',
        'Custom team coaching clinics with certified pros'
      ],
      cta: 'Inquire Corporate Syndicate',
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B141B] text-[#F9F6ED] flex flex-col justify-between selection:bg-[#C7A26A] selection:text-[#0B141B]">
      {/* Brand Header */}
      <header className="border-b border-[#F9F6ED]/10 bg-[#0B141B]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="font-serif italic text-2xl text-[#C7A26A] font-bold tracking-tight">The</span>
            <span className="font-sans font-extrabold uppercase tracking-widest text-lg text-[#F9F6ED] group-hover:text-[#C7A26A] transition">
              Pavilion Club
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-[#F9F6ED]/70">
            <Link href="/" className="hover:text-[#F9F6ED] transition">Home</Link>
            <Link href="/membership" className="text-[#C7A26A] border-b border-[#C7A26A] pb-0.5">Membership</Link>
            <Link href="/book" className="hover:text-[#F9F6ED] transition">Booking</Link>
            <Link
              href="/book"
              className="ml-2 px-4 py-2 rounded-full bg-[#C7A26A] text-[#0B141B] font-bold text-xs uppercase tracking-wider hover:bg-[#F9F6ED] transition shadow-md"
            >
              Book Court
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16 sm:py-24 space-y-20 flex-1">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C7A26A]/30 bg-[#C7A26A]/10 text-[#C7A26A] text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Private Guild &amp; Player Privilege
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-normal tracking-tight text-[#F9F6ED] leading-tight">
            Belong to Chennai&apos;s <br />
            <span className="italic text-[#C7A26A]">Private Pickleball Guild</span>
          </h1>
          <p className="text-[#F9F6ED]/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-sans font-light">
            More than just guaranteed court reservations. A community of competitive players, evening socials, court-side privileges, and tournament play under Anna Nagar&apos;s architectural timber roof.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl flex flex-col justify-between p-8 transition duration-300 ${
                tier.highlight
                  ? 'bg-gradient-to-b from-[#162738] to-[#0E1A25] border-2 border-[#C7A26A] shadow-2xl ring-1 ring-[#C7A26A]/40'
                  : 'bg-[#101D28]/80 border border-[#F9F6ED]/10 hover:border-[#C7A26A]/40'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C7A26A] text-[#0B141B] text-[10px] font-extrabold uppercase tracking-widest py-1 px-4 rounded-full shadow-lg">
                  Most Prestigious
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#C7A26A] mb-1">
                    {tier.category}
                  </div>
                  <h3 className="text-2xl font-serif text-[#F9F6ED] font-normal">{tier.name}</h3>
                  <p className="text-xs text-[#F9F6ED]/60 mt-2 leading-relaxed font-sans font-light">
                    {tier.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#F9F6ED]/10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-serif font-bold text-[#F9F6ED]">
                      {tier.price}
                    </span>
                    <span className="text-xs text-[#F9F6ED]/50 uppercase tracking-wider font-sans">
                      {tier.period}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#F9F6ED]/40">
                    Privileges Included
                  </div>
                  <ul className="space-y-2.5">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-[#F9F6ED]/80 leading-snug">
                        <CheckCircle2 className="w-4 h-4 text-[#C7A26A] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8 mt-6 border-t border-[#F9F6ED]/10">
                <a
                  href={`https://wa.me/919876543210?text=Hi%20The%20Pavilion%20Club%2C%20I%20would%20like%20to%20apply%20for%20the%20${encodeURIComponent(tier.name)}%20Membership.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                    tier.highlight
                      ? 'bg-[#C7A26A] text-[#0B141B] hover:bg-[#F9F6ED] shadow-lg'
                      : 'bg-[#F9F6ED]/10 text-[#F9F6ED] hover:bg-[#C7A26A] hover:text-[#0B141B]'
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Concierge & Inquiries Banner */}
        <div className="rounded-2xl border border-[#C7A26A]/30 bg-gradient-to-r from-[#11202D] via-[#162738] to-[#11202D] p-8 sm:p-12 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <h3 className="text-2xl font-serif text-[#F9F6ED]">Prefer a Private Club Tour &amp; Trial?</h3>
            <p className="text-sm text-[#F9F6ED]/70 leading-relaxed font-light">
              Visit us in Anna Nagar West. Inspect our tournament cushion courts, private shower suites, and meet our resident coach before submitting your membership application.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#F9F6ED]/20 text-[#F9F6ED] text-xs font-semibold uppercase tracking-wider hover:border-[#C7A26A] hover:text-[#C7A26A] transition"
            >
              <Phone className="w-4 h-4 text-[#C7A26A]" />
              <span>+91 98765 43210</span>
            </a>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C7A26A] text-[#0B141B] text-xs font-bold uppercase tracking-wider hover:bg-[#F9F6ED] transition shadow-md"
            >
              <span>Book Hourly Court</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#F9F6ED]/10 py-10 bg-[#0A1520] text-center text-xs text-[#F9F6ED]/50 space-y-2">
        <p className="font-serif italic text-base text-[#F9F6ED]/80">The Pavilion Club · Anna Nagar West</p>
        <p>© 2026 The Pavilion Club. All rights reserved. Membership by application &amp; committee approval.</p>
      </footer>
    </div>
  );
}
