import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { EmailStudio } from '@/components/admin/EmailStudio';

export const metadata = {
  title: 'Email Studio & Live Editor | The Pavilion Club',
  description: 'Live interactive preview and editor for player match pass and notification emails.',
};

export default function StandaloneEmailPreviewPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <EmailStudio />
      </main>
      <PublicFooter />
    </div>
  );
}
