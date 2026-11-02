import type { Metadata } from 'next';

import { ArrowLink, Heading, PageHero, Rows, SectionHead, SitePage } from '@/components/public/site/SitePage';
import { CLUB } from '@/lib/club';

export const metadata: Metadata = {
  title: 'Court Rules & Regulations',
  description:
    'House rules, court etiquette and a simple introduction to pickleball rules for members, guests and players at Pavilion Courts, The Pavilion Club.',
};

const ETIQUETTE = [
  'Play only with a confirmed booking or an authorised session. Follow staff instructions and respect booked timings.',
  'Vacate the court promptly at the end of your session.',
  'Wear suitable sportswear and non-marking court shoes. Use appropriate pickleball paddles and balls.',
  'Do not run across adjacent courts or enter another active court without permission.',
  'Treat players, coaches and staff with respect. Abusive language, harassment, unsafe play or deliberate disruption may result in removal from a session.',
  'Keep the playing area clean. Food and glass containers are not permitted on playing surfaces.',
  'Report injuries, damage or unsafe conditions to staff, and stop play if conditions appear unsafe.',
  "Children must comply with the club's supervision and consent requirements.",
] as const;

const GAME = [
  { name: 'The serve', text: 'Serve diagonally into the opposite service court using a legal serve.' },
  {
    name: 'Two bounces',
    text: 'After the serve, the ball must bounce once on each side before either side may volley it.',
  },
  {
    name: 'The kitchen',
    text: 'A volley is a shot hit before the ball bounces. Never volley while standing in the Non-Volley Zone, including touching its line.',
  },
  {
    name: 'The lines',
    text: 'A ball landing on a boundary line is generally in, except that a serve landing on the Non-Volley Zone line is a fault.',
  },
  {
    name: 'Faults',
    text: 'The ball lands out, fails to clear the net, is volleyed from the Non-Volley Zone, or another rule is broken.',
  },
  {
    name: 'Match play',
    text: 'Follow the scoring format, court allocation and match instructions announced by the club or the organiser.',
  },
] as const;

export default function RulesPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Pavilion Courts"
        lines={['Court rules', <><em>&amp;</em> regulations.</>]}
        compact
        tag="House rules"
        lede="These house rules apply to members, guests and every other authorised player. The full version is displayed at the venue."
        image="/assets/images/courts-hall.png"
        imagePosition="50% 70%"
        side="Non-marking shoes only"
      >
        <ArrowLink href="#etiquette">On court</ArrowLink>
        <ArrowLink href="#game">The game</ArrowLink>
      </PageHero>

      <section id="etiquette" className="site-section site-light site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="01 · On court"
            lines={['Access', <><em>&amp;</em> etiquette.</>]}
            intro="Eight house rules that keep every session safe, fair and on time."
          />
          <ol className="site-rules" data-stagger>
            {ETIQUETTE.map((rule, i) => (
              <li key={rule}>
                <span>0{i + 1}</span>
                <p>{rule}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="game" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="02 · The game"
            lines={['Pickleball,', <em>simply.</em>]}
            intro="A simplified introduction, not a complete official rulebook. Tournament play follows the rules and scoring format published for that event."
          />
          <Rows items={GAME} />
        </div>
      </section>

      <section className="site-section site-cream site-lines">
        <div className="site-wrap grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="site-eyebrow" data-fade>
              03 · Conduct
            </p>
            <Heading lines={['Conduct', <><em>&amp;</em> enforcement.</>]} className="mt-7" />
          </div>
          <div className="lg:pt-24">
            <p className="site-lede" data-fade>
              The club may remove a player from a session or suspend access for serious or repeated breaches, subject to
              applicable law and the relevant membership or booking terms.
            </p>
            <p className="site-note mt-8" data-fade>
              To report a complaint or a safety concern, speak to the front desk, call{' '}
              <a className="underline" href={CLUB.phoneHref}>
                {CLUB.phoneDisplay}
              </a>{' '}
              or write to{' '}
              <a className="underline" href={`mailto:${CLUB.email}`}>
                {CLUB.email}
              </a>
              .
            </p>
            <div className="site-actions mt-10" data-fade>
              <ArrowLink href="/membership/#terms">Membership terms</ArrowLink>
              <ArrowLink href="/cancellation/">Cancellation policy</ArrowLink>
            </div>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
