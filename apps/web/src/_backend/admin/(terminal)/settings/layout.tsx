import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createDb, validateSession } from '@pavilion/db';
import { SettingsNav } from '@/components/admin/settings/SettingsNav';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('pavilion_session')?.value;

  if (token) {
    const db = createDb();
    const validated = await validateSession(db, token);
    if (validated && validated.user.role === 'desk') {
      redirect('/admin/denied');
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          Venue Administration & Settings
        </h1>
        <p className="text-xs text-ink-soft mt-0.5">
          Courts, operating hours, pricing rules, staff accounts, and partner integrations
        </p>
      </div>

      <SettingsNav />

      <div>{children}</div>
    </div>
  );
}
