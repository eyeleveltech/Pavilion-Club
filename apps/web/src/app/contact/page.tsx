import type { Metadata } from 'next';

import type { EnquiryField } from '@/components/public/site/EnquiryForm';
import {
  ArrowLink,
  EnquirySection,
  GoldButton,
  Heading,
  PageHero,
  SitePage,
} from '@/components/public/site/SitePage';
import { CLUB, whatsappUrl } from '@/lib/club';

export const metadata: Metadata = {
  title: 'Contact & Directions',
  description:
    'Find The Pavilion Club on Velammal School Road, Mogappair East, Chennai. Opening hours, directions, front desk phone, WhatsApp and email.',
};

const FIELDS: readonly EnquiryField[] = [
  { kind: 'text', name: 'name', label: 'Name', required: true, autoComplete: 'name' },
  { kind: 'tel', name: 'phone', label: 'Phone / WhatsApp', required: true, autoComplete: 'tel' },
  { kind: 'email', name: 'email', label: 'Email', autoComplete: 'email' },
  {
    kind: 'select',
    name: 'topic',
    label: 'About',
    required: true,
    options: [
      'Memberships',
      'Pickleball Academy',
      'Tournaments & events',
      'Court booking',
      'Franchise & expansion',
      'Something else',
    ],
  },
  { kind: 'textarea', name: 'message', label: 'Your message', required: true },
];

export default function ContactPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Contact"
        lines={['Contact', <><em>&amp;</em> directions.</>]}
        compact
        tag="Velammal School Road"
        lede="Questions about memberships, the Pickleball Academy, events or a court booking? Reach the front desk directly, or send us an enquiry."
        image="/assets/images/elevation-dusk-angle.jpg"
        side="Mogappair East · Chennai"
      >
        <GoldButton href={CLUB.mapsUrl}>Get directions</GoldButton>
        <ArrowLink href={CLUB.phoneHref}>Call the desk</ArrowLink>
      </PageHero>

      <section className="site-visit">
        <div className="site-visit__media" data-reveal="left" data-cursor="Directions">
          <img src="/assets/images/elevation-day-wide.jpg" alt="The club's street elevation by day, seen through the trees" loading="lazy" />
        </div>
        <div className="site-visit__body">
          <p className="site-eyebrow" data-fade>
            Find us
          </p>
          <Heading lines={['Mogappair', 'East.']} className="mt-7" />
          <address className="site-visit__addr" data-fade>
            <b>{CLUB.name}</b>
            {CLUB.addressLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span className="site-visit__landmark">Landmark: near Velammal School</span>
          </address>
          <dl className="site-visit__hours" data-stagger>
            {CLUB.hours.map((row) => (
              <div key={row.days}>
                <dt>{row.days}</dt>
                <dd>{row.time}</dd>
              </div>
            ))}
            <div>
              <dt>Front desk</dt>
              <dd>
                <a href={CLUB.phoneHref}>{CLUB.phoneDisplay}</a>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${CLUB.email}`}>{CLUB.email}</a>
              </dd>
            </div>
          </dl>
          <div className="site-actions mt-10" data-fade>
            <ArrowLink href={CLUB.mapsUrl}>Open in Google Maps</ArrowLink>
            <ArrowLink href={whatsappUrl('Hi Pavilion Club!')}>WhatsApp us</ArrowLink>
            <ArrowLink href="https://turftown.in">Book Now</ArrowLink>
          </div>
        </div>
      </section>

      <EnquirySection
        eyebrow="Enquire"
        lines={['Send us', <><em>a</em> note.</>]}
        lede="Tell us what you would like to know and the front desk will come back to you."
        aside={
          <ul className="site-ticks max-w-md text-[0.9rem] text-[var(--soft)]">
            <li>Non-marking court shoes are required on court.</li>
            <li>Play needs a confirmed booking or an authorised membership session.</li>
            <li>
              Read the{' '}
              <a className="underline" href="/rules/">
                court rules
              </a>{' '}
              before you play.
            </li>
          </ul>
        }
        subject="General enquiry"
        fields={FIELDS}
      />
    </SitePage>
  );
}
