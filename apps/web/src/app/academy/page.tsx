import type { Metadata } from 'next';

import type { EnquiryField } from '@/components/public/site/EnquiryForm';
import {
  ArrowLink,
  EnquirySection,
  Facts,
  FaqList,
  Figure,
  GoldButton,
  PageHero,
  SectionHead,
  SitePage,
  Ticker,
  type FaqItem,
} from '@/components/public/site/SitePage';
import { whatsappUrl } from '@/lib/club';

export const metadata: Metadata = {
  title: 'Pickleball Academy · TNPA Affiliated Coaching',
  description:
    'Affiliated to Tamil Nadu Pickleball Association (TNPA). Premier structured coaching clinics for beginner, intermediate, and advanced players at The Pavilion Club, Mogappair East, Chennai.',
};

const FIELDS: readonly EnquiryField[] = [
  { kind: 'text', name: 'name', label: 'Name', required: true, autoComplete: 'name' },
  { kind: 'tel', name: 'phone', label: 'Phone / WhatsApp', required: true, autoComplete: 'tel' },
  {
    kind: 'select',
    name: 'age',
    label: 'Player age group',
    options: ['Child (under 12)', 'Teen (12 – 17)', 'Adult (18+)', 'More than one player'],
  },
  {
    kind: 'select',
    name: 'experience',
    label: 'Clinic level of interest',
    required: true,
    options: [
      'Level 1: Beginner Clinic (Foundations & rules)',
      'Level 2: Intermediate Clinic (Third-shot drops & resets)',
      'Level 3: Advanced Masterclass (Tournament matchplay)',
      'Not sure yet (Request coach assessment)',
    ],
  },
  {
    kind: 'select',
    name: 'timing',
    label: 'Preferred batch timing',
    options: [
      'Weekday mornings (06:00 – 08:00 AM)',
      'Weekday evenings (06:00 – 08:00 PM)',
      'Weekend batches (Saturday & Sunday)',
      'Flexible',
    ],
  },
  {
    kind: 'text',
    name: 'notes',
    label: 'What would you like to work on?',
    placeholder: 'E.g., Dinking consistency, third-shot drop, serve & return depth, match strategy.',
  },
];

const COURTS = [
  {
    label: 'Surface',
    text: "Tournament-grade acrylic on the club's three regulation courts, laid to official USA Pickleball and TNPA lines.",
  },
  {
    label: 'Lighting',
    text: 'Anti-glare shadowless LED sports lighting under the high pergola roof for clear ball tracking day and night.',
  },
  {
    label: 'Equipment',
    text: 'Franklin X-40 tournament balls and demo paddles provided for all coaching clinic participants.',
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
    q: 'Is The Pavilion Club Academy officially affiliated to TNPA?',
    a: 'Yes. The Pavilion Club Academy is officially affiliated with the Tamil Nadu Pickleball Association (TNPA), adhering to official tournament guidelines and structured player development pathways.',
  },
  {
    q: 'How do I enrol in a coaching clinic batch?',
    a: 'Submit an enquiry with your current playing experience and preferred schedule. Our coaching director will assess your level and confirm your batch allocation.',
  },
  {
    q: 'Is coaching included in the Pavilion Courts membership?',
    a: 'No. The shared-play court membership provides playing time on court. Academy clinics and private coaching programmes are enrolled separately.',
  },
  {
    q: 'Do I need my own paddle to join?',
    a: 'No. We provide high-grade demo paddles and official Franklin X-40 tournament balls for all clinic sessions. When you are ready to invest in your own paddle, our coaches will advise on the best weight and core for your play style.',
  },
  {
    q: 'When do new clinic batches begin?',
    a: 'Batches run on rolling 4-week cycles with limited slots (4 to 6 players per coach) to ensure high individual contact time. Enquire early to reserve your spot.',
  },
];

