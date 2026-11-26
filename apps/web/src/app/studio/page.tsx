import type { Metadata } from 'next';

import {
  ArrowLink,
  Facts,
  FaqList,
  Figure,
  GoldButton,
  Heading,
  PageCta,
  PageHero,
  SectionHead,
  SitePage,
  Ticker,
  type FaqItem,
} from '@/components/public/site/SitePage';
import { CLUB, whatsappUrl } from '@/lib/club';
import { StudioTimetable } from '@/components/public/studio/StudioTimetable';
import { StudioRateCard } from '@/components/public/studio/StudioRateCard';
import { UnifiedMembershipFormSection } from '@/components/public/membership/UnifiedMembershipFormSection';
import { MembershipCheckoutModalContainer } from '@/components/public/membership/MembershipCheckoutModalContainer';
import { MembershipJoinButton } from '@/components/public/membership/MembershipJoinButton';

export const metadata: Metadata = {
  title: 'Pavilion Studio · Dance, Fitness, Martial Arts & Wellness | The Pavilion Club',
  description:
    'Pavilion Studio at Mogappair East, Chennai. Daily scheduled classes in Dance, Salsa, Dance Fitness, Boxing, Silambam, Yoga, and Gymnastics for Kids, Juniors, Teens and Adults.',
};

const DISCIPLINES = [
  'Dance (Contemporary & Hip-Hop)',
  'Salsa & Latin Social',
  'Dance Fitness (Cardio & Core)',
  'Combat Boxing & Conditioning',
  'Yoga & Mindful Movement',
  'Silambam (Traditional Martial Arts)',
  'Gymnastics & Tumbling',
] as const;

const STUDIO_SPECS = [
  { label: 'Space', text: 'Air-conditioned sprung wooden performance floor with full-length mirrors and pro acoustic sound.' },
  { label: 'Coaching', text: 'Certified master trainers, professional dancers, and martial arts champions leading small cohorts.' },
  { label: 'Age groups', text: 'Dedicated batches for Kids (4–10 yrs), Juniors (10–14 yrs), Teens (14–18 yrs), and Adults (18+).' },
  { label: 'Admission', text: 'Register online or at the desk. Obtain your physical admission dossier slip for payment & locker allocation.' },
] as const;

const FAQS: readonly FaqItem[] = [
  {
    q: 'How do I enrol in Pavilion Studio?',
    a: 'You can choose your discipline and batch on this page, submit your registration, and generate your printable admission slip. Bring the slip to our front desk for verification, payment (UPI, card, or cash), and badge issue.',
  },
  {
    q: 'Are there batches for beginners and kids?',
    a: 'Yes! We run specialized progressive cohorts for Kids (4–10), Juniors (10–14), and Adults. Beginners are guided with foundational body mechanics and rhythm.',
  },
  {
    q: 'Can I do a trial session before committing?',
    a: 'Yes. Single trial sessions can be booked through WhatsApp or at our front desk. If you choose to join the monthly batch afterwards, your trial fee is adjusted against your membership.',
  },
  {
    q: 'What should I wear or bring to class?',
    a: 'Wear comfortable athletic attire and clean non-marking indoor footwear (or bare feet/grip socks for Yoga and Silambam). Complimentary lockers and filtered water stations are provided.',
  },
];

export default function StudioPage() {
  return (
    <SitePage>
      {/* Studio Hero Section */}
      <PageHero
        eyebrow="Pavilion Studio Mogappair"
        lines={['Move better.', <>Feel <em>stronger.</em></>]}
        tag="Dance · Fitness · Martial Arts · Wellness"
        lede="Chennai’s premier movement and fitness space. Daily curated classes in Dance, Salsa, Dance Fitness, Yoga, Boxing, Silambam, and Gymnastics led by certified master instructors in Mogappair East."
        image="/assets/images/wellness-b.jpg"
        side="Sprung Wooden Floor · All Age Cohorts"
      >
        <ArrowLink href="#timetable">Disciplines &amp; Timetable</ArrowLink>
        <ArrowLink href="#membership">Studio Membership &amp; Admission</ArrowLink>
      </PageHero>

      <Ticker
        items={[
          'Pavilion Studio',
          'Dance & Salsa',
          'Dance Fitness',
          'Combat Boxing',
          'Yoga & Mindfulness',
          'Silambam Martial Arts',
          'Gymnastics & Tumbling',
          'Mogappair East, Chennai',
        ]}
      />

      {/* SECTION 1: Disciplines & Showcase */}
      <section id="disciplines" className="site-section site-dark site-lines scroll-mt-16">
        <div className="site-wrap grid items-start gap-14 lg:grid-cols-2 lg:gap-24">
          <div className="lg:sticky lg:top-28">
            <Figure
              src="/assets/images/wellness-b.jpg"
              alt="Pavilion Studio mirrored hall with mats and natural lighting"
              caption="Pavilion Studio · Sprung wooden flooring and acoustic treatment"
              fig="Fig. 01"
              cursor="Studio"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#c7a26a]/40 bg-[#c7a26a]/15 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#dfbc82]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c7a26a]" />
              01 · Movement Disciplines
            </div>
            <Heading lines={['Find your', <><em>expression &amp; strength.</em></>]} className="mt-7" />
            <p className="site-lede mt-6 max-w-xl" data-fade>
              Discover movement and physical discipline at Pavilion Studio. Designed to help students, working professionals, and seniors develop strength, rhythm, flexibility, and agility.
            </p>
            <ul className="site-words mt-10">
              {DISCIPLINES.map((discipline, i) => (
                <li key={discipline}>
                  <span>0{i + 1}</span>
                  {discipline}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Facts items={STUDIO_SPECS} />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5" data-fade>
              <GoldButton href="#membership">Enrol in batch</GoldButton>
              <ArrowLink href={CLUB.phoneHref}>Call the desk</ArrowLink>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Rate Card & Timetable */}
      <section id="timetable" className="site-section site-deep site-lines border-t border-[var(--gold-line)] scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="02 · Pricing & Master Schedule"
            lines={['Class Rates &', <em>Timetable.</em>]}
            intro="Transparent cohort pricing and daily class schedules across all disciplines. Click any programme or batch to jump directly into admission registration."
          />
          <div className="mt-12">
            <StudioRateCard />
          </div>
          <div className="mt-16">
            <StudioTimetable />
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="site-section site-cream site-lines">
        <div className="site-wrap grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
          <div>
            <p className="site-eyebrow" data-fade>
              Studio FAQs
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
        lines={['Step onto', <><em>the</em> floor.</>]}
        lede="Enrol in your favourite discipline, join a supportive batch, and begin moving with purpose."
        image="/assets/images/elevation-dusk-angle.jpg"
      >
        <MembershipJoinButton category="studio">Enrol now</MembershipJoinButton>
        <ArrowLink href={CLUB.phoneHref}>Or call {CLUB.phoneDisplay}</ArrowLink>
      </PageCta>

      {/* Studio Admission / Membership Form (Right above Footer, matching Pickleball) */}
      <div id="membership" className="scroll-mt-16">
        <UnifiedMembershipFormSection initialCategory="studio" />
      </div>

      <MembershipCheckoutModalContainer />
    </SitePage>
  );
}
