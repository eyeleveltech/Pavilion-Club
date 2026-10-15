import type { Metadata } from 'next';
import { EditorialLandingClient } from '@/components/public/editorial/EditorialLandingClient';

export const metadata: Metadata = {
  title: 'The Pavilion Club - Pickleball, Anna Nagar West, Chennai',
  description:
    'Three tournament-grade pickleball courts under one pergola roof, lit until midnight. Book by the hour, pay online, walk in and play.',
  openGraph: {
    title: 'The Pavilion Club - Pickleball, Anna Nagar West, Chennai',
    description:
      'Three tournament-grade pickleball courts under one pergola roof, lit until midnight. Book by the hour, pay online, walk in and play.',
    images: [{ url: '/assets/images/courts-hall.png', width: 1200, height: 630 }],
  },
};

export default function PublicLandingPage() {
  return <EditorialLandingClient />;
}
