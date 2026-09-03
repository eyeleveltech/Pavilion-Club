import { createDb, getBlackoutsList, getBookableCourts } from '@pavilion/db';
import { BlackoutsSettingsView } from '@/components/admin/settings/BlackoutsSettingsView';

export const dynamic = 'force-dynamic';

export default async function BlackoutsSettingsPage() {
  const db = createDb();
  const [blackouts, courts] = await Promise.all([
    getBlackoutsList(db),
    getBookableCourts(db),
  ]);

  return (
    <BlackoutsSettingsView
      blackouts={blackouts}
      courts={courts.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
