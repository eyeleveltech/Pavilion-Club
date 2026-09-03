'use client';

import { useState } from 'react';
import { ShieldAlert, Plus, Trash2, Calendar, Clock, Loader2, CheckCircle2 } from 'lucide-react';

interface BlackoutItem {
  id: string;
  courtId: string;
  courtName: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  createdByName: string;
  createdAt: string;
}

interface BlackoutsSettingsViewProps {
  blackouts: BlackoutItem[];
  courts: { id: string; name: string }[];
}

export function BlackoutsSettingsView({
  blackouts: initialBlackouts,
  courts,
}: BlackoutsSettingsViewProps) {
  const [blackouts, setBlackouts] = useState<BlackoutItem[]>(initialBlackouts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState('all');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('Net Resurfacing & Maintenance');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBlackout = async () => {
    setIsSubmitting(true);
    try {
      const courtIds = selectedCourtId === 'all' ? courts.map((c) => c.id) : [selectedCourtId];
      const startsAt = new Date(`${date}T${startTime}:00+05:30`).toISOString();
      const endsAt = new Date(`${date}T${endTime}:00+05:30`).toISOString();

      const res = await fetch('/api/admin/settings/blackouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtIds,
          startsAt,
          endsAt,
          reason,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        // Refresh blackouts list
        const refreshed = await fetch('/api/admin/settings/blackouts');
        if (refreshed.ok) {
          const json = await refreshed.json();
          setBlackouts(json.blackouts || []);
        }
      }
    } catch (err) {
      console.error('Failed to create blackout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/settings/blackouts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBlackouts((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete blackout:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-navy">Court Blackouts</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Lock slots across one or all courts for rain, private tournaments, or repair
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-navy text-white text-xs font-bold hover:opacity-90 transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Add Blackout</span>
        </button>
      </div>

      {showAddModal && (
        <div className="p-5 rounded-lg border border-navy/30 bg-surface shadow-md space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
            Create Court Blackout
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Target Court</label>
              <select
                value={selectedCourtId}
                onChange={(e) => setSelectedCourtId(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink"
              >
                <option value="all">All Courts (Whole Venue)</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink-soft mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink-soft mb-1">Start & End Time</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-border bg-surface text-ink font-mono"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-border bg-surface text-ink font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink-soft mb-1">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Rain, Resurfacing"
                className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded border border-border text-xs text-ink-soft hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleCreateBlackout}
              className="px-4 py-1.5 rounded bg-navy text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Blackout</span>
            </button>
          </div>
        </div>
      )}

      {/* Blackouts List */}
      <div className="border border-border rounded-lg bg-surface shadow-xs overflow-hidden divide-y divide-border">
        {blackouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-faint">
            No active blackouts. All courts operating normally.
          </div>
        ) : (
          blackouts.map((b) => (
            <div
              key={b.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy text-sm">{b.courtName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger-soft text-danger">
                    Blackout
                  </span>
                </div>
                <p className="text-ink font-medium">{b.reason}</p>
                <p className="text-ink-soft text-[11px]">
                  Scheduled by {b.createdByName}
                </p>
              </div>

              <button
                onClick={() => handleDelete(b.id)}
                className="p-2 rounded hover:bg-danger-soft text-ink-soft hover:text-danger transition self-end sm:self-center"
                title="Remove Blackout"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
