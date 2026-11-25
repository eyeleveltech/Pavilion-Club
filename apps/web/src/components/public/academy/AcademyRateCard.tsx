'use client';

import React from 'react';
import { CLUB, whatsappUrl } from '@/lib/club';

export interface AcademyPricingTier {
  id: string;
  category: string;
  badge: string;
  title: string;
  targetAge: string;
  sessions: string;
  priceDisplay: string;
  taxNote: string;
  totalWithGst?: string;
  features: string[];
  accent?: boolean;
  enquireMessage: string;
}

export const ACADEMY_COACHING_OFFERS: AcademyPricingTier[] = [
  {
    id: 'kids',
    category: 'A · Beginners & Intermediate',
    badge: 'Upto 14 Years of Age',
    title: 'Kids Coaching Clinic',
    targetAge: 'Kids & Juniors (Ages 6–14)',
    sessions: '12 sessions per month',
    priceDisplay: '₹3,000',
    taxNote: '+ GST at 18% (₹540)',
    totalWithGst: '₹3,540 / month all-inclusive',
    features: [
      '12 structured coaching sessions a month (1 hr each)',
      'Foundational grip, stance, and hand-eye ball tracking',
      'Non-volley zone (Kitchen) rules & court safety',
      'Footwork agility drills, rallies & regulation scoring',
      'Franklin X-40 tournament balls & demo paddles provided',
      'Small batch size (max 4–6 students per coach)',
    ],
    accent: false,
    enquireMessage: "Hi Pavilion Club! I'd like to enrol my child in the Kids Pickleball Coaching Clinic (12 sessions · ₹3,000/mo).",
  },
  {
    id: 'adults',
    category: 'A · Beginners & Intermediate',
    badge: 'Popular · 12 Sessions / Month',
    title: 'Adults Coaching Clinic',
    targetAge: 'Teens & Adults (14+ / 18+)',
    sessions: '12 sessions per month',
    priceDisplay: '₹4,500',
    taxNote: '+ GST at 18% (₹810)',
    totalWithGst: '₹5,310 / month all-inclusive',
    features: [
      '12 progressive coaching sessions per month (1 hr each)',
      'Third-shot drops, transition zone resets & push-dinks',
      'Directional crosscourt dinking & speedup reading',
      'Court positioning, communication & stack play basics',
      'Morning, evening, and weekend batch slots available',
      'Certified TNPA coaches with video stroke analysis',
    ],
    accent: true,
    enquireMessage: "Hi Pavilion Club! I'd like to enrol in the Adults Pickleball Coaching Clinic (12 sessions · ₹4,500/mo).",
  },
  {
    id: 'personal',
    category: 'B · Private 1-on-1 Training',
    badge: 'Customized · 1-on-1',
    title: 'Personal Training 1 on 1',
    targetAge: 'All Players (Beginner to Tournament)',
    sessions: 'Flexible Custom Session Packs',
    priceDisplay: 'Upon Request',
    taxNote: 'Custom quote (+ 18% GST)',
    totalWithGst: 'Pack pricing tailored to goals',
    features: [
      'Dedicated 1-on-1 coaching with senior TNPA coach',
      'Intensive stroke mechanics & aggressive spin control',
      'High-pressure matchplay drills & competitive game analytics',
      'Tailored session scheduling matched to your calendar',
      'Personalized video breakdown & tournament roadmap',
    ],
    accent: false,
    enquireMessage: "Hi Pavilion Club! I'd like to request a personal 1-on-1 pickleball training assessment.",
  },
];

export function AcademyRateCard() {
  return (
    <div className="mt-8">
      {/* Kicker & Heading */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c7a26a]/40 bg-[#c7a26a]/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#dfbc82]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c7a26a] animate-pulse" />
          Inaugural Coaching Offer
        </div>
        <h3 className="mt-4 font-serif text-3xl sm:text-4xl text-ivory">
          Structured Coaching Syllabus &amp; Rates
        </h3>
        <p className="mt-3 text-sm text-ivory/70 leading-relaxed">
          12 sessions per month for beginner and intermediate players. Affiliated with the Tamil Nadu Pickleball Association (TNPA). Small cohorts for high individual attention.
        </p>
      </div>

      {/* 3-Card Grid */}
      <div className="grid gap-8 md:grid-cols-3">
        {ACADEMY_COACHING_OFFERS.map((tier) => (
          <div
            key={tier.id}
            className={`relative flex flex-col justify-between rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1.5 shadow-2xl ${
              tier.accent
                ? 'border-[#c7a26a] bg-gradient-to-b from-[#142637] to-[#0a1520] ring-1 ring-[#c7a26a]/40'
                : 'border-white/15 bg-[#0e1b27] hover:border-[#c7a26a]/60'
            }`}
          >
            {tier.accent && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#c7a26a] px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#071018] shadow-md">
                Featured Batch
              </div>
            )}

            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                <span className="text-[#c7a26a]">{tier.category}</span>
                <span className="rounded bg-white/5 px-2.5 py-1 text-[10px] font-mono text-ivory/70">
                  {tier.badge}
                </span>
              </div>

              <h4 className="mt-4 font-serif text-2xl text-ivory">{tier.title}</h4>
              <p className="mt-1 text-xs text-ivory/60 font-medium">{tier.targetAge}</p>

              {/* Pricing Section */}
              <div className="mt-6 rounded-xl border border-white/10 bg-[#071018]/80 p-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-serif text-3xl font-bold text-white">{tier.priceDisplay}</span>
                  {tier.priceDisplay.startsWith('₹') && (
                    <span className="text-xs text-ivory/60 uppercase tracking-wider">/ month</span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-[#c7a26a] font-medium">{tier.taxNote}</span>
                  <span className="text-ivory/50 font-mono">{tier.sessions}</span>
                </div>
                {tier.totalWithGst && (
                  <p className="mt-2 border-t border-white/10 pt-2 text-[10px] uppercase tracking-wider text-ivory/70 font-mono">
                    Total: <strong className="text-white">{tier.totalWithGst}</strong>
                  </p>
                )}
              </div>

              {/* Features List */}
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c7a26a]">
                  Curriculum &amp; Batch Benefits:
                </p>
                <ul className="mt-3 space-y-2.5 text-xs text-ivory/80">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-[#c7a26a] font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
              <a
                href="#enquire"
                className={`inline-flex w-full items-center justify-center rounded-none px-5 py-3.5 text-center text-xs font-bold uppercase tracking-[0.2em] transition-all ${
                  tier.accent
                    ? 'bg-[#c7a26a] text-[#071018] hover:bg-[#dfbc82]'
                    : 'border border-[#c7a26a]/60 text-ivory hover:bg-[#c7a26a] hover:text-[#071018]'
                }`}
              >
                Enquire for Batch
              </a>

              <a
                href={whatsappUrl(tier.enquireMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-[11px] text-[#c7a26a] hover:underline"
              >
                Chat on WhatsApp about this batch ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Footnote about batch separation and GST */}
      <div className="mt-8 rounded-xl border border-white/10 bg-[#071018]/50 p-4 text-center text-xs text-ivory/60 leading-relaxed">
        <span>GST at 18% is applicable to all coaching packages. </span>
        <strong className="text-white">Note:</strong> Kids and Adults clinics run as completely independent batches to ensure age-appropriate pedagogy. Need help choosing? Call the desk at{' '}
        <a href={CLUB.phoneHref} className="text-[#c7a26a] underline font-semibold">
          {CLUB.phoneDisplay}
        </a>.
      </div>
    </div>
  );
}
