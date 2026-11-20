import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';

import { ArrowLink, GoldButton, PageCta, PageHero, SiteLink, SitePage } from '@/components/public/site/SitePage';
import { CLUB, whatsappUrl } from '@/lib/club';

export const metadata: Metadata = {
  title: 'Club Services',
  description:
    'Everything at The Pavilion Club, Mogappair East, Chennai: pickleball court bookings, shared-play membership, the TNPA-affiliated Pickleball Academy, Pavilion Studio classes and floor hire, events, the Gosip café and the Board Games Lounge, with prices and how to book each.',
};

type Service = {
  id: string;
  name: string;
  /** What kind of thing it is, e.g. "Pickleball · pay by the hour". */
  kicker: string;
  text: string;
  image: string;
  /** Focal point; with `zoom`, the point the photo enlarges towards. */
  position?: string;
  zoom?: number;
  facts: readonly { label: string; value: ReactNode }[];
  action: { label: string; href: string };
  more?: { label: string; href: string };
};

type Group = {
  id: string;
  /** The visitor's goal, as on the chooser: "Play pickleball". */
  goal: string;
  title: string;
  line: string;
  services: readonly Service[];
};

const STUDIO_WHATSAPP = (text: string) => whatsappUrl(text, CLUB.studioWhatsappNumber);

const GROUPS: readonly Group[] = [
  {
    id: 'play',
    goal: 'Play pickleball',
    title: 'Play',
    line: 'Book a court for your own game, or join shared play on weekday mornings.',
    services: [
      {
        id: 'court-booking',
        name: 'Court booking',
        kicker: 'Pickleball · pay by the hour',
        text: 'Book one of three tournament-grade courts for your own group. Pick a slot, bring your friends and play.',
        image: '/assets/images/courts-close.jpg',
        facts: [
          { label: 'Courts', value: 'Three, under one pergola roof' },
          { label: 'Open', value: 'Mon – Fri 6 AM – 11 PM · Sat – Sun 6 AM – 12 AM' },
          { label: 'Price', value: 'Shown when you book' },
        ],
        action: { label: 'Book a court', href: CLUB.bookingUrl },
        more: { label: 'Court rules', href: '/rules/' },
      },
      {
        id: 'shared-play',
        name: 'Shared-play membership',
        kicker: 'Pickleball · monthly',
        text: 'Play on weekday mornings without booking a whole court. Check in at the desk and join a shared game.',
        image: '/assets/images/courts-side.jpg',
        facts: [
          { label: 'When', value: 'Mon – Fri, 6 AM – 3 PM' },
          { label: 'Includes', value: 'Up to 20 one-hour sessions a month, one a day' },
          { label: 'Price', value: '₹2,000 a month + 18% GST (₹2,360)' },
        ],
        action: { label: 'Join the membership', href: '/membership/#courts' },
        more: { label: 'Membership terms', href: '/membership/#terms' },
      },
    ],
  },
  {
    id: 'learn',
    goal: 'Learn the game',
    title: 'Learn',
    line: 'Coaching for new players, improvers and competitors.',
    services: [
      {
        id: 'academy',
        name: 'Pickleball Academy',
        kicker: 'Coaching · TNPA-affiliated',
        text: 'Structured coaching clinics, affiliated to the Tamil Nadu Pickleball Association. Tell us how you play and the coach will place you in the right batch.',
        image: '/assets/images/courts-hall.png',
        position: '20% 82%',
        facts: [
          { label: 'Levels', value: 'Beginner · Intermediate · Advanced' },
          { label: 'Batches', value: 'Morning, evening and weekend' },
          { label: 'Equipment', value: 'Demo paddles and balls provided' },
          { label: 'Fees', value: 'Shared when you enquire' },
        ],
        action: { label: 'Enquire about coaching', href: '/academy/#enquire' },
        more: { label: 'See the clinics', href: '/academy/#clinics' },
      },
    ],
  },
  {
    id: 'move',
    goal: 'Join a class',
    title: 'Move',
    line: 'Classes in Pavilion Studio, and the studio floor for private hire.',
    services: [
      {
        id: 'studio-classes',
        name: 'Studio classes',
        kicker: 'Pavilion Studio · monthly packages',
        text: 'Group classes for kids, teens and adults, with weekday and weekend batches.',
        image: '/assets/images/wellness-b.jpg',
        facts: [
          {
            label: 'Classes',
            value: (
              <ul className="svc-prices">
                <li>
                  <span>Dance</span>
                  <b>from ₹2,000</b>
                </li>
                <li>
                  <span>Salsa &amp; partnerwork</span>
                  <b>from ₹3,000</b>
                </li>
                <li>
                  <span>Gymnastics</span>
                  <b>₹4,000</b>
                </li>
                <li>
                  <span>Boxing &amp; heavy bag</span>
                  <b>₹2,750</b>
                </li>
                <li>
                  <span>Yoga &amp; mobility</span>
                  <b>₹2,500</b>
                </li>
              </ul>
            ),
          },
          { label: 'Prices', value: 'A month or a package of classes, + GST' },
        ],
        action: { label: 'Timetable & prices', href: '/membership/#studio' },
        more: { label: `Studio desk ${CLUB.studioPhoneDisplay}`, href: CLUB.studioPhoneHref },
      },
      {
        id: 'studio-hire',
        name: 'Studio floor hire',
        kicker: 'Pavilion Studio · private hire',
        text: 'Hire the studio floor for a rehearsal, workshop, audition or video shoot.',
        // Zoomed towards the floor so the render's "Wellness Centre" label is cropped out.
        image: '/assets/images/wellness-a.jpg',
        position: '20% 100%',
        zoom: 1.25,
        facts: [
          { label: 'For', value: 'Dance crews, instructors and creators' },
          { label: 'Price', value: 'On request' },
        ],
        action: {
          label: 'Ask about hire',
          href: STUDIO_WHATSAPP("Hi Pavilion Studio! I'd like to hire the studio floor."),
        },
        more: { label: `Studio desk ${CLUB.studioPhoneDisplay}`, href: CLUB.studioPhoneHref },
      },
    ],
  },
  {
    id: 'celebrate',
    goal: 'Host an event',
    title: 'Celebrate',
    line: 'Tournaments, team days and parties, planned around your group.',
    services: [
      {
        id: 'events',
        name: 'Events & tournaments',
        kicker: 'Courts · Pavilion Hall · catering',
        text: 'Private tournaments, corporate team building, birthday parties, clinics and exhibitions. Tell us the occasion and we will send a proposal.',
        image: '/assets/images/stair-brass.jpg',
        facts: [
          { label: 'Spaces', value: 'The courts and Pavilion Hall' },
          { label: 'Food', value: 'Catering by Gosip' },
          { label: 'Price', value: 'A written quotation for each event' },
        ],
        action: { label: 'Plan an event', href: '/events/#enquire' },
        more: { label: 'See packages', href: '/events/#packages' },
      },
    ],
  },
  {
    id: 'relax',
    goal: 'Eat & unwind',
    title: 'Relax',
    line: 'Somewhere to eat, sit and stay after the game.',
    services: [
      {
        id: 'cafe',
        name: 'Gosip café',
        kicker: 'Food & drinks',
        text: 'Our café and kitchen partner: food and drinks between games, and catering for your event.',
        image: '/assets/images/cafe-wide.jpg',
        facts: [{ label: 'Menu', value: 'Coming soon' }],
        action: { label: 'About Gosip', href: '/#cafe' },
      },
      {
        id: 'lounge',
        name: 'Board Games Lounge',
        kicker: 'Social space',
        text: 'A relaxed room for board games and time with friends, next to the café.',
        image: '/assets/images/pavilion-lounge.jpg',
        facts: [{ label: 'Open', value: 'During club hours' }],
        action: { label: 'Our spaces', href: '/#spaces' },
      },
      {
        id: 'desk',
        name: 'Front desk',
        kicker: 'Help & information',
        text: 'Questions about bookings, memberships or your visit? The desk is staffed from 6 AM every day.',
        image: '/assets/images/reception.jpg',
        facts: [{ label: 'Call', value: CLUB.phoneDisplay }],
        action: { label: 'Call the desk', href: CLUB.phoneHref },
      },
    ],
  },
];

