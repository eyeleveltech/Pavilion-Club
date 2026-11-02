import type { Metadata } from 'next';

import { PageHero, PolicyBody, SitePage, type Clause } from '@/components/public/site/SitePage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of service, court use, footwear, payment and conduct for The Pavilion Club, Mogappair East, Chennai.',
};

const CLAUSES: readonly Clause[] = [
  {
    id: 'court-licence',
    n: '01',
    title: 'Court licence and use',
    body: (
      <p>
        Booking a slot at The Pavilion Club grants a temporary, revocable licence to use the designated pickleball court
        for the reserved time window. Players must wear non-marking court shoes. Barefoot play, running shoes and
        black-soled footwear are not permitted, to protect the court surface.
      </p>
    ),
  },
  {
    id: 'payment',
    n: '02',
    title: 'Payment and arrival',
    body: (
      <p>
        For bookings made in &apos;Pay at venue&apos; mode, full payment by cash, UPI or card must be made at the front
        desk before you go on court. Please arrive at least 10 minutes before your booking.
      </p>
    ),
  },
  {
    id: 'conduct',
    n: '03',
    title: 'Conduct and safety',
    body: (
      <p>
        Players are responsible for their own fitness and safety. The Pavilion Club accepts no liability for personal
        injury or lost belongings, except where the law requires otherwise. Abusive behaviour, foul language or
        deliberate damage to nets and equipment may result in removal from the club and suspension of access. See the{' '}
        <a href="/rules/">court rules</a>.
      </p>
    ),
  },
  {
    id: 'other-policies',
    n: '04',
    title: 'Memberships, events and other policies',
    body: (
      <p>
        Memberships are governed by the <a href="/membership/#terms">membership terms</a>; events by their written
        quotation; cancellations and refunds by the <a href="/cancellation/">cancellation &amp; refund policy</a>; and
        personal data by the <a href="/privacy/">privacy notice</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <SitePage>
      <PageHero eyebrow="Policies" lines={['Terms', <><em>of</em> service.</>]} lede="Last updated October 2026" />
      <PolicyBody clauses={CLAUSES} />
    </SitePage>
  );
}
