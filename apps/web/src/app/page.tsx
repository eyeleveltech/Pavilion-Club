import type { Metadata } from 'next';
import { EditorialLandingView } from '@/components/public/editorial/EditorialLandingView';

export const metadata: Metadata = {
  title: 'The Pavilion Club — Pickleball, Studio & Events · Mogappair East, Chennai',
  description:
    'Your everyday getaway in Mogappair East, Chennai: three tournament-grade pickleball courts, Pavilion Studio, the Pickleball Academy, and Pavilion Hall for tournaments and celebrations.',
  openGraph: {
    title: 'The Pavilion Club · Your Everyday Getaway, Mogappair East, Chennai',
    description:
      'Your everyday getaway in Mogappair East, Chennai: three tournament-grade pickleball courts, Pavilion Studio, the Pickleball Academy, and Pavilion Hall for tournaments and celebrations.',
    images: [{ url: '/assets/images/courts-hall.png', width: 1200, height: 630 }],
  },
};

export default function PublicLandingPage() {
  return <EditorialLandingView />;
}
