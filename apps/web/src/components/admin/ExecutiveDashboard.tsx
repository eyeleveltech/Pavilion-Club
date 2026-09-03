'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  CalendarDays,
  TrendingUp,
  CreditCard,
  Building,
  ArrowUpRight,
  ChevronRight,
  Globe,
  MapPin,
  Banknote,
  DollarSign,
} from 'lucide-react';
import type { DashboardData } from '@pavilion/db';

interface ExecutiveDashboardProps {
  initialData?: DashboardData | null | undefined;
}

export function ExecutiveDashboard({ initialData }: ExecutiveDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, initialData]);

  const formatPaise = (paise?: number) => {
    if (paise === undefined || paise === null) return '₹0';
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Dashboard
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            {data?.todayDateFormatted || 'Loading date...'} · Financial & Capacity Summary
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsLoading(true);
              fetchDashboardData();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-border bg-surface text-ink text-xs font-medium hover:bg-surface-2 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-ink-soft ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded border border-border bg-surface text-ink text-xs font-medium hover:bg-surface-2 transition"
          >
            <CalendarDays className="w-4 h-4 text-ink-soft" />
            <span>Day Grid</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 4 Core Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Bookings Today */}
        <Link
          href="/admin/calendar"
          className="p-5 rounded bg-surface border border-border shadow-sm hover:border-navy/40 transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                Bookings
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-ink-faint group-hover:text-navy transition" />
            </div>
            <div className="text-3xl font-bold text-navy mt-1.5 tabular-nums">
              {data?.bookingsToday.bookedCount ?? 0}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-soft">
              of {data?.bookingsToday.capacitySlots ?? 51} slots
            </span>
            <span className="font-semibold text-navy">
              {data?.bookingsToday.percentage ?? 0}% filled
            </span>
          </div>
        </Link>

        {/* Tile 2: Collected Today */}
        <Link
          href="/admin/close"
          className="p-5 rounded bg-surface border border-border shadow-sm hover:border-navy/40 transition group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                Collected
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-ink-faint group-hover:text-navy transition" />
            </div>
            <div className="text-3xl font-bold text-navy mt-1.5 tabular-nums">
              {formatPaise(data?.collectedToday.totalPaise)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-soft">
              {data?.collectedToday.paymentsCount ?? 0} payment
              {data?.collectedToday.paymentsCount === 1 ? '' : 's'}
            </span>
            <span className="font-semibold text-ok">Cash & UPI</span>
          </div>
        </Link>

        {/* Tile 3: Booked Value Today */}
        <div className="p-5 rounded bg-surface border border-border shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
              Booked Value
            </span>
            <div className="text-3xl font-bold text-navy mt-1.5 tabular-nums">
              {formatPaise(data?.bookedValueToday.totalPaise)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-soft">Game revenue value</span>
            <span className="text-ink-faint font-medium">incl. partner</span>
          </div>
        </div>

        {/* Tile 4: Still Owing */}
        <div
          className={`p-5 rounded border shadow-sm flex flex-col justify-between transition ${
            (data?.stillOwingToday.totalPaise ?? 0) > 0
              ? 'bg-surface border-warn/40 ring-1 ring-warn/20'
              : 'bg-surface border-border'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                Still Owing
              </span>
              {(data?.stillOwingToday.totalPaise ?? 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
              )}
            </div>
            <div
              className={`text-3xl font-bold mt-1.5 tabular-nums ${
                (data?.stillOwingToday.totalPaise ?? 0) > 0
                  ? 'text-warn'
                  : 'text-navy'
              }`}
            >
              {formatPaise(data?.stillOwingToday.totalPaise)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-soft">
              {data?.stillOwingToday.unpaidCount ?? 0} booking
              {data?.stillOwingToday.unpaidCount === 1 ? '' : 's'}
            </span>
            <span className="font-semibold text-ink-faint">Desk to collect</span>
          </div>
        </div>
      </div>

      {/* 3. Middle 2 Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Online vs Offline */}
        <section className="p-6 rounded bg-surface border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
              Online vs Offline
            </h2>
            <span className="text-xs text-ink-faint">Today&apos;s Channels</span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-info-soft text-info flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy">Online</p>
                  <p className="text-xs text-ink-soft">
                    {data?.onlineVsOffline.onlineCount ?? 0} bookings (Website & App)
                  </p>
                </div>
              </div>
              <span className="text-base font-bold text-navy tabular-nums">
                {formatPaise(data?.onlineVsOffline.onlinePaise)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface-2 text-ink-soft flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy">Offline</p>
                  <p className="text-xs text-ink-soft">
                    {data?.onlineVsOffline.offlineCount ?? 0} bookings (Walk-in & Phone)
                  </p>
                </div>
              </div>
              <span className="text-base font-bold text-navy tabular-nums">
                {formatPaise(data?.onlineVsOffline.offlinePaise)}
              </span>
            </div>
          </div>
        </section>

        {/* Turf Town Outstanding */}
        <section className="p-6 rounded bg-surface border border-border shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
                Turf Town Outstanding
              </h2>
              <span className="text-xs text-info font-semibold">
                Partner Receivable
              </span>
            </div>

            <div className="pt-4 space-y-2">
              <div className="text-3xl font-bold text-navy tabular-nums">
                {formatPaise(data?.partnerOutstanding.totalPaise)}
              </div>
              <p className="text-xs text-ink-soft">
                Across{' '}
                <strong className="text-navy font-semibold">
                  {data?.partnerOutstanding.bookingCount ?? 0} bookings
                </strong>{' '}
                delivered via Turf Town API
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-faint">
              Commission deducted per agreement
            </span>
            <Link
              href="/admin/reports"
              className="font-semibold text-navy hover:text-gold transition flex items-center gap-1"
            >
              <span>Settlements</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* 4. Bottom Section: Next 7 Days Occupancy Strip */}
      <section className="p-6 rounded bg-surface border border-border shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
              Next 7 Days
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Slot fill percentage across all 3 courts
            </p>
          </div>
          <span className="text-xs font-medium text-ink-faint">
            Click any bar to view day grid
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {data?.next7Days.map((day) => (
            <Link
              key={day.date}
              href={`/admin/calendar?date=${day.date}`}
              className={`p-3.5 rounded border transition flex flex-col justify-between group text-left ${
                day.isToday
                  ? 'bg-navy/5 border-navy/30 shadow-xs'
                  : 'bg-surface-2/40 border-border hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-bold ${
                    day.isToday ? 'text-navy' : 'text-ink'
                  }`}
                >
                  {day.dayLabel}
                </span>
                {day.isToday && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-navy text-white">
                    Today
                  </span>
                )}
              </div>

              {/* Mini Progress Bar */}
              <div className="w-full bg-border rounded-full h-2 overflow-hidden my-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    day.percentage >= 80
                      ? 'bg-danger'
                      : day.percentage >= 50
                      ? 'bg-warn'
                      : day.percentage > 0
                      ? 'bg-gold'
                      : 'bg-transparent'
                  }`}
                  style={{ width: `${Math.max(day.percentage, 0)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-ink-soft mt-1">
                <span className="tabular-nums font-mono">
                  {day.bookedSlots}/{day.totalSlots}
                </span>
                <span className="font-semibold text-navy tabular-nums">
                  {day.percentage}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
