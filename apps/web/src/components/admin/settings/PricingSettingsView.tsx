'use client';

import { useState } from 'react';
import { Tag, CheckCircle2, Clock, Calculator } from 'lucide-react';

export interface PriceRuleItem {
  id: string;
  name: string;
  courtId: string | null;
  courtName: string;
  weekdays: number[] | null;
  fromMinutes: number;
  toMinutes: number;
  fromLabel: string;
  toLabel: string;
  priority: number;
  pricePaise: number;
  priceRupees: number;
  isActive: boolean;
}

interface PricingSettingsViewProps {
  rules: PriceRuleItem[];
  courts: { id: string; name: string }[];
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PricingSettingsView({ rules, courts }: PricingSettingsViewProps) {
  // Interactive Live Price Tester state
  const [testWeekday, setTestWeekday] = useState(1); // Monday
  const [testHour, setTestHour] = useState('18:00');

  const [h, m] = testHour.split(':').map(Number);
  const testMinutes = (h ?? 0) * 60 + (m ?? 0);

  // Resolved test price
  const matchingRule = rules.find((r) => {
    if (r.weekdays && !r.weekdays.includes(testWeekday)) return false;
    return testMinutes >= r.fromMinutes && testMinutes < r.toMinutes;
  });
  const resolvedPrice = matchingRule ? matchingRule.priceRupees : 800;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-navy">Price Rules & Resolution</h2>
        <p className="text-xs text-ink-soft mt-0.5">
          Server-resolved price rules automatically applied during walk-in desk booking and online checkout
        </p>
      </div>

      {/* Live Price Resolver Test Tool */}
      <div className="p-5 rounded-lg bg-surface border border-navy/30 ring-1 ring-navy/10 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-gold" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
            Live Price Resolver Test
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-ink-soft mb-1">Weekday</label>
            <select
              value={testWeekday}
              onChange={(e) => setTestWeekday(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink"
            >
              {WEEKDAY_NAMES.map((w, idx) => (
                <option key={w} value={idx}>
                  {w} ({idx === 0 || idx === 6 ? 'Weekend' : 'Weekday'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Time of Day</label>
            <input
              type="time"
              value={testHour}
              onChange={(e) => setTestHour(e.target.value)}
              className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink font-mono"
            />
          </div>

          <div className="p-2.5 rounded bg-surface-2 flex items-center justify-between">
            <span className="font-semibold text-ink-soft">Resolved Rate:</span>
            <span className="text-xl font-bold text-navy font-mono">
              ₹{resolvedPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="border border-border rounded-lg bg-surface shadow-xs overflow-hidden divide-y divide-border">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-navy text-sm">{rule.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy/10 text-navy uppercase">
                  {rule.courtName}
                </span>
                <span className="text-ok font-semibold text-[10px]">Active</span>
              </div>
              <p className="text-ink-soft flex items-center gap-2">
                <span>Days: {rule.weekdays ? rule.weekdays.map((d) => WEEKDAY_NAMES[d]).join(', ') : 'All Days'}</span>
                <span>·</span>
                <span>Time: {rule.fromLabel} – {rule.toLabel}</span>
              </p>
            </div>

            <div className="text-right">
              <div className="text-base font-bold text-navy tabular-nums font-mono">
                ₹{rule.priceRupees.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-ink-faint">Priority {rule.priority}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
