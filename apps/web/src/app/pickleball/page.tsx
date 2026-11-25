import type { Metadata } from 'next';
import Link from 'next/link';

import {
  ArrowLink,
  FactList,
  Facts,
  FaqList,
  Figure,
  GoldButton,
  Heading,
  PageCta,
  PageHero,
  SectionHead,
  SitePage,
  Stats,
  Steps,
  Ticker,
  type FaqItem,
} from '@/components/public/site/SitePage';
import { CLUB, whatsappUrl } from '@/lib/club';
import { MembershipCheckoutModalContainer } from '@/components/public/membership/MembershipCheckoutModalContainer';
import { MembershipJoinButton } from '@/components/public/membership/MembershipJoinButton';
import { UnifiedMembershipFormSection } from '@/components/public/membership/UnifiedMembershipFormSection';
import { AcademyRateCard } from '@/components/public/academy/AcademyRateCard';

export const metadata: Metadata = {
  title: 'Pickleball · Book Courts, Membership & Academy | The Pavilion Club',
  description:
    'Chennai’s premier pickleball destination at The Pavilion Club, Mogappair East. Hourly court booking on TurfTown, shared-play membership with 12h monthly quota, and TNPA-affiliated coaching academy.',
};

const TURFTOWN_URL = 'https://turftown.in';

const COURT_SPECS = [
  { label: 'Surface', text: 'Tournament-grade acrylic cushion on three regulation courts, laid to official USA Pickleball and TNPA dimensions.' },
  { label: 'Lighting', text: 'Anti-glare shadowless LED sports illumination under high architectural pergola roofing for true day/night play.' },
  { label: 'Timing', text: 'Open daily: Monday to Friday 06:00 AM – 11:00 PM; Saturday and Sunday 06:00 AM – 12:00 AM.' },
  { label: 'Equipment', text: 'Franklin X-40 tournament balls and demo paddles available on-site at the front desk.' },
] as const;

const MEMBERSHIP_FACTS = [
  { label: 'Access window', value: 'Monday – Friday, 6:00 AM – 3:00 PM (excluding public holidays).' },
  { label: 'Included play', value: '12 hours of play per membership month; up to one 1-hour session a day.' },
  { label: 'Format', value: 'An individual membership for shared play, not a private or exclusive court booking.' },
  { label: 'Capacity', value: 'Up to six players assigned to a court per session; rotations may be used.' },
] as const;

const STATS = [
  { n: 12, unit: 'hrs', label: 'Monthly play allowance' },
  { n: 9, unit: 'hrs', label: 'Weekday window, 6 AM to 3 PM' },
  { n: 6, label: 'Players at most on a court' },
  { n: 1, unit: 'hr', label: 'Daily active play allowance' },
] as const;

const STEPS = [
  {
    title: 'Join & activate',
    text: 'Activate your shared-play membership online via Razorpay or at the front desk. Your digital metal pass is issued instantly.',
  },
  {
    title: 'Arrive at the desk',
    text: 'Arrive anytime between 6:00 AM – 3:00 PM (Monday to Friday). Present your digital pass at the front desk for instant entry.',
  },
  {
    title: 'Play 1 hour daily',
    text: 'Join the shared-play court rotation with up to six players per court. Sessions run for 60 minutes of active pickleball.',
  },
  {
    title: 'Fair play quota',
    text: 'Enjoy 12 hours of weekday play per month (up to 1 hour daily). No advance slot booking needed—quota is deducted when you check in at the desk.',
  },
] as const;

interface Clinic {
  level: string;
  badge: string;
  title: string;
  timing: string;
  summary: string;
  curriculum: readonly string[];
}

