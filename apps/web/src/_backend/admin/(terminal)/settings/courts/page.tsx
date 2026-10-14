import { createDb, getCourtsSettings } from '@pavilion/db';
import { CourtsSettingsView } from '@/components/admin/settings/CourtsSettingsView';

export const dynamic = 'force-dynamic';

export default async function CourtsSettingsPage() {
  const db = createDb();
  const courts = await getCourtsSettings(db);
  return <CourtsSettingsView initialCourts={courts} />;
}