// One line per service: the quickest answer to "how do I book this?".
const HOW_TO_BOOK: readonly { service: string; how: string; link: { label: string; href: string } }[] = [
  { service: 'Court booking', how: 'Book online on TurfTown, or call the front desk.', link: { label: 'Book a court', href: CLUB.bookingUrl } },
  { service: 'Shared-play membership', how: 'Join online on the Memberships page, or at the front desk.', link: { label: 'Memberships', href: '/membership/#courts' } },
  { service: 'Pickleball Academy', how: 'Send an enquiry. The coach confirms your level and batch.', link: { label: 'Enquire', href: '/academy/#enquire' } },
  { service: 'Studio classes', how: 'Call or WhatsApp the studio desk.', link: { label: CLUB.studioPhoneDisplay, href: CLUB.studioPhoneHref } },
  { service: 'Studio floor hire', how: 'Call or WhatsApp the studio desk.', link: { label: CLUB.studioPhoneDisplay, href: CLUB.studioPhoneHref } },
  { service: 'Events & tournaments', how: 'Send an event enquiry and receive a written quotation.', link: { label: 'Plan an event', href: '/events/#enquire' } },
  { service: 'Café & lounge', how: 'Visit during club hours.', link: { label: 'Directions', href: CLUB.mapsUrl } },
];

