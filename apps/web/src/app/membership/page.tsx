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
import { MembershipPurchaseFlow } from '@/components/public/membership/MembershipPurchaseFlow';

export const metadata: Metadata = {
  title: 'Memberships · Pavilion Courts & Pavilion Studio',
  description:
    'Two ways to join The Pavilion Club in Mogappair East, Chennai: Pavilion Courts shared-play pickleball membership and Pavilion Studio for yoga, dance, fitness and gymnastics.',
};

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
    title: 'Join online',
    text: 'Register and pay securely on the website (or join at the front desk). Your membership pass and 20 sessions activate instantly.',
  },
  {
    title: 'Book',
    text: 'Reserve each session in advance online on our booking calendar (redeem your hour credits at ₹0) or through the front desk.',
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
    q: 'Can I purchase the membership online directly?',
    a: 'Yes. You can purchase the Inaugural Shared-Play Membership online with instant verification and Razorpay payment (UPI, Cards, NetBanking). Your digital pass is generated immediately.',
  },
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
        <GoldButton href="#courts">Pavilion Courts</GoldButton>
        <ArrowLink href="#studio">Pavilion Studio</ArrowLink>
      </PageHero>

      <Ticker
        items={['Pavilion Courts', 'Shared play', '20 sessions a month', 'Pavilion Studio', 'Yoga', 'Dance', 'Fitness', 'Gymnastics']}
      />

      {/* A · Pavilion Courts */}
      <section id="courts" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="A · Pavilion Courts"
            lines={['Play pickleball.', 'Meet people.', <><em>stay</em> active.</>]}
            intro="Make pickleball part of your routine at The Pavilion Club. Join shared-play sessions, meet players and enjoy court time in a welcoming club environment."
          />
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-20">
            <div>
              <FactList items={COURTS_FACTS} />
              <div className="mt-14">
                <Stats items={STATS} />
              </div>
            </div>

            <aside className="site-price">
              <b>
                ₹2,000<span>/mo + GST</span>
              </b>
              <p>₹2,360 a month inclusive of GST. Monday – Friday, 6:00 AM – 3:00 PM.</p>
              <div className="mt-8">
                <MembershipPurchaseFlow />
              </div>
              <div className="mt-4">
                <ArrowLink href="#terms">Read membership terms</ArrowLink>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="site-section site-cream site-lines">
        <div className="site-wrap">
          <SectionHead
            eyebrow="How it works"
            lines={['Four steps to', <em>play.</em>]}
            intro="From purchase to court time, the inaugural shared-play membership is straightforward."
          />
          <Steps items={STEPS} />
        </div>
      </section>

      {/* Visual interlude */}
      <Figure
        src="/assets/images/courts-hall.png"
        alt="View of tournament-grade pickleball courts at The Pavilion Club"
        caption="Tournament-grade cushioning, glare-free LED lighting and spectator viewing across all three courts."
      />

      {/* B · Pavilion Studio */}
      <section id="studio" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHead
              eyebrow="B · Pavilion Studio"
              lines={['A space designed', <>to <em>move</em> you.</>]}
            />
            <p className="site-lede mt-6" data-fade>
              Pavilion Studio is our dedicated movement and wellness space in Mogappair East, Chennai.
            </p>
          </div>
          <div>
            <p className="text-[1.125rem] leading-relaxed text-[var(--muted)]" data-fade>
              Whether you are looking to build strength, improve flexibility, find your rhythm or introduce your children
              to movement, our studio brings together four core disciplines: activities designed to help you build a
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
        lede="Join online in seconds with instant member pass activation, or enquire at the front desk."
        image="/assets/images/elevation-dusk-angle.jpg"
      >
        <GoldButton href="#join">Join online — ₹2,360 / mo</GoldButton>
        <ArrowLink href={CLUB.phoneHref}>Or call {CLUB.phoneDisplay}</ArrowLink>
      </PageCta>
    </SitePage>
  );
}
