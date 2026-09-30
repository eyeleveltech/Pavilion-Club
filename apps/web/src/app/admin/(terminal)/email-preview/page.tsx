import { EmailStudio } from '@/components/admin/EmailStudio';

export const metadata = {
  title: 'Email Studio & Live Editor | The Pavilion Club Admin',
  description: 'Live interactive preview and editor for player match pass and notification emails.',
};

export default function AdminEmailPreviewPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <EmailStudio />
    </div>
  );
}
