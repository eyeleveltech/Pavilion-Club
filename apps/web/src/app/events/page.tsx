import type { Metadata } from 'next';

import type { EnquiryField } from '@/components/public/site/EnquiryForm';
import {
  ArrowLink,
  EnquirySection,
  Figure,
  GoldButton,
  Heading,
  PageHero,
  Rows,
  SectionHead,
  SitePage,
  Steps,
  Ticker,
} from '@/components/public/site/SitePage';
import { whatsappUrl } from '@/lib/club';

export const metadata: Metadata = {
  title: 'Tournaments & Events · Pavilion Hall',
  description:
    'Private pickleball tournaments, corporate team building, birthday parties, clinics and Pavilion Hall events and exhibitions at The Pavilion Club, Mogappair East, Chennai.',
};

const OFFERINGS = [
  {
    name: 'Private Tournaments',
    text: 'Court allocation, match formats, scorekeeping, a host or referee, prizes and food packages.',
    image: '/assets/images/courts-close.jpg',
  },
  {
    name: 'Corporate Team Building',
    text: 'Beginner-friendly games, team challenges and a mini-tournament, with food and drinks if you like.',
    image: '/assets/images/courts-side.jpg',
  },
  {
    name: 'Birthdays & Celebrations',
    text: 'Pickleball games, hosted activities, a reserved gathering area and optional food and decorations.',
    image: '/assets/images/cafe-wide.jpg',
  },
  {
    name: 'Clinics & Social Leagues',
    text: 'Skills clinics, beginner introductions, friendly leagues and special coaching sessions, subject to coach availability.',
    image: '/assets/images/courts-hall.png',
  },
  {
    name: 'Hall Events & Exhibitions',
    text: 'Celebrations, community gatherings, private events and exhibitions in Pavilion Hall.',
    image: '/assets/images/stair-brass.jpg',
  },
].map((item) => ({ ...item, href: '#enquire', cursor: 'Enquire' }));

const PACKAGES = [
  {
    name: 'Court Party',
    includes: 'Court hire for an agreed duration, basic games, a gathering area if available.',
    for: 'Small groups and casual celebrations',
  },
  {
    name: 'Birthday Bash',
    includes: 'Court time, hosted activities, food options via Gosip, optional decorations.',
    for: "Children's or adult birthdays",
  },
  {
    name: 'Corporate Rally',
    includes: 'Court hire, team challenges, coordination, refreshments or catering options.',
    for: 'Corporate teams and offsites',
  },
  {
    name: 'Tournament Experience',
    includes: 'Multi-court allocation, tournament format and schedule, scorekeeping or referee options, prizes and food options.',
    for: 'Communities, companies and organisers',
  },
  {
    name: 'Pavilion Hall Event',
    includes: 'Hall hire, a proposed layout, event-day coordination, optional food arrangements through Gosip.',
    for: 'Exhibitions, private events and gatherings',
  },
] as const;

const STEPS = [
  { title: 'Send your enquiry', text: 'We acknowledge it straight away. An enquiry does not hold a date.' },
  { title: 'We check availability', text: 'Court and venue availability for your preferred and alternate dates.' },
  { title: 'Confirm the scope', text: 'Together we settle duration, attendance, food, staffing and add-ons.' },
  {
    title: 'Receive a quotation',
    text: 'In writing: inclusions, exclusions, GST, payment schedule, cancellation and rescheduling terms, and how long it is valid.',
  },
  {
    title: 'Your event is confirmed',
    text: 'Once you accept in writing and make the required payment. We then reserve the courts and spaces for you.',
  },
] as const;

const FIELDS: readonly EnquiryField[] = [
  { kind: 'text', name: 'name', label: 'Name', required: true, autoComplete: 'name' },
  { kind: 'text', name: 'organisation', label: 'Organisation (if any)', autoComplete: 'organization' },
  { kind: 'email', name: 'email', label: 'Email', required: true, autoComplete: 'email' },
  { kind: 'tel', name: 'phone', label: 'Phone', required: true, autoComplete: 'tel' },
  {
    kind: 'select',
    name: 'type',
    label: 'Event type or package',
    required: true,
    wide: true,
    options: [
      'Private pickleball tournament',
      'Corporate team building',
      'Birthday party or celebration',
      'Academy event, clinic or social league',
      'Pavilion Hall event or exhibition',
      'Not sure yet',
    ],
  },
  { kind: 'date', name: 'date', label: 'Preferred date', required: true },
  { kind: 'date', name: 'alt_date', label: 'Alternate date (if flexible)' },
  { kind: 'time', name: 'start', label: 'Start time' },
  { kind: 'time', name: 'end', label: 'End time' },
  { kind: 'number', name: 'guests', label: 'Estimated attendance', required: true },
  { kind: 'text', name: 'ages', label: 'Age group (where relevant)', placeholder: 'e.g. children 8–10, adults' },
  {
    kind: 'checks',
    name: 'spaces',
    label: 'Spaces and support needed',
    options: ['Courts', 'Pavilion Hall', 'Coaching', 'Tournament support', 'Hosting'],
  },
  {
    kind: 'textarea',
    name: 'food',
    label: 'Food and beverage needs',
    placeholder: 'Catering through Gosip, dietary needs, or none.',
  },
  { kind: 'text', name: 'budget', label: 'Budget range (optional)', wide: true },
  {
    kind: 'textarea',
    name: 'notes',
    label: 'Anything else',
    placeholder: 'Additional requirements or accessibility needs.',
  },
];

