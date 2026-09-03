'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonthCalendarData } from '@pavilion/db';

interface MonthCalendarViewProps {
  data: MonthCalendarData;
  onSelectDate: (date: string) => void;
  onNavigateMonth: (ym: string) => void;
}

export function MonthCalendarView({
  data,
  onSelectDate,
  onNavigateMonth,
}: MonthCalendarViewProps) {
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-xl font-bold tracking-tight text-navy">
          {data.monthTitle}
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onNavigateMonth(data.prevMonth)}
            className="p-2 rounded border border-border hover:bg-surface-2 text-ink-soft hover:text-ink transition"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const todayYmd = new Date().toISOString().split('T')[0]!;
              onNavigateMonth(todayYmd.slice(0, 7));
            }}
            className="px-3 py-1.5 rounded border border-border bg-surface text-ink text-xs font-semibold hover:bg-surface-2 transition"
          >
            Today
          </button>

          <button
            onClick={() => onNavigateMonth(data.nextMonth)}
            className="p-2 rounded border border-border hover:bg-surface-2 text-ink-soft hover:text-ink transition"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-ink-soft py-1">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {data.days.map((cell) => {
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={`p-3 min-h-[90px] rounded border text-left flex flex-col justify-between transition group ${
                cell.isToday
                  ? 'bg-surface border-navy ring-2 ring-navy/20 shadow-xs'
                  : cell.isCurrentMonth
                  ? 'bg-surface border-border hover:border-navy/40 hover:bg-surface-2/40'
                  : 'bg-surface-2/30 border-border/40 opacity-40 hover:opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-bold ${
                    cell.isToday ? 'text-navy' : 'text-ink'
                  }`}
                >
                  {cell.dayOfMonth}
                </span>
                {cell.isToday && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-navy text-white">
                    Today
                  </span>
                )}
              </div>

              {cell.isCurrentMonth && (
                <div className="mt-2 space-y-1.5">
                  <div className="text-xs font-medium text-ink-soft tabular-nums">
                    {cell.bookedCount} booking{cell.bookedCount === 1 ? '' : 's'}
                  </div>

                  {/* Fill Bar */}
                  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cell.percentage >= 80
                          ? 'bg-danger'
                          : cell.percentage >= 50
                          ? 'bg-warn'
                          : cell.percentage > 0
                          ? 'bg-gold'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${Math.max(cell.percentage, 0)}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
