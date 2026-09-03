import { createDb, getPartnersSettings } from '@pavilion/db';
import { PartnersSettingsView } from '@/components/admin/settings/PartnersSettingsView';

export const dynamic = 'force-dynamic';

export default async function PartnersSettingsPage() {
  const db = createDb();
  const partners = await getPartnersSettings(db);

  return (
    <PartnersSettingsView
      partners={partners.map((p) => ({
        ...p,
        apiKeys: p.apiKeys.map((k) => ({
          ...k,
          lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
          revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
        })),
      }))}
    />
  );
}
