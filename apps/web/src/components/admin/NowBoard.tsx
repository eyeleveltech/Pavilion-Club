'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ChevronRight,
  Phone,
  Radio,
  X,
  CreditCard,
} from 'lucide-react';
import type { NowBoardData, NowCourtSlot, UnpaidBooking } from '@pavilion/db';

interface NowBoardProps {
  initialData?: NowBoardData | null | undefined;
  userRole?: string;
}

export function NowBoard({ initialData, userRole = 'desk' }: NowBoardProps) {
  const [data, setData] = useState<NowBoardData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedUnpaid, setSelectedUnpaid] = useState<UnpaidBooking | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Auto-refresh data every 30s as specified in spec
  const fetchNowData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/now');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          setData(json.data);
          setLastRefreshed(new Date());
        }
      }
    } catch (err) {
      console.error('Error fetching Now board data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchNowData();
    }
    const interval = setInterval(fetchNowData, 30000);
    return () => clearInterval(interval);
  }, [fetchNowData, initialData]);

  const formatPaiseDisplay = (paise?: number) => {
    if (paise === undefined || paise === null) return '—';
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
  };

  const handleCollectQuickAction = (unpaid: UnpaidBooking) => {
    setSelectedUnpaid(unpaid);
    setShowCollectModal(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-navy">Now</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ok-soft text-ok border border-ok/20">
              <Radio className="w-3 h-3 animate-pulse" />
              Live Desk
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1 flex items-center gap-2">
            <span>{data?.currentTimeFormatted || 'Loading live time...'}</span>
            <span className="text-ink-faint">·</span>
            <span className="text-ink-faint text-[11px]">
              Refreshes every 30s
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsLoading(true);
              fetchNowData();
            }}
            disabled={isLoading}
            title="Refresh now"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-border bg-surface text-ink text-xs font-medium hover:bg-surface-2 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-ink-soft ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/admin/book"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-navy text-white text-xs font-semibold hover:opacity-90 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-gold" />
            <span>+ Book a slot</span>
          </Link>
        </div>
      </div>

      {/* 2. ON COURT NOW Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
              On Court Now
            </h2>
            <span className="text-xs font-medium text-ink-faint">
              ({data?.currentSlotLabel || 'Current Hour'})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.onCourtNow.map((slot) => (
            <div
              key={slot.courtId}
              className={`rounded border p-5 transition flex flex-col justify-between min-h-[148px] ${
                slot.isFree
                  ? 'bg-surface-2/60 border-dashed border-border'
                  : slot.paidStatus === 'UNPAID'
                  ? 'bg-surface border-warn/40 ring-1 ring-warn/20 shadow-sm'
                  : 'bg-surface border-border shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-navy uppercase tracking-wider">
                    {slot.courtName}
                  </span>
                  <p className="text-xs text-ink-soft font-mono mt-0.5">
                    {slot.timeLabel}
                  </p>
                </div>

                {slot.isFree ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-2 text-ink-soft border border-border">
                    FREE
                  </span>
                ) : slot.paidStatus === 'PAID' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-ok-soft text-ok border border-ok/30">
                    <CheckCircle2 className="w-3 h-3" />
                    PAID
                  </span>
                ) : slot.paidStatus === 'PARTNER' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-info-soft text-info border border-info/30">
                    {slot.channelName || 'PARTNER'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-warn-soft text-warn border border-warn/30 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    UNPAID ⚠️
                  </span>
                )}
              </div>

              {slot.isFree ? (
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-ink-faint">Court is open</span>
                  <Link
                    href={`/admin/book?courtId=${slot.courtId}&time=${slot.timeLabel.split('–')[0]}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-navy/5 text-navy hover:bg-navy hover:text-white transition text-xs font-medium"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Book Now</span>
                  </Link>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-border flex items-end justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold text-ink truncate">
                      {slot.customerName}
                    </p>
                    <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-ink-faint" />
                      <span>{slot.phoneOrRef}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-navy tabular-nums">
                      {slot.paidStatus === 'PARTNER'
                        ? '—'
                        : formatPaiseDisplay(slot.amountPaise)}
                    </span>
                    {slot.paidStatus === 'UNPAID' && (
                      <button
                        onClick={() => {
                          const found = data?.toCollect.unpaidBookings.find(
                            (u) => u.bookingId === slot.bookingId
                          );
                          if (found) handleCollectQuickAction(found);
                        }}
                        className="block mt-1 text-[11px] font-semibold text-warn underline hover:text-warn/80"
                      >
                        Collect
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. NEXT UP Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
              Next Up
            </h2>
            <span className="text-xs font-medium text-ink-faint">
              · {data?.nextSlotLabel || 'Next Hour'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.nextUp.map((slot) => (
            <div
              key={slot.courtId}
              className={`rounded border p-5 transition flex flex-col justify-between min-h-[140px] ${
                slot.isFree
                  ? 'bg-surface-2/40 border-dashed border-border'
                  : slot.paidStatus === 'UNPAID'
                  ? 'bg-surface border-warn/30'
                  : 'bg-surface border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-navy uppercase tracking-wider">
                    {slot.courtName}
                  </span>
                  <p className="text-xs text-ink-soft font-mono mt-0.5">
                    {slot.timeLabel}
                  </p>
                </div>

                {slot.isFree ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-2 text-ink-soft border border-border">
                    FREE
                  </span>
                ) : slot.paidStatus === 'PAID' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-ok-soft text-ok border border-ok/30">
                    PAID
                  </span>
                ) : slot.paidStatus === 'PARTNER' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-info-soft text-info border border-info/30">
                    {slot.channelName || 'PARTNER'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-warn-soft text-warn border border-warn/30">
                    UNPAID ⚠️
                  </span>
                )}
              </div>

              {slot.isFree ? (
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-ink-faint">Available for walk-in</span>
                  <Link
                    href={`/admin/book?courtId=${slot.courtId}&time=${slot.timeLabel.split('–')[0]}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-navy text-white hover:opacity-90 transition text-xs font-semibold shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-gold" />
                    <span>+ Book</span>
                  </Link>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-border flex items-end justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold text-ink truncate">
                      {slot.customerName}
                    </p>
                    <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-ink-faint" />
                      <span>{slot.phoneOrRef}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-navy tabular-nums">
                      {slot.paidStatus === 'PARTNER'
                        ? '—'
                        : formatPaiseDisplay(slot.amountPaise)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. LATER TODAY & TO COLLECT (2 Columns on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Later Today Grid */}
        <section className="lg:col-span-2 bg-surface rounded border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
              Later Today
            </h2>
            <Link
              href="/admin/calendar"
              className="text-xs text-navy font-semibold hover:text-gold transition flex items-center gap-1"
            >
              <span>Full Day Grid</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {data?.laterToday.map((slot) => {
              const isFull = slot.bookedCount === slot.totalCourts;
              const isEmpty = slot.bookedCount === 0;

              return (
                <Link
                  key={slot.startMinutes}
                  href={`/admin/calendar?time=${slot.startMinutes}`}
                  className="p-3 rounded border border-border bg-surface-2/50 hover:bg-surface-2 transition flex flex-col justify-between text-left group"
                >
                  <span className="text-xs font-bold text-navy font-mono">
                    {slot.hourLabel}
                  </span>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-ink-soft">
                      {slot.bookedCount} of {slot.totalCourts} booked
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isFull
                          ? 'bg-danger'
                          : isEmpty
                          ? 'bg-ok'
                          : 'bg-gold'
                      }`}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* TO COLLECT Alert Card */}
        <section className="bg-surface rounded border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-warn" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
                To Collect
              </h2>
            </div>
            <span className="text-base font-bold text-warn tabular-nums">
              {formatPaiseDisplay(data?.toCollect.totalDuePaise)}
            </span>
          </div>

          <div>
            <p className="text-sm text-ink font-medium">
              {data?.toCollect.unpaidCount === 0 ? (
                <span className="text-ok font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  All bookings today are settled!
                </span>
              ) : (
                <span>
                  <strong className="text-warn font-bold">
                    {data?.toCollect.unpaidCount}
                  </strong>{' '}
                  booking
                  {data?.toCollect.unpaidCount === 1 ? '' : 's'} today still
                  unpaid
                </span>
              )}
            </p>
            <p className="text-xs text-ink-soft mt-1">
              Confirmed walk-ins and venue payments to collect at the counter.
            </p>
          </div>

          {data && data.toCollect.unpaidCount > 0 && (
            <button
              onClick={() => setShowCollectModal(true)}
              className="w-full py-2.5 px-4 rounded bg-warn-soft text-warn font-semibold text-xs border border-warn/30 hover:bg-warn hover:text-white transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>See Unpaid Bookings ({data.toCollect.unpaidCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </section>
      </div>

      {/* 5. Unpaid Bookings Modal / Slide-over */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-navy text-base">
                  Unpaid Bookings Today
                </h3>
                <p className="text-xs text-ink-soft">
                  Collect cash or UPI payment from player
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCollectModal(false);
                  setSelectedUnpaid(null);
                  setPaymentSuccessMsg(null);
                }}
                className="p-1 rounded text-ink-soft hover:bg-surface-2 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {paymentSuccessMsg && (
                <div className="p-3 rounded bg-ok-soft text-ok border border-ok/30 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              {data?.toCollect.unpaidBookings.map((b) => (
                <div
                  key={b.bookingId}
                  className="p-3.5 rounded border border-border bg-surface-2/40 hover:bg-surface-2 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy">
                        {b.customerName}
                      </span>
                      <span className="text-[11px] font-mono text-ink-soft">
                        ({b.reference})
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {b.courtName} · {b.timeLabel}
                    </p>
                    <p className="text-xs text-ink-faint mt-0.5 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" />
                      <span>{b.customerPhone}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-warn tabular-nums">
                      {formatPaiseDisplay(b.duePaise)}
                    </div>
                    <button
                      onClick={() => {
                        setPaymentSuccessMsg(
                          `Payment collected for ${b.customerName} (${b.reference})!`
                        );
                        setTimeout(() => {
                          fetchNowData();
                        }, 1000);
                      }}
                      className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ok text-white text-xs font-semibold hover:opacity-90 transition shadow-sm"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Mark Paid</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-surface-2/20 flex justify-end">
              <button
                onClick={() => {
                  setShowCollectModal(false);
                  setSelectedUnpaid(null);
                  setPaymentSuccessMsg(null);
                }}
                className="px-4 py-2 rounded border border-border text-xs font-medium text-ink hover:bg-surface-2 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
