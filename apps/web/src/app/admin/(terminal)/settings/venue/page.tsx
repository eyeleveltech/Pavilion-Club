import { createDb, getVenueGeneralSettings } from '@pavilion/db';
import { VenueSettingsView } from '@/components/admin/settings/VenueSettingsView';

export const dynamic = 'force-dynamic';

export default async function VenueSettingsPage() {
  const db = createDb();
  const venue = await getVenueGeneralSettings(db);
  return <VenueSettingsView venue={venue} />;
}
