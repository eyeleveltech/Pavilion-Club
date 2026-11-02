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
  Rows,
  SectionHead,
  SitePage,
  Ticker,
  type FaqItem,
} from '@/components/public/site/SitePage';
import { whatsappUrl } from '@/lib/club';

export const metadata: Metadata = {
  title: 'Pickleball Academy · Coaching',
  description:
    'Learn. Play. Improve. Pickleball coaching and development at The Pavilion Club, Mogappair East, Chennai. Enquire about coaching programmes.',
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
    label: 'Experience level',
    required: true,
    options: ['New to pickleball', 'Played a few times', 'Play regularly', 'Competitive player'],
  },
  {
    kind: 'select',
    name: 'timing',
    label: 'Preferred timing',
    options: ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Flexible'],
  },
  {
    kind: 'text',
    name: 'programme',
    label: 'Programme of interest',
    placeholder: 'Not sure yet? Tell us what you would like to work on.',
  },
];

const COURTS = [
  { label: 'Surface', text: "Tournament-grade acrylic on the club's three courts, laid to regulation lines." },
  { label: 'Light', text: 'LED lighting under the pergola roof, shielded to keep glare off the ball.' },
  { label: 'Desk', text: 'A staffed front desk from 6:00 AM every day.' },
] as const;

// What each programme will publish here once it is confirmed.
const TO_COME = [
  { name: 'Batch timings', text: 'Days and times for each programme.' },
  { name: 'Session & group', text: 'How long each session runs and how many players share a coach.' },
  { name: 'Fees & start dates', text: 'What each programme costs and when the next batch begins.' },
  { name: 'Coaches', text: 'Coach profiles and credentials, introduced as they are confirmed.' },
] as const;

const FAQS: readonly FaqItem[] = [
  {
    q: 'How do I choose a programme?',
    a: 'Send an enquiry with your experience level and the times that suit you. The team will suggest the programme that fits.',
  },
  {
    q: 'Is coaching included in the Pavilion Courts membership?',
    a: 'No. The shared-play membership does not include coaching or Academy programmes; they are enrolled separately.',
  },
  {
    q: 'Where can I see batch timings and fees?',
    a: 'They will be published on this page once confirmed. Until then, enquire and we will share the options available.',
  },
];

export default function AcademyPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Pickleball Academy"
        lines={['Learn. Play.', <em>Improve.</em>]}
        tag="Coaching at the club"
        lede="Pickleball coaching and development at The Pavilion Club, for players new to the game and those building their skills."
        image="/assets/images/courts-close.jpg"
        side="Three courts · one roof"
      >
        <GoldButton href="#enquire">Enquire about coaching</GoldButton>
        <ArrowLink href="#programmes">View programmes</ArrowLink>
      </PageHero>

      <Ticker items={['Learn', 'Play', 'Improve', 'Pickleball Academy', 'New players', 'Building skills', 'The Pavilion Club']} />

      <section className="site-section site-light site-lines">
        <div className="site-wrap grid items-center gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-24">
          <Figure
            src="/assets/images/courts-hall.png"
            alt="A net and court lines on one of the three courts"
            position="20% 82%"
            caption="Court 2, under the pergola roof"
            fig="Fig. 01"
            cursor="Academy"
          />
          <div>
            <p className="site-eyebrow" data-fade>
              Who it is for
            </p>
            <p className="site-manifesto mt-8" data-words>
              Whether you are new to the game or looking to build your skills, the Academy is your next step{' '}
              <em>on</em> court. Tell us where you are with your game and when you can play, and we will point you to
              the programme that fits.
            </p>
            <div className="mt-14">
              <Facts items={COURTS} />
            </div>
          </div>
        </div>
      </section>

      <section id="programmes" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="Programmes"
            lines={['Being', <em>finalised.</em>]}
            intro="Each programme is published here as soon as it is confirmed. The age groups and levels it serves will be listed with it. Enquire now and we will share what is available."
          />
          <Rows items={TO_COME} />
          <div className="site-actions mt-14" data-fade>
            <GoldButton href="#enquire">Enquire about coaching</GoldButton>
            <ArrowLink href={whatsappUrl('Hi Pavilion Club! I would like to know about the Pickleball Academy.')}>
              Ask us on WhatsApp
            </ArrowLink>
          </div>
        </div>
      </section>

      <EnquirySection
        eyebrow="Enquire"
        lines={['Enquire about', <em>coaching.</em>]}
        lede="A few details are enough. The team will come back to you with the programme options that suit you."
        aside={<FaqList items={FAQS} />}
        subject="Pickleball Academy enquiry"
        fields={FIELDS}
      />
    </SitePage>
  );
}
