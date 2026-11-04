import type { Metadata } from 'next';

import {
  ArrowLink,
  FactList,
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

export const metadata: Metadata = {
  title: 'Memberships · Pavilion Courts & Pavilion Studio',
  description:
    'Two ways to join The Pavilion Club in Mogappair East, Chennai: Pavilion Courts shared-play pickleball membership and Pavilion Studio for yoga, dance, fitness and gymnastics.',
};

const JOIN_URL = whatsappUrl("Hi Pavilion Club! I'd like to join the Pavilion Courts shared-play membership.");

const COURTS_FACTS = [
  { label: 'Access', value: 'Monday – Friday, 6:00 AM – 3:00 PM.' },
  { label: 'Included play', value: 'Up to 20 one-hour sessions per membership month; at most one session a day.' },
  { label: 'Format', value: 'An individual membership for shared play, not a private or exclusive court booking.' },
  { label: 'Capacity', value: 'Up to six players assigned to a court per session; rotations may be used.' },
  { label: 'Booking', value: 'Reserve each session in advance, subject to availability.' },
] as const;

const STATS = [
  { n: 20, label: 'One-hour sessions a membership month' },
  { n: 9, unit: 'hrs', label: 'Weekday window, 6 AM to 3 PM' },
  { n: 6, label: 'Players at most on a court' },
  { n: 12, unit: 'hrs', label: 'Notice to cancel a session' },
] as const;

const STEPS = [
  {
    title: 'Join',
    text: 'Enquire on WhatsApp or at the front desk. Payment is due in full before your membership is activated.',
  },
  {
    title: 'Book',
    text: 'Reserve each session in advance through the front desk. Your booking must be confirmed before you arrive.',
  },
  {
    title: 'Arrive on time',
    text: 'Sessions start and finish inside the 6:00 AM – 3:00 PM window. Arriving late does not extend your session.',
  },
  {
    title: 'Cancel early',
    text: 'Cancel at least 12 hours before. Later cancellations and no-shows usually count as a used session.',
  },
] as const;

const STUDIO = ['Yoga', 'Dance', 'Fitness', 'Gymnastics'] as const;

const FAQS: readonly FaqItem[] = [
  {
    q: 'Can I book a private court through a shared-play membership?',
    a: 'No. The inaugural membership is for shared play and does not reserve a private or exclusive court.',
  },
  {
    q: 'How many sessions are included?',
    a: 'Up to 20 one-hour sessions per membership month, with a maximum of one session per day during the weekday access window (Monday – Friday, 6:00 AM – 3:00 PM).',
  },
  {
    q: 'Can I request a preferred time or skill group?',
    a: 'Bookings are subject to availability. The club will try to group players by approximate skill level, but exact matching and preferred times cannot be guaranteed.',
  },
  {
    q: 'What if the club cancels a confirmed membership session?',
    a: 'The session is restored to your balance, or you are offered an equivalent rescheduling option.',
  },
  {
    q: 'Is coaching included in the membership?',
    a: (
      <>
        No. Coaching and Academy programmes are separate. See the <a href="/academy/">Pickleball Academy</a>.
      </>
    ),
  },
  {
    q: 'Can I book yoga, dance, fitness or gymnastics online?',
    a: 'Not yet. The Studio timetable and how to book will be published here once programmes, class sizes, membership plans and cancellation rules are finalised.',
  },
];

export default function MembershipPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Memberships"
        lines={['Your everyday', <em>getaway.</em>]}
        tag="Two ways to join"
        lede="Join a vibrant community where you can play, move, learn and unwind. Choose the membership that fits your passion: pickleball or studio."
        image="/assets/images/courts-side.jpg"
        side="Weekdays from 06:00 AM"
      >
        <ArrowLink href="#courts">Pickleball Membership</ArrowLink>
        <ArrowLink href="#studio">Studio Membership</ArrowLink>
      </PageHero>

      <Ticker
        items={['Pickleball Membership', 'Shared play', '20 sessions a month', 'Pavilion Studio', 'Yoga', 'Dance', 'Fitness', 'Gymnastics']}
      />

      {/* A · Pavilion Courts */}
      <section id="courts" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="01 · Pickleball Membership"
            lines={['Play pickleball.', 'Meet people.', <><em>stay</em> active.</>]}
            intro="Make pickleball part of your routine at The Pavilion Club. Join shared-play sessions, meet players and enjoy court time in a welcoming club environment."
          />
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-20">
            <div>
              <FactList items={COURTS_FACTS} />
              <p className="site-note mt-8" data-fade>
                <strong>Not included unless stated:</strong> private court hire, coaching and academy programmes,
                tournament entry, equipment rental, food and beverages, parties and other paid events.
              </p>
            </div>
            <aside className="site-price h-fit lg:sticky lg:top-28" data-fade>
              <p className="site-price__kicker">Inaugural shared-play membership</p>
              <p className="site-price__amount">
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
                <li>Up to 20 one-hour sessions a month</li>
                <li>Shared play, up to six per court</li>
              </ul>
              <div className="mt-9 grid justify-items-start gap-5">
                <GoldButton href="#join">Enquire to join</GoldButton>
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
                <a className="underline" href="#terms">
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

      {/* B · Pavilion Studio */}
      <section id="studio" className="site-section site-dark site-lines scroll-mt-16">
        <div className="site-wrap grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
          <Figure
            src="/assets/images/wellness-b.jpg"
            alt="Pavilion Studio: a mirrored room with mats laid out"
            caption="Pavilion Studio · concept render"
            fig="Fig. 02"
            cursor="Studio"
          />
          <div>
            <p className="site-eyebrow" data-fade>
              02 · Pavilion Studio
            </p>
            <Heading lines={['Move better.', <>Feel <em>stronger.</em></>, 'Find your flow.']} className="mt-7" />
            <p className="site-lede mt-8 max-w-xl" data-fade>
              Discover movement and wellbeing at Pavilion Studio, with scheduled activities designed to help you build a
              routine that fits your lifestyle.
            </p>
            <ul className="site-words mt-10" data-stagger>
              {STUDIO.map((activity, i) => (
                <li key={activity}>
                  <span>0{i + 1}</span>
                  {activity}
                </li>
              ))}
            </ul>
            <div className="site-soon mt-10" data-fade>
              <b>Coming soon</b>
              <span>
                The timetable, class lengths, instructors, class sizes and membership plans will be published here once
                they are finalised.
              </span>
            </div>
            <div className="mt-8" data-fade>
              <ArrowLink href={whatsappUrl('Hi Pavilion Club! Please let me know when Pavilion Studio opens.')}>
                Get notified when Studio opens
              </ArrowLink>
            </div>
          </div>
        </div>
      </section>

      {/* Membership terms */}
      <section id="terms" className="site-section site-light scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="Membership terms"
            lines={[<>The <em>fine</em> print.</>]}
            intro="Prices include GST at 18% as shown. Pavilion Studio terms will be published with its plans."
          />
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <h3 className="site-h3" data-fade>
                Shared-play membership sessions
              </h3>
              <ul className="site-ticks mt-6 text-[0.95rem] text-[var(--soft)]" data-stagger>
                <li>Book in advance through the club&apos;s booking system or the front desk; confirmation is required before you arrive.</li>
                <li>One session per day and no more than 20 sessions per membership month.</li>
                <li>Sessions are valid Monday – Friday, 6:00 AM – 3:00 PM, and must start and finish within this window.</li>
                <li>Sessions are personal and non-transferable. Unused sessions do not roll over.</li>
                <li>Cancel at least 12 hours before the scheduled session.</li>
                <li>Cancellations made less than 12 hours before the session, and no-shows, ordinarily count as a used session.</li>
                <li>Late arrival does not extend the session. If the club cancels a confirmed session, your session balance is restored or an equivalent rescheduling option is offered.</li>
                <li>Bookings are subject to availability, skill-group schedules, maintenance, private events, tournaments and club closures.</li>
              </ul>
            </div>
            <div>
              <h3 className="site-h3" data-fade>
                Payment, renewal and refunds
              </h3>
              <ul className="site-ticks mt-6 text-[0.95rem] text-[var(--soft)]" data-stagger>
                <li>Payment is due in full before activation.</li>
                <li>There is no automatic renewal unless it is clearly offered and you expressly authorise it.</li>
                <li>Once activated, fees are generally non-refundable, except where required by law or approved by the club in writing. Your statutory consumer rights are not affected.</li>
                <li>Material changes to pricing or membership benefits are communicated before they apply to a renewal or a new purchase.</li>
              </ul>
              <p className="site-note mt-8" data-fade>
                See also the <a className="underline" href="/rules/">court rules</a>,{' '}
                <a className="underline" href="/cancellation/">cancellation &amp; refund policy</a>,{' '}
                <a className="underline" href="/privacy/">privacy notice</a> and{' '}
                <a className="underline" href="/terms/">website terms</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

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
        lines={['Join', <><em>the</em> club.</>]}
        lede="Enquire on WhatsApp or at the front desk, and play your first session this week."
        image="/assets/images/elevation-dusk-angle.jpg"
      >
        <GoldButton href="#join">Enquire to join</GoldButton>
        <ArrowLink href={CLUB.phoneHref}>Or call {CLUB.phoneDisplay}</ArrowLink>
      </PageCta>
      <MembershipCheckoutModalContainer />
    </SitePage>
  );
}
