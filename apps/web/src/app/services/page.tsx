import type { Metadata } from 'next';
import Link from 'next/link';

import {
  ArrowLink,
  GoldButton,
  PageCta,
  PageHero,
  Rows,
  SectionHead,
  SitePage,
  Ticker,
  type RowItem,
} from '@/components/public/site/SitePage';
import { CLUB } from '@/lib/club';

export const metadata: Metadata = {
  title: 'Services & Facilities · The Pavilion Club',
  description:
    'Explore the full suite of athletic, movement, coaching and lifestyle services at The Pavilion Club in Mogappair East, Chennai: Pickleball courts, The Studio programmes, coaching academy, private rehearsals, corporate tournaments and wellness cafe.',
};

const SERVICES_ROWS: readonly RowItem[] = [
  {
    name: '01 · Pickleball Court Bookings & Shared-Play',
    text: 'Tournament-grade cushioned indoor and outdoor courts with glare-free LED illumination. Available for hourly casual play, league matches, and 20-session shared-play monthly memberships.',
    href: '/book/',
  },
  {
    name: '02 · The Studio Mogappair (Movement & Dance)',
    text: '5 flagship programmes: Dance (Hip-Hop, Commercial, Bollywood, Contemporary & Kids), Salsa & Latin Social partnerwork, Gymnastics & Acrobatics, Boxing & Heavy Bag conditioning, and Yoga & Mindful Movement.',
    href: '/membership/#studio',
  },
  {
    name: '03 · The Pickleball Coaching Academy',
    text: 'Comprehensive coaching pathways Coached by national certified professionals. Includes Junior Developmental Squads (Ages 4–14), Adult Masterclasses, and 1-on-1 private tactical coaching.',
    href: '/academy/',
  },
  {
    name: '04 · Studio Floor Rental & Production Rehearsals',
    text: 'Exclusive private floor hire for dance crews, performance rehearsals, fitness video shoots, auditions, and weekend guest masterclasses. Features acoustic sound isolation and sprung timber floor.',
    href: '/contact/',
  },
  {
    name: '05 · Corporate Tournaments & Private Club Buyouts',
    text: 'Turnkey corporate sports events, inter-company tournaments, executive team building, and full-venue buyouts with customized refereeing, scoreboards, trophy ceremonies, and curated catering.',
    href: '/events/',
  },
  {
    name: '06 · Clubhouse Lounge & Wellness Cafe',
    text: 'A relaxed social clubhouse serving nutrient-dense cold-pressed juices, protein smoothies, clean salads, and artisan coffee. Includes athlete rest zones, lockers, and private showers.',
    href: '/#cafe',
  },
  {
    name: '07 · Pro Equipment Demo & Pro-Desk',
    text: 'Demo carbon-fiber paddles before you buy. Official tournament balls, grip tape replacements, protective gear, and certified equipment guidance available at the front desk.',
    href: '/contact/',
  },
];

export default function ServicesPage() {
  return (
    <SitePage>
      {/* Hero */}
      <PageHero
        eyebrow="Club Services & Facilities"
        lines={['Precision play.', <em>Unrivalled movement.</em>]}
        tag="Mogappair East, Chennai"
        lede="From tournament-grade pickleball courts and high-energy studio choreography to private floor rentals and corporate tournaments, explore our full spectrum of athletic and wellness services."
        image="/assets/images/courts-side.jpg"
        side="Open Daily from 06:00 AM"
      >
        <GoldButton href="#services-list">Explore Services ⟶</GoldButton>
        <ArrowLink href="/membership/">View Memberships</ArrowLink>
      </PageHero>

      {/* Ticker */}
      <Ticker
        items={[
          'Pickleball Courts',
          'The Studio Mogappair',
          'Dance Classes',
          'Salsa Partnerwork',
          'Gymnastics',
          'Boxing Conditioning',
          'Morning Yoga',
          'Coaching Academy',
          'Studio Floor Rentals',
          'Corporate Buyouts',
          'Wellness Cafe',
        ]}
      />

      {/* Main Services Interactive Rows Section */}
      <section id="services-list" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="Our Services"
            lines={['Everything you need to', <><em>play, move</em> and excel.</>]}
            intro="The Pavilion Club offers a curated environment where elite athletic facilities meet high-end hospitality. Select a service to explore schedules, pricing, and booking options."
          />

          <div className="mt-12">
            <Rows items={SERVICES_ROWS} />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <PageCta
        lines={['Experience', <><em>The Pavilion Club.</em></>]}
        lede="Visit us at Mogappair East, Chennai. Book courts online, explore studio trial classes, or plan your private event."
        image="/assets/images/elevation-dusk-angle.jpg"
      >
        <GoldButton href="/book/">Book Court Online</GoldButton>
        <ArrowLink href={CLUB.phoneHref}>Desk: {CLUB.phoneDisplay}</ArrowLink>
      </PageCta>
    </SitePage>
  );
}
