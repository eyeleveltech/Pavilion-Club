import type { Metadata } from 'next';

import {
  ArrowLink,
  Facts,
  Figure,
  GoldButton,
  PageCta,
  PageHero,
  Rows,
  SectionHead,
  SitePage,
  Stats,
  Ticker,
} from '@/components/public/site/SitePage';
import { CLUB } from '@/lib/club';

export const metadata: Metadata = {
  title: 'About The Pavilion Club',
  description:
    'A premium club for sport, fitness, food and celebrations in Mogappair East, Chennai: three tournament-grade pickleball courts, Pavilion Studio, Pavilion Hall, a Board Games Lounge and Gosip.',
};

const FACTS = [
  { label: 'Surface', text: 'Tournament-grade acrylic, laid to regulation lines.' },
  { label: 'Light', text: 'LED lighting under the pergola roof, shielded to keep glare off the ball.' },
  { label: 'Desk', text: 'Staffed from first serve to last rally, every day from 6:00 AM.' },
] as const;

const STATS = [
  { n: 3, label: 'Courts, laid to tournament spec' },
  { n: 5, label: 'Spaces under one roof' },
  { n: 17, unit: 'hrs', label: 'Open every weekday, six to eleven' },
  { n: 18, unit: 'hrs', label: 'Open at weekends, six to midnight' },
] as const;

const SPACES = [
  {
    name: 'Pavilion Courts',
    text: 'Three pickleball courts for shared play, coaching and court bookings.',
    href: '/membership/#courts',
    image: '/assets/images/courts-side.jpg',
  },
  {
    name: 'Pavilion Studio',
    text: 'Yoga, dance, fitness and gymnastics, with programmes coming soon.',
    href: '/membership/#studio',
    image: '/assets/images/wellness-b.jpg',
  },
  {
    name: 'Pavilion Hall',
    text: 'Tournaments, birthday parties, events and exhibitions.',
    href: '/events/',
    image: '/assets/images/stair-brass.jpg',
  },
  {
    name: 'Board Games Lounge',
    text: 'A relaxed space for board games and time with friends.',
    href: '/#spaces',
    image: '/assets/images/pavilion-lounge.jpg',
  },
  {
    name: 'Gosip',
    text: 'Our café and kitchen partner, for food and drinks.',
    href: '/#cafe',
    image: '/assets/images/cafe-wide.jpg',
  },
] as const;

const MORE = [
  { name: 'Court rules', text: 'House rules and a simple guide to the game.', href: '/rules/', cursor: 'Read' },
  { name: 'FAQs', text: 'Memberships, the Studio, the Academy and events.', href: '/faq/', cursor: 'Read' },
  { name: 'Find us', text: 'Velammal School Road, Mogappair East, Chennai.', href: '/contact/', cursor: 'Visit' },
] as const;

export default function AboutPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="About the club"
        lines={['Play. Move.', <em>Connect.</em>]}
        tag="Your everyday getaway"
        lede="A premium club for sport, fitness, food, celebrations and a great time, in Mogappair East, Chennai."
        image="/assets/images/pavilion-lounge.jpg"
        side="Open daily from 06:00 AM"
      >
        <GoldButton href="/membership/">Explore memberships</GoldButton>
        <ArrowLink href="/contact/">Visit the club</ArrowLink>
      </PageHero>

      <Ticker
        items={['Pavilion Courts', 'Pavilion Studio', 'Pickleball Academy', 'Pavilion Hall', 'Board Games Lounge', 'Gosip café', 'Mogappair East, Chennai']}
      />

      <section className="site-section site-light site-lines">
        <div className="site-wrap grid items-center gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-24">
          <Figure
            src="/assets/images/mural-close.jpg"
            alt="The line-drawn player on the lounge wall"
            position="88% 30%"
            ratio="3 / 4"
            caption="The mural, Pavilion lounge"
            fig="Fig. 01"
            cursor="The mural"
          />
          <div>
            <p className="site-eyebrow" data-fade>
              A club, not a corridor of courts
            </p>
            <p className="site-manifesto mt-8" data-words>
              Three tournament-grade pickleball courts sit at the heart of the club, and everything around them is done{' '}
              <em>properly</em>: a studio to move in, a hall to celebrate in, a lounge to unwind in and a kitchen
              partner for after the game.
            </p>
            <div className="mt-14">
              <Facts items={FACTS} />
            </div>
          </div>
        </div>
      </section>

      <section className="site-section site-cream">
        <div className="site-wrap">
          <Stats items={STATS} />
        </div>
      </section>

      <section className="site-section site-deep site-lines">
        <div className="site-wrap">
          <SectionHead
            eyebrow="Our spaces"
            lines={['One address,', <><em>five</em> spaces.</>]}
            intro="Somewhere to play, move, celebrate, unwind and eat, all under one roof."
          />
          <Rows items={SPACES} />
        </div>
      </section>

      <section className="site-section site-light site-lines">
        <div className="site-wrap">
          <SectionHead eyebrow="Before you visit" lines={['Good', <><em>to</em> know.</>]} />
          <Rows items={MORE} />
        </div>
      </section>

      <PageCta
        lines={['Your court.', <><em>your</em> hour.</>]}
        lede="Three courts, open from six every morning. Book your hour and play tonight."
        image="/assets/images/elevation-dusk-angle.jpg"
      >
        <GoldButton href="https://turftown.in">Book Now</GoldButton>
        <ArrowLink href={CLUB.phoneHref}>Or call {CLUB.phoneDisplay}</ArrowLink>
      </PageCta>
    </SitePage>
  );
}
