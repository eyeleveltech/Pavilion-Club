import type { Metadata } from 'next';

import { PageHero, PolicyBody, SitePage, type Clause } from '@/components/public/site/SitePage';
import { CLUB } from '@/lib/club';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How The Pavilion Club, Mogappair East, Chennai collects and uses personal data for bookings, memberships, payments, enquiries and communications, under the DPDP Act 2023.',
};

const CLAUSES: readonly Clause[] = [
  {
    id: 'who-we-are',
    n: '01',
    title: 'Who we are',
    body: (
      <p>
        The Pavilion Club (&quot;we&quot;, &quot;our&quot; or &quot;us&quot;) operates the club at Velammal School Road,
        JJ Nagar, Mogappair East, Chennai 600037, India.
      </p>
    ),
  },
  {
    id: 'what-we-collect',
    n: '02',
    title: 'What we collect and where from',
    body: (
      <>
        <p>
          Your name, phone number and email address; the dates and times of your bookings and membership sessions;
          payment records; and the details you give us in an enquiry.
        </p>
        <p>
          We collect it when you book on this website, sign in to My bookings, join a membership, pay at the front desk,
          send us an enquiry, or book through a partner platform such as Turf Town, which shares your booking with us.
        </p>
        <p>
          <strong className="font-semibold">We never see or store card numbers or bank credentials.</strong> Online
          payments are processed by an RBI-licensed payment aggregator (Razorpay).
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    n: '03',
    title: 'How we use it',
    body: (
      <>
        <ul className="site-ticks">
          <li>Bookings: to hold and confirm your court time and show your bookings in My bookings.</li>
          <li>Memberships: to activate your membership, reserve your sessions and keep your session balance.</li>
          <li>Payments: to take payment, issue receipts and meet tax and audit requirements.</li>
          <li>
            Enquiries: event, Academy, franchise and general enquiries reach our front desk by WhatsApp or email, and we
            use them only to reply and to prepare a quotation. The enquiry forms on this website do not store what you
            type.
          </li>
          <li>
            Communications: booking confirmations and the one-time sign-in codes for My bookings are sent by email. We
            contact you about your enquiry or booking, not for unrelated marketing without your consent.
          </li>
        </ul>
        <p>We never sell, rent or trade your personal data.</p>
      </>
    ),
  },
  {
    id: 'grievance-officer',
    n: '04',
    title: 'Grievance officer',
    body: (
      <>
        <p>For access, correction or deletion requests under the DPDP Act 2023, contact our grievance officer:</p>
        <div className="border-l border-gold pl-5 text-[0.92rem] leading-relaxed">
          <p>
            <strong className="font-semibold">Jayaraman R.</strong>, Managing Director
          </p>
          <p>
            <a href={`mailto:${CLUB.email}`}>{CLUB.email}</a>
          </p>
          <p>The Pavilion Club, Velammal School Road, JJ Nagar, Mogappair East, Chennai 600037</p>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Policies"
        lines={['Privacy', <em>notice.</em>]}
        lede="Digital Personal Data Protection Act, 2023 · Data fiduciary notice · Last updated October 2026"
      />
      <PolicyBody clauses={CLAUSES} />
    </SitePage>
  );
}