export default function EventsPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Tournaments & Events"
        lines={['Make it', <><em>an</em> event.</>]}
        tag="Play, people, great food"
        lede="Host your next celebration, team outing, exhibition or pickleball tournament at The Pavilion Club, with activities, food and event support shaped around you."
        image="/assets/images/elevation-dusk-front.jpg"
        side="Courts · Hall · Café"
      >
        <GoldButton href="#enquire">Plan your event</GoldButton>
        <ArrowLink href="#packages">See packages</ArrowLink>
      </PageHero>

      <Ticker
        items={['Private tournaments', 'Corporate team building', 'Birthday parties', 'Clinics & leagues', 'Pavilion Hall', 'Food by Gosip']}
      />

      <section className="site-section site-deep site-lines">
        <div className="site-wrap">
          <SectionHead
            eyebrow="Five ways to gather"
            lines={['Play, compete,', <em>celebrate.</em>]}
            intro="Courts for the game, Pavilion Hall for the gathering, and Gosip for the food. Every event is put together around your group."
          />
          <Rows items={OFFERINGS} />
        </div>
      </section>

      <section id="packages" className="site-section site-light site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="Packages"
            lines={['Start', <><em>from</em> a package.</>]}
            intro="Each package is a starting point, shaped to your event. Inclusions and prices are confirmed in a written quotation."
          />
          <ol className="site-packages" data-stagger>
            {PACKAGES.map((pkg, i) => (
              <li key={pkg.name}>
                <span className="site-packages__n">0{i + 1}</span>
                <h3 className="site-packages__name">{pkg.name}</h3>
                <p className="site-packages__text">{pkg.includes}</p>
                <p className="site-packages__for">{pkg.for}</p>
              </li>
            ))}
            <li className="site-packages__cta">
              <p>Tell us the occasion. We will shape the day around it.</p>
              <div className="site-actions">
                <GoldButton href="#enquire">Enquire</GoldButton>
                <ArrowLink href={whatsappUrl('Hi Pavilion Club! I would like to plan an event.')}>WhatsApp</ArrowLink>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="site-section site-dark site-lines">
        <div className="site-wrap grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
          <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-end gap-4 sm:gap-6">
            <Figure src="/assets/images/stair-brass.jpg" alt="The brass staircase up to Pavilion Hall" ratio="3 / 4" cursor="Hall" />
            <Figure
              src="/assets/images/cafe-wide.jpg"
              alt="The Gosip café: tables and banquettes under pendant lights"
              ratio="4 / 5"
              position="40% 50%"
              cursor="Gosip"
              className="mb-[18%]"
            />
          </div>
          <div>
            <p className="site-eyebrow" data-fade>
              Pavilion Hall
            </p>
            <Heading lines={['A room', <><em>for</em> the occasion.</>]} className="mt-7" />
            <p className="site-lede mt-8 max-w-xl" data-fade>
              Pavilion Hall hosts tournaments, birthday parties, events and exhibitions. Capacity, layout and
              availability are confirmed by the club for each event.
            </p>
            <div className="mt-12 border-t border-[var(--rule)] pt-8" data-fade>
              <h3 className="site-h3">Food by Gosip</h3>
              <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-[var(--soft)]">
                Gosip is the café and kitchen partner at The Pavilion Club. Food, beverages and catering for your event
                can be arranged through Gosip. Menus and packages are confirmed with your quotation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section site-light site-lines">
        <div className="site-wrap grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <p className="site-eyebrow" data-fade>
              How it works
            </p>
            <Heading lines={['From enquiry', <><em>to</em> event.</>]} className="mt-7" />
            <p className="site-note mt-8" data-fade>
              Nothing is reserved until your quotation is accepted and the required payment is made.
            </p>
          </div>
          <Steps items={STEPS} />
        </div>
      </section>

      <EnquirySection
        eyebrow="Plan your event"
        lines={['Tell us', <><em>the</em> plan.</>]}
        lede="Share what you have in mind. We will check availability and come back with a proposal."
        subject="Event enquiry"
        fields={FIELDS}
      />
    </SitePage>
  );
}
