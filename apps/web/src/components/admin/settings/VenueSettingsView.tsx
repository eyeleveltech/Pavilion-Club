'use client';

import { useState } from 'react';
import { Sliders, Save, CheckCircle2, Loader2 } from 'lucide-react';

export interface VenueSettingsData {
  id: number;
  name: string;
  timezone: string;
  businessDayStartHour: number;
  holdTtlMinutes: number;
  bookingWindowDays: number;
}

interface VenueSettingsViewProps {
  venue: VenueSettingsData;
}

export function VenueSettingsView({ venue: initialVenue }: VenueSettingsViewProps) {
  const [name, setName] = useState(initialVenue.name);
  const [timezone, setTimezone] = useState(initialVenue.timezone);
  const [businessDayStartHour, setBusinessDayStartHour] = useState(
    initialVenue.businessDayStartHour
  );
  const [holdTtlMinutes, setHoldTtlMinutes] = useState(initialVenue.holdTtlMinutes);
  const [bookingWindowDays, setBookingWindowDays] = useState(initialVenue.bookingWindowDays);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/admin/settings/venue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          timezone,
          businessDayStartHour,
          holdTtlMinutes,
          bookingWindowDays,
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save venue settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-bold text-navy">General Venue Settings</h2>
        <p className="text-xs text-ink-soft mt-0.5">
          Core operating parameters and operational business rules
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded bg-ok-soft text-ok border border-ok/30 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Venue settings updated successfully!</span>
        </div>
      )}

      <div className="p-6 rounded-lg bg-surface border border-border shadow-xs space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-ink-soft mb-1">Venue Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded border border-border bg-surface text-ink text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block font-semibold text-ink-soft mb-1">Timezone</label>
          <input
            type="text"
            disabled
            value={timezone}
            className="w-full px-3 py-2 rounded border border-border bg-surface-2 text-ink-soft font-mono"
          />
          <p className="text-[11px] text-ink-faint mt-1">Fixed to Indian Standard Time (IST - UTC+05:30)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-ink-soft mb-1">
              Business Day Start Hour
            </label>
            <input
              type="number"
              min="0"
              max="12"
              value={businessDayStartHour}
              onChange={(e) => setBusinessDayStartHour(parseInt(e.target.value, 10) || 5)}
              className="w-full px-3 py-2 rounded border border-border bg-surface text-ink font-mono font-bold"
            />
            <p className="text-[11px] text-ink-faint mt-1">
              Slots before 05:00 count towards previous night
            </p>
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">
              Slot Hold TTL (Minutes)
            </label>
            <input
              type="number"
              min="2"
              max="30"
              value={holdTtlMinutes}
              onChange={(e) => setHoldTtlMinutes(parseInt(e.target.value, 10) || 10)}
              className="w-full px-3 py-2 rounded border border-border bg-surface text-ink font-mono font-bold"
            />
            <p className="text-[11px] text-ink-faint mt-1">
              Checkout timer before unconfirmed slot releases
            </p>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-ink-soft mb-1">
            Max Advance Booking Window (Days)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={bookingWindowDays}
            onChange={(e) => setBookingWindowDays(parseInt(e.target.value, 10) || 14)}
            className="w-full px-3 py-2 rounded border border-border bg-surface text-ink font-mono font-bold"
          />
          <p className="text-[11px] text-ink-faint mt-1">
            Players can book up to {bookingWindowDays} days in advance
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded bg-navy text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 text-gold" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
