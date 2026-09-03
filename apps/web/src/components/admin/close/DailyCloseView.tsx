'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Banknote,
  CreditCard,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  Loader2,
  Calculator,
  ShieldAlert,
} from 'lucide-react';
import type { DailyCloseData } from '@pavilion/db';

interface DailyCloseViewProps {
  initialData: DailyCloseData;
}

export function DailyCloseView({ initialData }: DailyCloseViewProps) {
  const router = useRouter();
  const [data, setData] = useState<DailyCloseData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Cash Handover State - DECLARED CASH MUST START EMPTY!
  const [declaredCashRupees, setDeclaredCashRupees] = useState('');
  const [acceptedByUserId, setAcceptedByUserId] = useState(
    initialData.activeStaffList[0]?.id || ''
  );
  const [varianceNote, setVarianceNote] = useState('');
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);
  const [handoverSuccess, setHandoverSuccess] = useState(false);
  const [handoverError, setHandoverError] = useState<string | null>(null);

  // Quick denomination counter state
  const [showDenomHelper, setShowDenomHelper] = useState(false);
  const [denominations, setDenominations] = useState<Record<number, number>>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
  });

  const fetchDateData = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/close?date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          setData(json.data);
          router.push(`/admin/close?date=${dateStr}`, { scroll: false });
        }
      }
    } catch (err) {
      console.error('Failed to load close date data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Denomination counter updates declared cash
  const handleDenomChange = (denom: number, count: number) => {
    const updated = { ...denominations, [denom]: Math.max(0, count) };
    setDenominations(updated);

    const total = Object.entries(updated).reduce(
      (acc, [d, c]) => acc + parseInt(d, 10) * c,
      0
    );
    setDeclaredCashRupees(total.toString());
  };

  const declaredPaise = declaredCashRupees !== '' ? Math.round(parseFloat(declaredCashRupees) * 100) : null;
  const variancePaise = declaredPaise !== null ? declaredPaise - data.expectedCashPaise : null;

  const handleSubmitHandover = async () => {
    if (declaredPaise === null) {
      setHandoverError('Please enter the declared cash count.');
      return;
    }

    if (variancePaise !== 0 && !varianceNote.trim()) {
      setHandoverError('An explanation note is required when there is cash variance.');
      return;
    }

    setIsSubmittingHandover(true);
    setHandoverError(null);

    try {
      const res = await fetch('/api/admin/close/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDate: data.businessDate,
          expectedPaise: data.expectedCashPaise,
          declaredPaise,
          acceptedBy: acceptedByUserId || null,
          note: varianceNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setHandoverSuccess(true);
        setDeclaredCashRupees('');
        setVarianceNote('');
        fetchDateData(data.businessDate);
        setTimeout(() => setHandoverSuccess(false), 3000);
      } else {
        setHandoverError(json.error || 'Failed to submit handover');
      }
    } catch (err) {
      console.error('Failed to submit handover:', err);
      setHandoverError('Network error. Please try again.');
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header & Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Daily Close & Financial Handover
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            {data.dateFormatted} · 11:30 PM Shift Reconciliation
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fetchDateData(data.prevDate)}
            className="p-2 rounded border border-border hover:bg-surface-2 text-ink-soft hover:text-ink transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const todayYmd = new Date().toISOString().split('T')[0]!;
              fetchDateData(todayYmd);
            }}
            className={`px-3 py-1.5 rounded border text-xs font-semibold transition ${
              data.isToday
                ? 'bg-navy text-white border-navy'
                : 'border-border bg-surface text-ink hover:bg-surface-2'
            }`}
          >
            Today
          </button>

          <button
            onClick={() => fetchDateData(data.nextDate)}
            className="p-2 rounded border border-border hover:bg-surface-2 text-ink-soft hover:text-ink transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => fetchDateData(data.businessDate)}
            className="p-2 rounded border border-border hover:bg-surface-2 text-ink-soft ml-1 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top 4 Financial Summary Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Total Collected */}
        <div className="p-5 rounded bg-surface border border-border shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
              Total Collected
            </span>
            <div className="text-3xl font-bold text-navy mt-1.5 tabular-nums">
              ₹{(data.collection.totalCollectedPaise / 100).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-soft">
              {data.collection.cashCount + data.collection.cardCount + data.collection.gatewayCount} payments
            </span>
            <span className="font-semibold text-ok">Cash, Card & UPI</span>
          </div>
        </div>

        {/* Tile 2: Expected Cash in Till */}
        <div className="p-5 rounded bg-surface border border-navy/30 ring-1 ring-navy/10 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-navy">
              Expected Cash in Till
            </span>
            <div className="text-3xl font-bold text-navy mt-1.5 tabular-nums">
              ₹{(data.expectedCashPaise / 100).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-soft">{data.collection.cashCount} cash receipts</span>
            <span className="font-semibold text-ok">Physical Till</span>
          </div>
        </div>

        {/* Tile 3: Booked Value Today */}
        <div className="p-5 rounded bg-surface border border-border shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
              Booked Value
            </span>
            <div className="text-3xl font-bold text-navy mt-1.5 tabular-nums">
              ₹{(data.totalBookedValuePaise / 100).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-soft">Game revenue value</span>
            <span className="text-ink-faint">incl. partners</span>
          </div>
        </div>

        {/* Tile 4: Total Still Owing */}
        <div
          className={`p-5 rounded border shadow-xs flex flex-col justify-between ${
            data.totalStillOwingPaise > 0
              ? 'bg-surface border-warn/40 ring-1 ring-warn/20'
              : 'bg-surface border-border'
          }`}
        >
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
              Still Owing
            </span>
            <div
              className={`text-3xl font-bold mt-1.5 tabular-nums ${
                data.totalStillOwingPaise > 0 ? 'text-warn' : 'text-navy'
              }`}
            >
              ₹{(data.totalStillOwingPaise / 100).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-soft">
              {data.stillOwingBookings.length} booking{data.stillOwingBookings.length === 1 ? '' : 's'}
            </span>
            <span className="font-semibold text-warn">To Chase</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: By Court & Payment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Court Summary */}
        <section className="p-6 rounded-lg bg-surface border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
              Court Performance
            </h2>
            <span className="text-xs text-ink-faint">Today&apos;s Revenue by Court</span>
          </div>

          <div className="space-y-3">
            {data.byCourt.map((c) => (
              <div
                key={c.courtId}
                className="p-3.5 rounded border border-border bg-surface-2/40 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-navy text-sm">{c.courtName}</h3>
                  <p className="text-xs text-ink-soft">
                    {c.bookingCount} booking{c.bookingCount === 1 ? '' : 's'} assigned
                  </p>
                </div>
                <span className="font-bold text-navy text-base tabular-nums">
                  ₹{(c.bookedValuePaise / 100).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Collection Breakdown by Method */}
        <section className="p-6 rounded-lg bg-surface border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
              Collection Breakdown
            </h2>
            <span className="text-xs text-ink-faint">By Payment Method</span>
          </div>

          <div className="space-y-3">
            {/* Cash */}
            <div className="p-3.5 rounded border border-border bg-surface-2/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-ok-soft text-ok flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-sm">Cash</h3>
                  <p className="text-xs text-ink-soft">
                    {data.collection.cashCount} cash payments (in till)
                  </p>
                </div>
              </div>
              <span className="font-bold text-navy text-base tabular-nums">
                ₹{(data.collection.cashPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Card */}
            <div className="p-3.5 rounded border border-border bg-surface-2/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface-2 text-navy flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-sm">Card (POS Machine)</h3>
                  <p className="text-xs text-ink-soft">
                    {data.collection.cardCount} card payments swiped
                  </p>
                </div>
              </div>
              <span className="font-bold text-navy text-base tabular-nums">
                ₹{(data.collection.cardPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Gateway / UPI */}
            <div className="p-3.5 rounded border border-border bg-surface-2/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-info-soft text-info flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-sm">Online Gateway (UPI)</h3>
                  <p className="text-xs text-ink-soft">
                    {data.collection.gatewayCount} online website payments
                  </p>
                </div>
              </div>
              <span className="font-bold text-navy text-base tabular-nums">
                ₹{(data.collection.gatewayPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Still Owing Chase List */}
      <section className="p-6 rounded-lg bg-surface border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-soft">
              Still Owing Bookings ({data.stillOwingBookings.length})
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Customers who played or booked today without paying
            </p>
          </div>
          <span className="text-xs font-bold text-warn">
            Total Due: ₹{(data.totalStillOwingPaise / 100).toLocaleString('en-IN')}
          </span>
        </div>

        {data.stillOwingBookings.length === 0 ? (
          <div className="p-6 text-center text-xs text-ink-faint flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-ok" />
            <span>All walk-in bookings for today have been fully paid!</span>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {data.stillOwingBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 bg-surface hover:bg-surface-2/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-navy">{b.reference}</span>
                    <strong className="text-ink font-semibold">{b.customerName}</strong>
                    <span className="font-mono text-ink-faint">{b.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink-soft">
                    <MapPin className="w-3.5 h-3.5 text-ink-faint" />
                    <span>{b.courtName}</span>
                    <span>·</span>
                    <Clock className="w-3.5 h-3.5 text-ink-faint" />
                    <span>{b.timeLabel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-warn tabular-nums">
                      Due: ₹{(b.balanceDuePaise / 100).toLocaleString('en-IN')}
                    </span>
                    <p className="text-[10px] text-ink-faint">
                      of ₹{(b.amountPaise / 100).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <Link
                    href={`/admin/search?q=${b.reference}`}
                    className="px-3 py-1.5 rounded bg-navy text-white text-[11px] font-semibold hover:opacity-90 transition shadow-xs"
                  >
                    Take Payment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Cash Handover Terminal (DECLARED FIELD STARTS EMPTY) */}
      <section className="p-6 rounded-lg bg-surface border border-navy/40 ring-1 ring-navy/20 shadow-md space-y-6">
        <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Banknote className="w-5 h-5 text-gold" />
              <span>Shift Cash Handover</span>
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Count the physical cash in the till and declare your handover
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDenomHelper(!showDenomHelper)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold transition underline"
          >
            <Calculator className="w-4 h-4" />
            <span>{showDenomHelper ? 'Hide Denominations' : 'Count Denominations'}</span>
          </button>
        </div>

        {handoverSuccess && (
          <div className="p-3.5 rounded bg-ok-soft text-ok border border-ok/30 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Cash handover successfully signed off and recorded in audit log!</span>
          </div>
        )}

        {handoverError && (
          <div className="p-3.5 rounded bg-danger-soft text-danger border border-danger/30 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{handoverError}</span>
          </div>
        )}

        {/* Optional Fast Denomination Counter */}
        {showDenomHelper && (
          <div className="p-4 rounded-lg bg-surface-2 border border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
              Bill & Coin Denominations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[500, 200, 100, 50, 20, 10].map((d) => (
                <div key={d} className="space-y-1">
                  <label className="text-xs font-mono font-bold text-navy block">
                    ₹{d} notes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={denominations[d] || ''}
                    onChange={(e) =>
                      handleDenomChange(d, parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 rounded border border-border bg-surface text-ink text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Handover Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Expected Cash (Read-only reference) */}
          <div className="p-4 rounded border border-border bg-surface-2/50 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              Expected in Till
            </span>
            <div className="text-2xl font-bold text-navy tabular-nums">
              ₹{(data.expectedCashPaise / 100).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-ink-faint">Calculated from cash receipts</p>
          </div>

          {/* Declared Cash (MANDATORY STARTS EMPTY) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              Declared Physical Cash (₹) *
            </label>
            <div className="relative">
              <span className="text-sm font-bold text-ink-soft absolute left-3.5 top-2.5">
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder="Count till cash & type here..."
                value={declaredCashRupees}
                onChange={(e) => setDeclaredCashRupees(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2 rounded border border-border bg-surface text-ink text-sm font-mono font-bold focus:outline-hidden focus:border-navy"
              />
            </div>
            <p className="text-[11px] text-ink-faint">
              Starts empty to enforce physical till count
            </p>
          </div>

          {/* Variance Display */}
          <div className="p-4 rounded border border-border bg-surface-2/50 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              Variance Status
            </span>
            {variancePaise === null ? (
              <div className="text-sm font-semibold text-ink-faint pt-1">
                Awaiting declared count
              </div>
            ) : variancePaise === 0 ? (
              <div className="text-xl font-bold text-ok flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>Exact Match (₹0)</span>
              </div>
            ) : variancePaise < 0 ? (
              <div className="text-xl font-bold text-danger flex items-center gap-1.5 pt-0.5">
                <AlertTriangle className="w-5 h-5" />
                <span>Shortage: -₹{(Math.abs(variancePaise) / 100).toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div className="text-xl font-bold text-warn flex items-center gap-1.5 pt-0.5">
                <AlertTriangle className="w-5 h-5" />
                <span>Overage: +₹{(variancePaise / 100).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Variance Note (Mandatory if variance != 0) */}
        {variancePaise !== null && variancePaise !== 0 && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-danger">
              Mandatory Explanation Note for Variance *
            </label>
            <input
              type="text"
              placeholder="Explain cause of variance (e.g. Returned ₹100 change incorrectly, Petty cash used for ice)..."
              value={varianceNote}
              onChange={(e) => setVarianceNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded border border-danger/40 bg-surface text-ink text-xs focus:outline-hidden focus:border-danger"
            />
          </div>
        )}

        {/* Recipient & Submit */}
        <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-ink-soft shrink-0">
              Handover To:
            </label>
            <select
              value={acceptedByUserId}
              onChange={(e) => setAcceptedByUserId(e.target.value)}
              className="px-3 py-1.5 rounded border border-border bg-surface text-ink text-xs font-medium focus:outline-hidden focus:border-navy"
            >
              {data.activeStaffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmitHandover}
            disabled={isSubmittingHandover || declaredCashRupees === ''}
            className="py-2.5 px-6 rounded bg-navy text-white text-xs font-bold hover:opacity-90 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmittingHandover ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-gold" />
            )}
            <span>Sign Off Cash Handover</span>
          </button>
        </div>

        {/* Previous Handover Records for this date */}
        {data.handovers.length > 0 && (
          <div className="pt-4 border-t border-border space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
              Today&apos;s Handover Log ({data.handovers.length})
            </h3>
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden text-xs">
              {data.handovers.map((h) => (
                <div key={h.id} className="p-3 bg-surface-2/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-navy">{h.staffName}</span> handed over to{' '}
                    <span className="font-semibold text-ink">{h.acceptedByName || 'Manager'}</span>
                    {h.note && <p className="text-ink-soft text-[11px] mt-0.5">Note: {h.note}</p>}
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-navy">
                      Declared: ₹{(h.declaredPaise / 100).toLocaleString('en-IN')}
                    </span>
                    <div>
                      {h.variancePaise === 0 ? (
                        <span className="text-[10px] font-bold text-ok">No variance</span>
                      ) : (
                        <span className="text-[10px] font-bold text-danger">
                          Variance: {h.variancePaise > 0 ? '+' : ''}₹{(h.variancePaise / 100).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
