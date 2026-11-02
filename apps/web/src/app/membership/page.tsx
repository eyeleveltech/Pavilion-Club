import type { Metadata } from 'next';
import { MembershipClientView } from '@/components/public/membership/MembershipClientView';

export const metadata: Metadata = {
  title: 'Memberships · Pavilion Courts & Pavilion Studio',
  description:
    'Two ways to join The Pavilion Club in Mogappair East, Chennai: Pavilion Courts shared-play pickleball membership and Pavilion Studio for yoga, dance, fitness and gymnastics.',
};

export default function MembershipPage() {
  return <MembershipClientView />;
}
