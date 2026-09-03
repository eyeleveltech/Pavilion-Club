'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarDays,
  Globe,
  MapPin,
  PhoneCall,
  Flame,
} from 'lucide-react';
import type { DayCalendarData, DaySlotCell, DaySlotBooking } from '@pavilion/db';
import { BookingDetailSheet } from './BookingDetailSheet';

interface DaySlotGridViewProps {
  data: DayCalendarData;
  onSelectDate: (date: string) => void;
  onRefresh: () => void;
}

export function DaySlotGridView({
  data,
  onSelectDate,
  onRefresh,
}: DaySlotGridViewProps) {
  const [activeBooking, setActiveBooking] = useState<{
    booking: DaySlotBooking;
    courtName: string;
    timeLabel: string;
  } | null>(null);

  // Helper for channel style
  const getChannelBadge = (code: string, isPartner: boolean) => {
    if (isPartner || code === 'turftown') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-navy text-gold">
          <Flame className="w-3 h-3 text-gold" />
          TURF TOWN
        </span>
      );
    }
    if (code === 'website') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-info-soft text-info">
          <Globe className="w-3 h-3" />
          WEBSITE
        </span>
      );
    }
    if (code === 'phone') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-surface-2 text-ink">
          <PhoneCall className="w-3 h-3" />
          PHONE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-surface-2 text-ink">
        <MapPin className="w-3 h-3" />
        WALK-IN
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Day Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">
            {data.dateFormatted}
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Timetable slot grid across all {data.courts.length} courts
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelectDate(data.prevDate)}
            className="p-2 rounded border border-border hover:bg-surface-2 text-ink-soft hover:text-ink transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const todayYmd = new Date().toISOString().split('T')[0]!;
              onSelectDate(todayYmd);
            }}
            className="px-3 py-1.5 rounded border border-border bg-surface text-ink text-xs font-semibold hover:bg-surface-2 transition"
          >
            Today
          </button>

          <button
            onClick={() => onSelectDate(data.nextDate)}
            className="p-2 rounded border border-border hover:bg-surface-2 text-ink-soft hover:text-ink transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Desktop Slot Grid (visible on lg and above) */}
      <div className="hidden lg:block border border-border rounded-lg bg-surface shadow-xs overflow-hidden">
        {/* Sticky Court Header */}
        <div className="grid grid-cols-[100px_repeat(3,1fr)] bg-surface-2/70 border-b border-border text-xs font-bold text-navy sticky top-0 z-10">
          <div className="p-3 text-ink-soft uppercase tracking-wider text-center border-r border-border">
            Time
          </div>
          {data.courts.map((court) => (
            <div key={court.id} className="p-3 text-center border-r last:border-r-0 border-border">
              {court.name}
            </div>
          ))}
        </div>

        {/* Timetable Rows */}
        <div className="divide-y divide-border">
          {data.hours.map((row) => {
            const isCurrentSlot =
              data.isToday &&
              data.currentIstMinutes >= row.startMinutes &&
              data.currentIstMinutes < row.startMinutes + 60;

            return (
              <div
                key={row.startMinutes}
                className={`grid grid-cols-[100px_repeat(3,1fr)] relative min-h-[64px] ${
                  isCurrentSlot ? 'bg-navy/5 ring-1 ring-navy/20' : ''
                }`}
              >
                {/* Time Label Column */}
                <div className="p-2.5 text-center border-r border-border flex flex-col justify-center text-xs font-mono font-bold text-ink-soft">
                  <span>{row.hourLabel}</span>
                  {isCurrentSlot && (
                    <span className="text-[10px] font-sans font-bold text-ok uppercase tracking-wider">
                      ● Now
                    </span>
                  )}
                </div>

                {/* Courts Columns */}
                {data.courts.map((court) => {
                  const cell = row.slotsByCourt[court.id];
                  if (!cell) {
                    return (
                      <div
                        key={court.id}
                        className="p-2 border-r last:border-r-0 border-border bg-surface-2/20"
                      />
                    );
                  }

                  // 1. Booked Slot
                  if (cell.state === 'booked' && cell.booking) {
                    const isUnpaid = !cell.booking.isPaid;

                    return (
                      <div
                        key={court.id}
                        onClick={() =>
                          setActiveBooking({
                            booking: cell.booking!,
                            courtName: court.name,
                            timeLabel: cell.timeLabel,
                          })
                        }
                        className={`p-2.5 border-r last:border-r-0 border-border cursor-pointer transition flex flex-col justify-between ${
                          isUnpaid
                            ? 'bg-warn-soft/20 border-warn/40 hover:bg-warn-soft/30'
                            : 'bg-surface hover:bg-surface-2'
                        } ${cell.isPast ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          {getChannelBadge(
                            cell.booking.channelCode,
                            cell.booking.isPartner
                          )}
                          {isUnpaid ? (
                            <span className="text-[10px] font-bold text-warn px-1 rounded bg-warn/10 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              UNPAID
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-ok flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              PAID
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="font-semibold text-navy truncate">
                            {cell.booking.customerName}
                          </span>
                          <span className="font-mono text-ink-soft text-[11px]">
                            ₹{(cell.booking.amountPaise / 100).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // 2. Blackout Slot
                  if (cell.state === 'blackout') {
                    return (
                      <div
                        key={court.id}
                        className="p-2.5 border-r last:border-r-0 border-border bg-surface-2/60 text-ink-faint flex items-center justify-center text-xs italic"
                      >
                        <span>{cell.blackoutReason || 'Maintenance'}</span>
                      </div>
                    );
                  }

                  // 3. Free Slot
                  return (
                    <Link
                      key={court.id}
                      href={`/admin/book?date=${data.date}&courtId=${court.id}&time=${row.hourLabel}`}
                      className={`p-2.5 border-r last:border-r-0 border-border hover:bg-surface-2 transition flex items-center justify-between group text-xs ${
                        cell.isPast ? 'opacity-40 pointer-events-none' : ''
                      }`}
                    >
                      <span className="text-ink-faint group-hover:text-ink font-mono">
                        {cell.priceFormatted}
                      </span>
                      <span className="hidden group-hover:inline-flex items-center gap-1 px-2 py-1 rounded bg-navy text-white text-[11px] font-semibold shadow-xs">
                        <Plus className="w-3 h-3 text-gold" />
                        Book
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Mobile Responsive List View (visible below lg) */}
      <div className="block lg:hidden space-y-3">
        {data.hours.map((row) => (
          <div
            key={row.startMinutes}
            className="p-3 rounded-lg border border-border bg-surface shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <span className="text-xs font-mono font-bold text-navy">
                {row.hourLabel}
              </span>
              {data.isToday &&
                data.currentIstMinutes >= row.startMinutes &&
                data.currentIstMinutes < row.startMinutes + 60 && (
                  <span className="text-[10px] font-bold text-ok uppercase">
                    ● Active Hour
                  </span>
                )}
            </div>

            <div className="space-y-1.5">
              {data.courts.map((court) => {
                const cell = row.slotsByCourt[court.id];
                if (!cell) return null;

                if (cell.state === 'booked' && cell.booking) {
                  return (
                    <div
                      key={court.id}
                      onClick={() =>
                        setActiveBooking({
                          booking: cell.booking!,
                          courtName: court.name,
                          timeLabel: cell.timeLabel,
                        })
                      }
                      className={`p-2 rounded border text-xs cursor-pointer flex items-center justify-between ${
                        !cell.booking.isPaid
                          ? 'border-warn/40 bg-warn-soft/20'
                          : 'border-border bg-surface-2/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-navy font-semibold">{court.name}</strong>
                          {getChannelBadge(cell.booking.channelCode, cell.booking.isPartner)}
                        </div>
                        <p className="text-ink-soft text-[11px] mt-0.5">
                          {cell.booking.customerName}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-navy">
                          ₹{(cell.booking.amountPaise / 100).toLocaleString('en-IN')}
                        </span>
                        <div>
                          {!cell.booking.isPaid ? (
                            <span className="text-[10px] font-bold text-warn">UNPAID</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-ok">PAID</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (cell.state === 'blackout') {
                  return (
                    <div
                      key={court.id}
                      className="p-2 rounded border border-border bg-surface-2/50 text-ink-faint text-xs flex justify-between"
                    >
                      <span>{court.name}</span>
                      <span className="italic">{cell.blackoutReason || 'Maintenance'}</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={court.id}
                    href={`/admin/book?date=${data.date}&courtId=${court.id}&time=${row.hourLabel}`}
                    className="p-2 rounded border border-border hover:bg-surface-2 text-xs flex items-center justify-between transition"
                  >
                    <span className="text-ink-soft">{court.name}</span>
                    <span className="text-ok font-semibold flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Free ({cell.priceFormatted})
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend Beneath Grid */}
      <div className="p-3.5 rounded border border-border bg-surface text-xs text-ink-soft flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-navy uppercase text-[11px]">Legend:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-info" /> Website
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-surface-2 border border-ink/30" /> Walk-in
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-ink-faint" /> Phone
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gold" /> Turf Town
          </span>
        </div>

        <div className="flex items-center gap-3 font-semibold">
          <span className="text-ok flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Solid = Paid
          </span>
          <span className="text-warn flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Outlined = Unpaid
          </span>
        </div>
      </div>

      {/* Slide-over Booking Detail Sheet */}
      {activeBooking && (
        <BookingDetailSheet
          booking={activeBooking.booking}
          courtName={activeBooking.courtName}
          timeLabel={activeBooking.timeLabel}
          dateFormatted={data.dateFormatted}
          onClose={() => setActiveBooking(null)}
          onActionComplete={() => {
            setActiveBooking(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
