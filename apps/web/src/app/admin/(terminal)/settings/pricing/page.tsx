import { createDb, getActivePriceRules, getBookableCourts } from '@pavilion/db';
import { minutesToLabel } from '@pavilion/core';
import { PricingSettingsView, type PriceRuleItem } from '@/components/admin/settings/PricingSettingsView';

export const dynamic = 'force-dynamic';

export default async function PricingSettingsPage() {
  const db = createDb();
  const [rules, courts] = await Promise.all([
    getActivePriceRules(db),
    getBookableCourts(db),
  ]);

  const formattedRules: PriceRuleItem[] = rules.map((r) => {
    const fromMin = r.fromMinutes ?? 0;
    const toMin = r.toMinutes ?? 1440;
    return {
      id: r.id,
      name: r.name,
      courtId: r.courtId,
      courtName: courts.find((c) => c.id === r.courtId)?.name || 'All Courts',
      weekdays: r.weekdays,
      fromMinutes: fromMin,
      toMinutes: toMin,
      fromLabel: r.fromMinutes !== null ? minutesToLabel(r.fromMinutes) : '00:00',
      toLabel: r.toMinutes !== null ? minutesToLabel(r.toMinutes) : '24:00',
      priority: r.priority,
      pricePaise: r.pricePaise,
      priceRupees: r.pricePaise / 100,
      isActive: r.isActive,
    };
  });

  return (
    <PricingSettingsView
      rules={formattedRules}
      courts={courts.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
