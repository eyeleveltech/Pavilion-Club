'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, Plus, RefreshCw, Loader2 } from 'lucide-react';
import type { MonthCalendarData, DayCalendarData } from '@pavilion/db';
import { MonthCalendarView } from './MonthCalendarView';
import { DaySlotGridView } from './DaySlotGridView';

interface CalendarViewContainerProps {
  initialViewMode?: 'month' | 'day';
  initialDate?: string;
  initialMonth?: string;
  initialMonthData?: MonthCalendarData | null;
  initialDayData?: DayCalendarData | null;
}

export function CalendarViewContainer({
  initialViewMode = 'day',
  initialDate,
  initialMonth,
  initialMonthData,
  initialDayData,
}: CalendarViewContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlDate = searchParams.get('date');
  const urlMonth = searchParams.get('month');

  const [viewMode, setViewMode] = useState<'month' | 'day'>(
    urlDate ? 'day' : urlMonth ? 'month' : initialViewMode
  );

  const [currentDate, setCurrentDate] = useState<string>(
    urlDate || initialDate || new Date().toISOString().split('T')[0]!
  );

  const [currentMonth, setCurrentMonth] = useState<string>(
    urlMonth || initialMonth || currentDate.slice(0, 7)
  );

  const [monthData, setMonthData] = useState<MonthCalendarData | null>(initialMonthData || null);
  const [dayData, setDayData] = useState<DayCalendarData | null>(initialDayData || null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch Month Data
  const fetchMonthData = useCallback(async (ym: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/calendar/month?month=${ym}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok) setMonthData(json.data);
      }
    } catch (err) {
      console.error('Failed to load month calendar:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fetch Day Data
  const fetchDayData = useCallback(async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/calendar/day?date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok) setDayData(json.data);
      }
    } catch (err) {
      console.error('Failed to load day calendar:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync on state change
  useEffect(() => {
    if (viewMode === 'month' && (!monthData || monthData.yearMonth !== currentMonth)) {
      fetchMonthData(currentMonth);
    } else if (viewMode === 'day' && (!dayData || dayData.date !== currentDate)) {
      fetchDayData(currentDate);
    }
  }, [viewMode, currentMonth, currentDate, monthData, dayData, fetchMonthData, fetchDayData]);

  const handleSelectDateFromMonth = (dateStr: string) => {
    setCurrentDate(dateStr);
    setViewMode('day');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Controls: Switcher & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 rounded-lg bg-surface-2 border border-border text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md transition ${
                viewMode === 'day'
                  ? 'bg-surface text-navy shadow-xs border border-border/60'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-navy" />
              <span>Day Timetable</span>
            </button>

            <button
              onClick={() => setViewMode('month')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md transition ${
                viewMode === 'month'
                  ? 'bg-surface text-navy shadow-xs border border-border/60'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-gold" />
              <span>Month Overview</span>
            </button>
          </div>

          {isLoading && (
            <span className="text-xs text-ink-faint flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Updating...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (viewMode === 'day') fetchDayData(currentDate);
              else fetchMonthData(currentMonth);
            }}
            disabled={isLoading}
            className="p-2 rounded border border-border bg-surface text-ink-soft hover:text-ink hover:bg-surface-2 transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href={`/admin/book?date=${currentDate}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-navy text-white text-xs font-semibold hover:opacity-90 transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-gold" />
            <span>+ Book a slot</span>
          </Link>
        </div>
      </div>

      {/* View Rendering */}
      {viewMode === 'month' && monthData ? (
        <MonthCalendarView
          data={monthData}
          onSelectDate={handleSelectDateFromMonth}
          onNavigateMonth={(ym) => setCurrentMonth(ym)}
        />
      ) : viewMode === 'day' && dayData ? (
        <DaySlotGridView
          data={dayData}
          onSelectDate={(d) => setCurrentDate(d)}
          onRefresh={() => fetchDayData(currentDate)}
        />
      ) : (
        <div className="p-12 text-center text-xs text-ink-faint flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading calendar...</span>
        </div>
      )}
    </div>
  );
}
