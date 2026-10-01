import type { Metadata } from 'next';
import { EditorialLandingView } from '@/components/public/editorial/EditorialLandingView';

export const metadata: Metadata = {
  title: 'The Pavilion Club — Pickleball, Anna Nagar West, Chennai',
  description:
    'Three tournament-grade pickleball courts under one pergola roof, lit until midnight. Book by the hour, pay online, walk in and play.',
  openGraph: {
    title: 'The Pavilion Club — Pickleball, Anna Nagar West, Chennai',
    description:
      'Three tournament-grade pickleball courts under one pergola roof, lit until midnight. Book by the hour, pay online, walk in and play.',
    images: [{ url: '/assets/images/courts-hall.png', width: 1200, height: 630 }],
  },
};

export const dynamic = 'force-dynamic';

export default function PublicLandingPage() {
  return <EditorialLandingView />;
}