export default function AcademyPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Pickleball Academy"
        lines={['Learn. Play.', <em>Excel.</em>]}
        tag="Affiliated with Tamil Nadu Pickleball Association (TNPA)"
        lede="Tamil Nadu’s premier structured pickleball coaching academy at The Pavilion Club, Mogappair East. Professional coaching clinics for beginners, intermediate competitors, and advanced tournament athletes."
        image="/assets/images/courts-close.jpg"
        side="TNPA Affiliated · Three Courts"
      >
        <GoldButton href="#clinics">Explore clinics</GoldButton>
        <ArrowLink href="#enquire">Enquire about batches</ArrowLink>
      </PageHero>

      <Ticker
        items={[
          'TNPA Affiliated',
          'Chennai’s Premier Academy',
          'Beginner Clinics',
          'Intermediate Drills',
          'Advanced Masterclass',
          'Certified Coaches',
          'The Pavilion Club',
        ]}
      />

      {/* Section 1: Credibility & Overview */}
      <section className="site-section site-light site-lines">
        <div className="site-wrap grid items-center gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-24">
          <Figure
            src="/assets/images/courts-hall.png"
            alt="A net and court lines on one of the three courts"
            position="20% 82%"
            caption="Court 2, tournament-grade acrylic under the pergola roof"
            fig="Fig. 01"
            cursor="Academy"
          />
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#c7a26a]/40 bg-[#c7a26a]/10 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#0a1520]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c7a26a]" />
              Official TNPA Affiliation
            </div>
            <h2 className="site-h2 mt-6" data-lines>
              <span className="ln">
                <span>Chennai’s Premier</span>
              </span>
              <span className="ln">
                <span>
                  <em>Pickleball</em> Academy.
                </span>
              </span>
            </h2>
            <p className="site-manifesto mt-6" data-words>
              Officially affiliated with the Tamil Nadu Pickleball Association (TNPA), The Pavilion Club Academy provides
              structured training pathways from foundational basics to tournament-grade competition. Tell us where you are with
              your game, and we will place you in the clinic that fits.
            </p>
            <div className="mt-12">
              <Facts items={COURTS} />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 3-Tier Clinics (Phase 3 Core Pillar) */}
      <section id="clinics" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="Training Pathways"
            lines={['Structured', <em>Clinics.</em>]}
            intro="Progressive coaching syllabus designed by certified coaching staff. Small batches, individual stroke correction, and high-tempo game drills to take your game to the next level."
          />

          {/* Clinics 3-Column Grid */}
          <div className="mt-14 grid gap-6 md:grid-cols-3">
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
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ivory/50">
                      Syllabus Highlights
                    </p>
                    <ul className="mt-3 space-y-2 text-xs text-ivory/80">
                      {clinic.curriculum.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#c7a26a] leading-none">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/5 pt-4">
                  <a
                    href="#enquire"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c7a26a] transition-colors hover:text-[#dfbc82]"
                  >
                    Enquire for this clinic <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Coach Profile Card (Audio Decision) */}
          <div className="mt-16 rounded-xl border border-[#c7a26a]/30 bg-gradient-to-br from-[#122232] to-[#0a1520] p-8 shadow-xl lg:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-[100px_minmax(0,1fr)_auto]">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#c7a26a]/60 bg-[#162b3f] text-4xl text-[#c7a26a] shadow-inner">
                🎾
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c7a26a]">Director of Coaching</p>
                <h3 className="mt-2 font-serif text-2xl text-ivory lg:text-3xl">Certified TNPA Head Coach</h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ivory/70">
                  Leading syllabus architecture and player development at The Pavilion Club. Dedicated to building Chennai’s
                  strongest pickleball community through personalized stroke refinement, match intelligence, and positive court
                  culture.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <GoldButton href="#enquire" className="text-center">
                  Book Coach Assessment
                </GoldButton>
                <a
                  href={whatsappUrl('Hi Pavilion Club! I would like to enquire about coaching batches with the Head Coach.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-link text-xs uppercase tracking-[0.2em]"
                >
                  Chat with desk <i aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Luxury Action CTAs (No Fee Table - Enquiry Focus) */}
          <div className="site-actions mt-14" data-fade>
            <GoldButton href="#enquire">Enquire for upcoming batches</GoldButton>
            <ArrowLink href={whatsappUrl('Hi Pavilion Club! I would like to know about Pickleball Academy coaching batches.')}>
              Ask us on WhatsApp
            </ArrowLink>
          </div>
        </div>
      </section>

      {/* Section 3: Enquiry & FAQs */}
      <EnquirySection
        eyebrow="Enquire"
        lines={['Enquire about', <em>Academy Batches.</em>]}
        lede="Select your playing level and preferred timing. Our coaching director will reach out with the recommended clinic batch and start dates."
        aside={<FaqList items={FAQS} />}
        subject="Pickleball Academy clinic enquiry"
        fields={FIELDS}
      />
    </SitePage>
  );
}