const CLINICS: readonly Clinic[] = [
  {
    level: 'Level 1',
    badge: 'Foundations',
    title: 'Beginner Clinic',
    timing: 'Morning & Evening Batches',
    summary:
      'Designed for players picking up a paddle for the first time or transitioning from tennis and badminton. Focuses on core mechanics, non-volley zone discipline, and rally confidence.',
    curriculum: [
      'Continental & Eastern grip fundamentals',
      'Non-Volley Zone (Kitchen) footwork & discipline',
      'Underhand serve placement & return depth',
      'Basic dinking technique, rallying & regulation scoring',
    ],
  },
  {
    level: 'Level 2',
    badge: 'Development',
    title: 'Intermediate Clinic',
    timing: 'Weekday & Weekend Batches',
    summary:
      'For players with basic rally consistency who want to dominate the transition zone, execute the soft game, and develop tactical partner chemistry.',
    curriculum: [
      'Third-shot drops, drives, and push-dinks',
      'Transition zone resets under heavy attacks',
      'Crosscourt directional dinking & speedup reads',
      'Court positioning, communication & stack play basics',
    ],
  },
  {
    level: 'Level 3',
    badge: 'Competition',
    title: 'Advanced Masterclass',
    timing: 'Tournament Track',
    summary:
      'High-tempo tournament preparation for competitive league and state players. Intensifies stroke precision, aggressive spin control, and high-pressure match strategy.',
    curriculum: [
      'Roll volleys, flick counters, and overhead put-aways',
      'Disguised speedups & off-the-bounce attack angles',
      'Right-side / left-side stack rotations & defensive poaching',
      'Match tempo control, mental pressure drills & game analytics',
    ],
  },
];

const FAQS: readonly FaqItem[] = [
  {
    q: 'How do I book an hourly court?',
    a: 'Hourly private court bookings are handled exclusively through our partner TurfTown. You can pick your preferred court and time slot directly on the TurfTown app or website.',
  },
  {
    q: 'What is the Pickleball Shared-Play Membership?',
    a: 'It is an individual weekday membership giving you 12 hours of court play each month (up to 1 hour per day, Mon–Fri 6:00 AM to 3:00 PM) for ₹2,360/month (all inclusive). You simply check in at the desk with your digital pass.',
  },
  {
    q: 'Is the coaching academy affiliated with TNPA?',
    a: 'Yes. The Pavilion Club Academy is officially affiliated with the Tamil Nadu Pickleball Association (TNPA), providing structured training pathways from beginner drills to state-level competitive play.',
  },
  {
    q: 'Do I need my own paddle?',
    a: 'Demo paddles and official Franklin X-40 tournament balls are provided for all academy sessions and shared-play games. You are also welcome to bring your own paddle.',
  },
];