export default function ServicesPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Club services"
        lines={['Club', <em>services.</em>]}
        tag="Courts · coaching · studio · events · café"
        lede="Everything at The Pavilion Club, in one place: what each service is, what it costs and how to book it."
        image="/assets/images/elevation-day-front.jpg"
        side="Open daily from 06:00 AM"
      >
        <GoldButton href="#services">See all services</GoldButton>
        <ArrowLink href="#how-to-book">How to book</ArrowLink>
      </PageHero>

      {/* "I want to…": one tile per visitor goal, jumping to its group */}
      <section id="services" className="svc-chooser scroll-mt-16" aria-labelledby="svc-chooser-title">
        <div className="site-wrap">
          <p id="svc-chooser-title" className="site-eyebrow" data-fade>
            I want to…
          </p>
          <ol className="svc-chooser__list" data-stagger>
            {GROUPS.map((group, i) => (
              <li key={group.id}>
                <a href={`#${group.id}`} className="svc-chooser__tile">
                  <span className="svc-chooser__n">0{i + 1}</span>
                  <span className="svc-chooser__goal">{group.goal}</span>
                  <span className="svc-chooser__count">
                    {group.services.length === 1 ? '1 service' : `${group.services.length} services`}
                  </span>
                  <span className="svc-chooser__arrow" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {GROUPS.map((group, i) => (
        <section
          key={group.id}
          id={group.id}
          className={`site-section svc-group scroll-mt-16 ${i % 2 ? 'site-cream' : 'site-light'}`}
          aria-labelledby={`${group.id}-title`}
        >
          <div className="site-wrap svc-group__grid">
            <header className="svc-group__head" data-fade>
              <span className="svc-group__n">0{i + 1}</span>
              <h2 id={`${group.id}-title`} className="svc-group__title">
                {group.title}
              </h2>
              <p className="svc-group__line">{group.line}</p>
            </header>
            <div className={`svc-list svc-list--${Math.min(group.services.length, 3)}`} data-stagger>
              {group.services.map((service) => (
                <ServiceCard key={service.id} service={service} wide={group.services.length === 1} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <section id="how-to-book" className="site-section site-deep site-lines scroll-mt-16" aria-labelledby="how-to-book-title">
        <div className="site-wrap svc-group__grid">
          <header className="svc-group__head" data-fade>
            <span className="svc-group__n">06</span>
            <h2 id="how-to-book-title" className="svc-group__title">
              How to book
            </h2>
            <p className="svc-group__line">The quickest way to book each service.</p>
          </header>
          <div>
            <dl className="svc-book" data-stagger>
              {HOW_TO_BOOK.map((row) => (
                <div key={row.service} className="svc-book__row">
                  <dt>{row.service}</dt>
                  <dd>{row.how}</dd>
                  <dd className="svc-book__link">
                    <ArrowLink href={row.link.href}>{row.link.label}</ArrowLink>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="svc-desks" data-fade>
              <div>
                <span>Front desk</span>
                <a href={CLUB.phoneHref}>{CLUB.phoneDisplay}</a>
              </div>
              <div>
                <span>Studio desk</span>
                <a href={CLUB.studioPhoneHref}>{CLUB.studioPhoneDisplay}</a>
              </div>
              {CLUB.hours.map((row) => (
                <div key={row.days}>
                  <span>{row.days}</span>
                  <b>{row.time}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PageCta
        lines={['Not sure', <><em>where</em> to start?</>]}
        lede="Message the front desk and tell us what you are looking for. We will point you to the right service."
        image="/assets/images/elevation-dusk-angle.jpg"
      >
        <GoldButton href={whatsappUrl('Hi Pavilion Club! Which service would suit me?')}>WhatsApp the desk</GoldButton>
        <ArrowLink href={CLUB.phoneHref}>Or call {CLUB.phoneDisplay}</ArrowLink>
      </PageCta>
    </SitePage>
  );
}

function imageStyle({ position, zoom }: Service): CSSProperties | undefined {
  if (!position && !zoom) return undefined;
  return {
    ...(position ? { objectPosition: position, transformOrigin: position } : {}),
    ...(zoom ? { '--zoom': zoom } : {}),
  } as CSSProperties;
}

function ServiceCard({ service, wide }: { service: Service; wide: boolean }) {
  return (
    <article id={service.id} className={`svc-card scroll-mt-24${wide ? ' svc-card--wide' : ''}`}>
      <div className="svc-card__media">
        <img src={service.image} alt="" loading="lazy" style={imageStyle(service)} />
      </div>
      <div className="svc-card__body">
        <p className="svc-card__kicker">{service.kicker}</p>
        <h3 className="svc-card__name">{service.name}</h3>
        <p className="svc-card__text">{service.text}</p>
        <dl className="svc-card__facts">
          {service.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="svc-card__actions">
          <GoldButton href={service.action.href}>{service.action.label}</GoldButton>
          {service.more ? (
            <SiteLink href={service.more.href} className="site-link">
              {service.more.label} <i aria-hidden="true" />
            </SiteLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
