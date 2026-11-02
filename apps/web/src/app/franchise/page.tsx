import type { Metadata } from 'next';

import type { EnquiryField } from '@/components/public/site/EnquiryForm';
import {
  ArrowLink,
  EnquirySection,
  Figure,
  GoldButton,
  PageHero,
  Rows,
  SectionHead,
  SitePage,
  Ticker,
} from '@/components/public/site/SitePage';

export const metadata: Metadata = {
  title: 'Franchise & Expansion Opportunities',
  description:
    'Bring The Pavilion Club to your city. Property owners, developers, investors and operating partners can register interest in franchise and expansion opportunities.',
};

const CONCEPT = [
  { name: 'Pavilion Courts', text: 'Pickleball courts, memberships, coaching and tournaments.', image: '/assets/images/courts-side.jpg' },
  { name: 'Pavilion Studio', text: 'Yoga, dance, fitness and gymnastics, subject to the confirmed programme.', image: '/assets/images/wellness-b.jpg' },
  { name: 'Pavilion Hall', text: 'Tournaments, birthday parties, events and exhibitions.', image: '/assets/images/stair-brass.jpg' },
  { name: 'Board Games Lounge', text: 'A social gaming space.', image: '/assets/images/pavilion-lounge.jpg' },
  {
    name: 'Café & Kitchen',
    text: 'A food and beverage offering in partnership with Gosip, subject to the agreed operating model.',
    image: '/assets/images/cafe-wide.jpg',
  },
] as const;

const WHO = [
  { title: 'Property owners', text: 'With a suitable commercial or mixed-use space.' },
  { title: 'Developers', text: 'Planning a sports, leisure or lifestyle destination.' },
  { title: 'Investors & operators', text: 'Interested in building and running a club.' },
  { title: 'Business partners', text: 'Potential franchise or business partners with relevant local-market knowledge.' },
] as const;

const FIELDS: readonly EnquiryField[] = [
  { kind: 'text', name: 'name', label: 'Name', required: true, autoComplete: 'name' },
  { kind: 'tel', name: 'phone', label: 'Phone', required: true, autoComplete: 'tel' },
  { kind: 'email', name: 'email', label: 'Email', required: true, autoComplete: 'email', wide: true },
  {
    kind: 'text',
    name: 'location',
    label: 'City and proposed location',
    required: true,
    wide: true,
  },
  {
    kind: 'select',
    name: 'relationship',
    label: 'Relationship to the property',
    required: true,
    options: ['Owner', 'Developer', 'Tenant', 'Investor', 'Operator', 'Other'],
  },
  {
    kind: 'select',
    name: 'status',
    label: 'Property status',
    options: ['Existing premises', 'Under construction', 'Planned'],
  },
  {
    kind: 'textarea',
    name: 'property',
    label: 'Property area and details',
    placeholder: 'Approximate area, frontage, access, ceiling height, parking.',
  },
  {
    kind: 'select',
    name: 'partnership',
    label: 'Preferred partnership',
    options: ['Franchise', 'Property partnership', 'Operating partnership', 'Exploring options'],
  },
  { kind: 'text', name: 'investment', label: 'Investment capability (optional)' },
  {
    kind: 'textarea',
    name: 'notes',
    label: 'Additional information',
    placeholder: 'Describe the space, your timeline and your proposal.',
  },
];

export default function FranchisePage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Franchise & Expansion"
        lines={['Bring the', 'Pavilion Club', <><em>to</em> your city.</>]}
        compact
        tag="Let's explore the opportunity"
        lede="Build a destination where sport, fitness, food and community come together."
        image="/assets/images/elevation-day-wide.jpg"
        side="Sport · fitness · food · community"
      >
        <GoldButton href="#enquire">Explore a franchise</GoldButton>
        <ArrowLink href="#concept">The concept</ArrowLink>
      </PageHero>

      <Ticker items={['Pavilion Courts', 'Pavilion Studio', 'Pavilion Hall', 'Board Games Lounge', 'Café & kitchen', 'Your city']} />

      <section className="site-section site-light site-lines">
        <div className="site-wrap grid items-center gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-24">
          <div>
            <p className="site-eyebrow" data-fade>
              The opportunity
            </p>
            <p className="site-manifesto mt-8" data-words>
              The Pavilion Club is developing a scalable sports and lifestyle club concept that brings pickleball, studio
              activities, social spaces and event experiences together <em>under</em> one roof. If you see an opportunity
              to bring it to your city, we would like to hear from you.
            </p>
          </div>
          <Figure
            src="/assets/images/entrance-aerial.jpg"
            alt="The club entrance from above at night, brass doors lit"
            caption="The entrance, Mogappair East"
            fig="Fig. 01"
            cursor="The club"
          />
        </div>
      </section>

      <section id="concept" className="site-section site-deep site-lines scroll-mt-16">
        <div className="site-wrap">
          <SectionHead
            eyebrow="What the concept may include"
            lines={['One roof,', <><em>many</em> reasons.</>]}
            intro="The exact mix of spaces is adapted to the property, the local market, its size and feasibility. Not every location will include every facility."
          />
          <Rows items={CONCEPT} />
        </div>
      </section>

      <section className="site-section site-light site-lines">
        <div className="site-wrap">
          <SectionHead
            eyebrow="Who should enquire"
            lines={['Partners', <><em>we&apos;d</em> like to meet.</>]}
            intro="Tell us about the location and how you would like to work together."
          />
          <ol className="site-who" data-stagger>
            {WHO.map((who, i) => (
              <li key={who.title}>
                <span>0{i + 1}</span>
                <h3>{who.title}</h3>
                <p>{who.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <EnquirySection
        eyebrow="Expression of interest"
        lines={["Let's", <em>talk.</em>]}
        lede="Tell us about the location and how you would like to work together. The team will be in touch to discuss the next steps."
        aside={
          <p className="max-w-md border-l border-gold pl-5 text-[0.85rem] leading-relaxed text-[var(--soft)]">
            This page is an invitation to discuss franchise and expansion opportunities while the formal model is being
            developed. It is not a franchise offer, and all commercial terms remain subject to approval.
          </p>
        }
        subject="Franchise / expansion enquiry"
        fields={FIELDS}
      />
    </SitePage>
  );
}