export default function PickleballPage() {
  return (
    <SitePage>
      {/* Hero Section with 3 Route Jump Links */}
      <PageHero
        eyebrow="Pickleball at The Pavilion Club"
        lines={['Play. Compete.', <em>Belong.</em>]}
        tag="Three Regulation Courts · Mogappair East, Chennai"
        lede="Chennai’s premier pickleball destination. Whether you want hourly court bookings via TurfTown, 12 hours of shared-play membership, or TNPA-affiliated coaching clinics, find your game here."
        image="/assets/images/courts-close.jpg"
        side="USA Pickleball & TNPA Regulation"
      >
        <ArrowLink href="#booking">Book Court (TurfTown)</ArrowLink>
        <ArrowLink href="#membership">Shared-Play Membership</ArrowLink>
        <ArrowLink href="#academy">Pickleball Academy</ArrowLink>
      </PageHero>

      <Ticker
        items={[
          '3 Regulation Courts',
          'Tournament Acrylic Surface',
          'Hourly TurfTown Booking',
          'Shared-Play Membership (12h Quota)',
          'TNPA Affiliated Academy',
          'USA Pickleball Certified Balls',
          'Mogappair East, Chennai',
        ]}
      />

      {/* SECTION 1: Hourly Court Booking via TurfTown */}
      <section id="booking" className="site-section site-light site-lines scroll-mt-16">
        <div className="site-wrap grid items-center gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-24">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#040810]/15 bg-[#040810]/5 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#0a1520]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c7a26a]" />
              01 · Hourly Court Booking
            </div>
            <h2 className="site-h2 mt-6" data-lines>
              <span className="ln">
                <span>Book a Court on</span>
              </span>
              <span className="ln">
                <span>
                  <em>TurfTown.</em>
                </span>
              </span>
            </h2>
            <p className="site-manifesto mt-6" data-words>
              Reserve a private regulation pickleball court for you and your group. Available 7 days a week with instant slot confirmation, premium acrylic cushioning, anti-glare floodlights, and on-site paddle rentals.
            </p>
            <div className="mt-10">
              <Facts items={COURT_SPECS} />
            </div>
          </div>

          {/* Booking Card */}
          <aside className="site-price h-fit rounded-2xl border border-[var(--gold)]/30 bg-[#0e1b27] p-8 text-ivory lg:sticky lg:top-28" data-fade>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c7a26a]/40 bg-[#c7a26a]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#dfbc82]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c7a26a] animate-pulse" />
              Live Online Slots
            </div>
            <p className="font-serif text-2xl text-ivory">Court Reservation</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-[#c7a26a]">Instant Confirmation · Up to 4 Players per Court</p>
            <ul className="site-ticks mt-6 text-[0.88rem] text-ivory/80">
              <li>Open 06:00 AM – 11:00 PM (Daily)</li>
              <li>3 regulation tournament acrylic courts</li>
              <li>Demo paddles &amp; Franklin X-40 balls on-site</li>
              <li>Changing rooms, shower &amp; café amenities</li>
            </ul>
            <div className="mt-8 grid justify-items-start gap-4">
              <a
                href={TURFTOWN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-none bg-[#c7a26a] px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.22em] text-[#071018] shadow-lg transition-all hover:bg-[#dfbc82]"
              >
                Book Court on TurfTown ↗
              </a>
              <ArrowLink href={whatsappUrl("Hi Pavilion Club! I'd like help booking a pickleball court slot.")}>
                WhatsApp desk for booking help
              </ArrowLink>
              <ArrowLink href={CLUB.phoneHref}>Call the desk</ArrowLink>
            </div>
          </aside>
        </div>
      </section>

      {/* SECTION 2: Shared-Play Membership */}
      <section id="membership" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="02 · Pickleball Membership"
            lines={['Play pickleball.', 'Meet players.', <><em>Stay</em> active.</>]}
            intro="Make pickleball part of your weekly routine at The Pavilion Club. Join shared-play weekday sessions, meet fellow players, and enjoy dedicated court time in a welcoming community environment."
          />
          <div className="mt-14 grid items-start gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-24">
            <div>
              <Figure
                src="/assets/images/courts-side.jpg"
                alt="Three pickleball courts at The Pavilion Club under the roof"
                position="50% 65%"
                caption="Three regulation tournament courts at The Pavilion Club, Mogappair East"
                fig="Fig. 01"
                cursor="Membership"
              />
              <div className="mt-12">
                <FactList items={MEMBERSHIP_FACTS} />
              </div>
              <p className="site-note mt-8" data-fade>
                Court membership is for individual shared play. If you wish to reserve an exclusive court for your private group, please{' '}
                <a className="underline text-[#c7a26a]" href="#booking">
                  book an hourly slot via TurfTown
                </a>.
              </p>
            </div>

            {/* Pricing Card */}
            <aside className="site-price h-fit lg:sticky lg:top-28" data-fade>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#040810]/15 bg-[#040810]/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#040810]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c7a26a] animate-pulse" />
                Inaugural Offer · Save ₹1,000
              </div>
              <p className="site-price__kicker">Inaugural shared-play membership</p>
              <div className="mt-4 flex items-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#040810]/60">Standard</span>
                <span className="text-sm font-semibold line-through text-[#040810]/45">₹3,000</span>
                <span className="rounded bg-[#c7a26a]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#040810]">
                  Limited Spots
                </span>
              </div>
              <p className="site-price__amount mt-1">
                <span className="site-price__cur">₹</span>
                <span data-count="2000" data-format="inr">
                  2,000
                </span>
                <span className="site-price__per">/ month</span>
              </p>
              <p className="site-price__gst">+ GST at 18% (₹360)</p>
              <div className="site-price__total">
                <span>Total payable</span>
                <b>₹2,360 / month</b>
              </div>
              <ul className="site-ticks mt-7 text-[0.88rem]">
                <li>Mon – Fri, 6:00 AM – 3:00 PM</li>
                <li>12 hours of play a month (1 hr daily allowance)</li>
                <li>Shared play, up to six per court</li>
                <li>Instant digital metal pass issued upon registration</li>
              </ul>
              <div className="mt-9 grid justify-items-start gap-4">
                <MembershipJoinButton>Enquire to join</MembershipJoinButton>
                <ArrowLink href="/pass">View My Member Pass</ArrowLink>
                <ArrowLink href={CLUB.phoneHref}>Call the desk</ArrowLink>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* The membership in numbers, and how it works */}
      <section className="site-section site-light site-lines">
        <div className="site-wrap">
          <Stats items={STATS} />
          <div className="mt-[clamp(5rem,10vw,9rem)] grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="site-eyebrow" data-fade>
                How it works
              </p>
              <Heading lines={['Four steps', <><em>to</em> court.</>]} className="mt-7" />
              <p className="site-note mt-8" data-fade>
                Ask the front desk for your remaining sessions this month. Read the{' '}
                <a className="underline" href="/membership/#terms">
                  membership terms
                </a>{' '}
                and the{' '}
                <a className="underline" href="/rules/">
                  court rules
                </a>{' '}
                before you play.
              </p>
            </div>
            <Steps items={STEPS} />
          </div>
        </div>
      </section>

      {/* SECTION 3: Coaching Academy */}
      <section id="academy" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="03 · Coaching Academy"
            lines={['Pickleball', <em>Academy.</em>]}
            intro="Tamil Nadu’s premier structured pickleball coaching academy at The Pavilion Club. Officially affiliated with the Tamil Nadu Pickleball Association (TNPA) for players from foundation drills to tournament competition."
          />

          {/* Official Inaugural Coaching Rate Card */}
          <AcademyRateCard />

          {/* Progressive Syllabus Breakdown */}
          <div className="mt-20 border-t border-white/10 pt-16">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c7a26a] text-center">
              Training Pathways &amp; Curriculum
            </p>
            <h4 className="font-serif text-2xl sm:text-3xl text-ivory text-center mt-2">
              Progressive Skill Levels
            </h4>
          </div>

          {/* Clinics 3-Column Grid */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {CLINICS.map((clinic) => (
              <div
                key={clinic.level}
                className="group relative flex flex-col justify-between rounded-xl border border-[#c7a26a]/25 bg-[#0e1b27] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#c7a26a] hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em]">
                    <span className="text-[#c7a26a]">{clinic.level}</span>
                    <span className="rounded bg-white/5 px-2.5 py-1 text-[0.62rem] tracking-wider text-ivory/60">
                      {clinic.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-2xl text-ivory transition-colors group-hover:text-[#dfbc82]">
                    {clinic.title}
                  </h3>
                  <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-wider text-[#c7a26a]/80">{clinic.timing}</p>
                  <p className="mt-4 text-sm leading-relaxed text-ivory/70">{clinic.summary}</p>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#c7a26a]">Key Focus Areas:</p>
                    <ul className="mt-3 space-y-2 text-xs text-ivory/80">
                      {clinic.curriculum.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#c7a26a] mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/10 pt-5">
                  <GoldButton href="#enquire">Enquire for batch</GoldButton>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-white/10 bg-[#071018] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c7a26a]">Private 1-on-1 Coaching</p>
              <h4 className="font-serif text-xl text-ivory mt-1">Personalized Stroke Correction &amp; Strategy</h4>
              <p className="text-sm text-ivory/70 mt-1 max-w-xl">
                One-on-one sessions with our TNPA certified coaches focusing on video stroke analysis, third-shot drop consistency, and tournament strategy.
              </p>
            </div>
            <ArrowLink href={whatsappUrl('Hi Pavilion Club! I would like to book private 1-on-1 pickleball coaching.')}>
              Enquire on WhatsApp
            </ArrowLink>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="site-section site-cream site-lines">
        <div className="site-wrap grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
          <div>
            <p className="site-eyebrow" data-fade>
              Questions
            </p>
            <Heading lines={['Good to', <em>know.</em>]} className="mt-7" />
            <div className="mt-10" data-fade>
              <ArrowLink href="/faq/">All FAQs</ArrowLink>
            </div>
          </div>
          <FaqList items={FAQS} />
        </div>
      </section>

      <PageCta
        lines={['Join', <><em>the</em> court.</>]}
        lede="Enquire on WhatsApp or register online to begin your pickleball journey at The Pavilion Club."
        image="/assets/images/elevation-dusk-angle.jpg"
      >
        <MembershipJoinButton>Enquire to join</MembershipJoinButton>
        <ArrowLink href={CLUB.phoneHref}>Or call {CLUB.phoneDisplay}</ArrowLink>
      </PageCta>

      {/* Unified Direct Registration Section */}
      <UnifiedMembershipFormSection initialCategory="pickleball" />

      <MembershipCheckoutModalContainer />
    </SitePage>
  );
}
