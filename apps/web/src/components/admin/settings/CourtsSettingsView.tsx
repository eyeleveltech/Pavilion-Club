'use client';

import { useState } from 'react';
import {
  Save,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Check,
} from 'lucide-react';

interface CourtHourItem {
  weekday: number;
  openMinutes: number;
  closeMinutes: number;
  openLabel: string;
  closeLabel: string;
}

interface CourtSettingsItem {
  id: string;
  name: string;
  slotMinutes: number;
  sortOrder: number;
  isBookable: boolean;
  hours: CourtHourItem[];
}

interface CourtsSettingsViewProps {
  initialCourts: CourtSettingsItem[];
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function CourtsSettingsView({ initialCourts }: CourtsSettingsViewProps) {
  const [courts, setCourts] = useState<CourtSettingsItem[]>(initialCourts);
  const [selectedCourtId, setSelectedCourtId] = useState<string>(
    initialCourts[0]?.id || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [safetyWarnings, setSafetyWarnings] = useState<{
    reference: string;
    date: string;
    time: string;
    customerName: string;
  }[] | null>(null);

  const activeCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];

  const handleHourChange = (
    weekday: number,
    field: 'openMinutes' | 'closeMinutes',
    valueStr: string
  ) => {
    if (!activeCourt) return;
    const [h, m] = valueStr.split(':').map(Number);
    const totalMinutes = (h ?? 0) * 60 + (m ?? 0);

    const updatedHours = activeCourt.hours.map((item) => {
      if (item.weekday === weekday) {
        return {
          ...item,
          [field]: totalMinutes,
          openLabel: field === 'openMinutes' ? valueStr : item.openLabel,
          closeLabel: field === 'closeMinutes' ? valueStr : item.closeLabel,
        };
      }
      return item;
    });

    setCourts((prev) =>
      prev.map((c) => (c.id === activeCourt.id ? { ...c, hours: updatedHours } : c))
    );
  };

  // Bulk 1: Copy Monday to all weekdays (Mon-Fri)
  const handleCopyMondayToWeekdays = () => {
    if (!activeCourt) return;
    const monday = activeCourt.hours.find((h) => h.weekday === 1);
    if (!monday) return;

    const updatedHours = activeCourt.hours.map((item) => {
      if (item.weekday >= 1 && item.weekday <= 5) {
        return {
          ...item,
          openMinutes: monday.openMinutes,
          closeMinutes: monday.closeMinutes,
          openLabel: monday.openLabel,
          closeLabel: monday.closeLabel,
        };
      }
      return item;
    });

    setCourts((prev) =>
      prev.map((c) => (c.id === activeCourt.id ? { ...c, hours: updatedHours } : c))
    );
  };

  // Bulk 2: Copy this court to all courts
  const handleCopyCourtToAll = () => {
    if (!activeCourt) return;
    setCourts((prev) =>
      prev.map((c) => ({
        ...c,
        slotMinutes: activeCourt.slotMinutes,
        hours: activeCourt.hours.map((h) => ({ ...h })),
      }))
    );
  };

  const handleSave = async () => {
    if (!activeCourt) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSafetyWarnings(null);

    try {
      const res = await fetch('/api/admin/settings/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: activeCourt.id,
          isBookable: activeCourt.isBookable,
          hours: activeCourt.hours.map((h) => ({
            weekday: h.weekday,
            openMinutes: h.openMinutes,
            closeMinutes: h.closeMinutes,
          })),
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setSaveSuccess(true);
        if (json.affectedBookings?.length > 0) {
          setSafetyWarnings(json.affectedBookings);
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save court hours:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeCourt) return null;

  return (
    <div className="space-y-6">
      {/* Court Selector & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          {courts.map((court) => (
            <button
              key={court.id}
              onClick={() => {
                setSelectedCourtId(court.id);
                setSafetyWarnings(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                court.id === activeCourt.id
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-surface border border-border text-ink hover:bg-surface-2'
              }`}
            >
              {court.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={activeCourt.isBookable}
              onChange={(e) => {
                const updated = courts.map((c) =>
                  c.id === activeCourt.id ? { ...c, isBookable: e.target.checked } : c
                );
                setCourts(updated);
              }}
              className="rounded border-border text-navy focus:ring-navy"
            />
            <span>Active & Bookable</span>
          </label>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="py-2 px-4 rounded bg-navy text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 text-gold" />
            )}
            <span>Save Hours</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded bg-ok-soft text-ok border border-ok/30 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Court opening hours successfully updated!</span>
        </div>
      )}

      {/* Safety Warning if Bookings Fall Outside Hours */}
      {safetyWarnings && safetyWarnings.length > 0 && (
        <div className="p-4 rounded-lg bg-warn-soft/40 border border-warn/40 text-xs text-ink space-y-2">
          <div className="flex items-center gap-2 font-bold text-warn">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {safetyWarnings.length} existing booking(s) now fall outside updated opening hours
            </span>
          </div>
          <p className="text-ink-soft">
            These bookings are facts and will remain honored on the calendar. Only new slot generation will respect the shortened hours.
          </p>
          <ul className="list-disc list-inside space-y-1 pt-1 font-mono text-[11px] text-navy">
            {safetyWarnings.map((w) => (
              <li key={w.reference}>
                {w.date} {w.time} · {w.customerName} ({w.reference})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bulk Copy Action Toolbar */}
      <div className="p-3 rounded bg-surface-2 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-ink-soft">Fast Setup Shortcuts:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMondayToWeekdays}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface border border-border font-medium text-ink hover:bg-surface-2 transition"
          >
            <Copy className="w-3.5 h-3.5 text-navy" />
            <span>Copy Monday to all weekdays</span>
          </button>

          <button
            onClick={handleCopyCourtToAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface border border-border font-medium text-ink hover:bg-surface-2 transition"
          >
            <Layers className="w-3.5 h-3.5 text-navy" />
            <span>Copy this court to all courts</span>
          </button>
        </div>
      </div>

      {/* 7-Day Timetable Grid */}
      <div className="border border-border rounded-lg bg-surface shadow-xs overflow-hidden divide-y divide-border">
        {activeCourt.hours.map((h) => {
          const openStr = `${String(Math.floor(h.openMinutes / 60)).padStart(2, '0')}:${String(h.openMinutes % 60).padStart(2, '0')}`;
          const closeH = Math.floor(h.closeMinutes / 60);
          const closeStr = `${String(closeH === 24 ? 0 : closeH).padStart(2, '0')}:${String(h.closeMinutes % 60).padStart(2, '0')}`;

          return (
            <div
              key={h.weekday}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="w-32 font-bold text-navy text-sm">
                {WEEKDAYS[h.weekday]}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-faint">Open:</span>
                  <input
                    type="time"
                    value={openStr}
                    onChange={(e) => handleHourChange(h.weekday, 'openMinutes', e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-border bg-surface text-ink font-mono text-xs focus:border-navy"
                  />
                </div>

                <span className="text-ink-faint">—</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-ink-faint">Close:</span>
                  <input
                    type="time"
                    value={closeStr}
                    onChange={(e) => handleHourChange(h.weekday, 'closeMinutes', e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-border bg-surface text-ink font-mono text-xs focus:border-navy"
                  />
                </div>
              </div>

              <div className="text-ink-soft text-right font-mono text-[11px]">
                {Math.round((h.closeMinutes - h.openMinutes) / activeCourt.slotMinutes)} slots/day
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
