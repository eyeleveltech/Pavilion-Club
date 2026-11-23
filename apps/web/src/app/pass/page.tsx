import type { Metadata } from 'next';
import { SitePage } from '@/components/public/site/SitePage';
import { PassClientView } from '@/components/public/membership/PassClientView';

export const metadata: Metadata = {
  title: 'Digital Member Pass · The Pavilion Club',
  description: 'View and retrieve your official Pavilion Club digital membership pass and remaining session quota.',
};

export default function MemberPassPage() {
  return (
    <SitePage overlayHeader={false}>
      <PassClientView />
    </SitePage>
  );
}
