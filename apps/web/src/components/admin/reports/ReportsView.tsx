'use client';

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Building2,
} from 'lucide-react';

interface SourceRow {
  channelId: string;
  channelName: string;
  kind: string;
  settlesLater: boolean;
  commissionBps: number;
  bookingsCount: number;
  hoursCount: number;
  bookedPaise: number;
  collectedPaise: number;
  commissionPaise: number;
  netOwedPaise: number;
  settlementStatus: string;
}

interface SettlementItem {
  id: string;
  channelName: string;
  periodStart: string;
  periodEnd: string;
  bookingCount: number;
  grossPaise: number;
  commissionPaise: number;
  netPaise: number;
  status: string;
  invoicedAt: string;
  settledAt: string | null;
}

export function ReportsView() {
  const [activeTab, setActiveTab] = useState<'source' | 'settlements' | 'demand' | 'occupancy'>('source');

  // Date filters
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const [fromDate, setFromDate] = useState(`${year}-${month}-01`);
  const [toDate, setToDate] = useState(`${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`);

  // Data states
  const [sourceRows, setSourceRows] = useState<SourceRow[]>([]);
  const [sourceTotals, setSourceTotals] = useState<any>(null);
  const [settlementsList, setSettlementsList] = useState<SettlementItem[]>([]);
  const [demandReasons, setDemandReasons] = useState<{ reason: string; count: number }[]>([]);
  const [occupancyList, setOccupancyList] = useState<{ courtName: string; totalBookings: number; totalHours: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load report data
  const loadReports = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'source') {
        const res = await fetch(`/api/admin/reports/source?from=${fromDate}&to=${toDate}`);
        const json = await res.json();
        if (json.ok) {
          setSourceRows(json.rows);
          setSourceTotals(json.totals);
        }
      } else if (activeTab === 'settlements') {
        const res = await fetch('/api/admin/reports/settlements');
        const json = await res.json();
        if (json.ok) setSettlementsList(json.settlements);
      } else if (activeTab === 'demand') {
        const res = await fetch(`/api/admin/reports/demand?from=${fromDate}&to=${toDate}`);
        const json = await res.json();
        if (json.ok) setDemandReasons(json.reasons);
      } else if (activeTab === 'occupancy') {
        const res = await fetch(`/api/admin/reports/occupancy?from=${fromDate}&to=${toDate}`);
        const json = await res.json();
        if (json.ok) setOccupancyList(json.courts);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [activeTab, fromDate, toDate]);

  // Handle Mark Settled
  const handleSettle = async (settlementId: string, amountPaise: number) => {
    try {
      const res = await fetch('/api/admin/reports/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settle',
          settlementId,
          settledAmountPaise: amountPaise,
          note: 'Marked settled by manager',
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setActionSuccess('Settlement marked as settled & payments ledger updated!');
        setTimeout(() => setActionSuccess(null), 3000);
        loadReports();
      }
    } catch (err) {
      console.error('Settle error:', err);
    }
  };

  const exportUrl = `/api/admin/reports/source/export?from=${fromDate}&to=${toDate}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            Financial Reports & Partner Settlements
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Source-wise revenue breakdown, Turf Town settlement reconciliation, and demand analytics
          </p>
        </div>

        {/* Excel Export Button */}
        {activeTab === 'source' && (
          <a
            href={exportUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-gold" />
            <span>Export Excel (.xlsx)</span>
          </a>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-ok-soft text-ok border border-ok/30 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Date Range Bar */}
      <div className="p-4 rounded-xl bg-surface border border-border flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-ink-soft flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gold" />
            <span>Period:</span>
          </span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-border bg-surface text-ink text-xs font-mono"
          />
          <span className="text-ink-faint">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-border bg-surface text-ink text-xs font-mono"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('source')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'source'
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Source Revenue
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'settlements'
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Partner Settlements
          </button>
          <button
            onClick={() => setActiveTab('demand')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'demand'
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Missed Demand
          </button>
          <button
            onClick={() => setActiveTab('occupancy')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'occupancy'
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Occupancy
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-xs text-ink-faint flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-navy" />
          <span>Calculating report metrics...</span>
        </div>
      ) : activeTab === 'source' ? (
        /* TAB 1: Source-wise Report */
        <div className="space-y-6">
          {/* Summary Metric Tiles */}
          {sourceTotals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-surface border border-border shadow-xs">
                <span className="text-[11px] font-semibold text-ink-soft">Total Bookings</span>
                <div className="text-xl font-bold text-navy mt-1 font-mono">
                  {sourceTotals.bookingsCount}
                </div>
                <span className="text-[10px] text-ink-faint">{sourceTotals.hoursCount} court hours</span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border shadow-xs">
                <span className="text-[11px] font-semibold text-ink-soft">Booked Value</span>
                <div className="text-xl font-bold text-navy mt-1 font-mono">
                  ₹{(sourceTotals.bookedPaise / 100).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-ink-faint">Gross sales across channels</span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border shadow-xs">
                <span className="text-[11px] font-semibold text-ink-soft">Collected in Till</span>
                <div className="text-xl font-bold text-ok mt-1 font-mono">
                  ₹{(sourceTotals.collectedPaise / 100).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-ink-faint">Immediate desk collections</span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border shadow-xs">
                <span className="text-[11px] font-semibold text-ink-soft">Net Owed by Partners</span>
                <div className="text-xl font-bold text-warn mt-1 font-mono">
                  ₹{(sourceTotals.netOwedPaise / 100).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-ink-faint">Turf Town receivable balance</span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2 border-b border-border text-ink-soft uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Channel / Source</th>
                    <th className="py-3 px-4 text-center">Bookings</th>
                    <th className="py-3 px-4 text-center">Hours</th>
                    <th className="py-3 px-4 text-right">Booked Value</th>
                    <th className="py-3 px-4 text-right">Collected</th>
                    <th className="py-3 px-4 text-right">Commission</th>
                    <th className="py-3 px-4 text-right">Net Owed to Us</th>
                    <th className="py-3 px-4 text-center">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sourceRows.map((r) => (
                    <tr key={r.channelId} className="hover:bg-surface-2/40">
                      <td className="py-3 px-4 font-bold text-navy">
                        {r.channelName}
                        {r.settlesLater && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-gold/20 text-gold font-normal">
                            {(r.commissionBps / 100).toFixed(0)}% commission
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{r.bookingsCount}</td>
                      <td className="py-3 px-4 text-center font-mono">{r.hoursCount}h</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ₹{(r.bookedPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-ok">
                        ₹{(r.collectedPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-ink-soft">
                        {r.commissionPaise > 0 ? `₹${(r.commissionPaise / 100).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-navy">
                        {r.netOwedPaise > 0 ? `₹${(r.netOwedPaise / 100).toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.settlementStatus === 'settled'
                              ? 'bg-ok-soft text-ok'
                              : r.settlementStatus === 'pending'
                              ? 'bg-warn-soft text-warn'
                              : 'bg-surface-2 text-ink-soft'
                          }`}
                        >
                          {r.settlementStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'settlements' ? (
        /* TAB 2: Settlements Management */
        <div className="space-y-4">
          <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-b border-border text-ink-soft uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4 text-center">Matches</th>
                  <th className="py-3 px-4 text-right">Gross Sold</th>
                  <th className="py-3 px-4 text-right">Commission</th>
                  <th className="py-3 px-4 text-right">Net Receivable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {settlementsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-ink-faint">
                      No partner settlement invoices created yet.
                    </td>
                  </tr>
                ) : (
                  settlementsList.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-2/40">
                      <td className="py-3 px-4 font-bold text-navy">{s.channelName}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {s.periodStart} to {s.periodEnd}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{s.bookingCount}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        ₹{(s.grossPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-ink-soft">
                        ₹{(s.commissionPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-navy">
                        ₹{(s.netPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.status === 'settled'
                              ? 'bg-ok-soft text-ok'
                              : s.status === 'written_off'
                              ? 'bg-danger-soft text-danger'
                              : 'bg-warn-soft text-warn'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.status !== 'settled' && s.status !== 'written_off' && (
                          <button
                            onClick={() => handleSettle(s.id, s.netPaise)}
                            className="px-2.5 py-1 rounded bg-navy text-white font-bold text-[11px] hover:opacity-90 shadow-xs"
                          >
                            Mark Settled
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'demand' ? (
        /* TAB 3: Missed Demand */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <h3 className="font-bold text-navy text-sm mb-1">
              Missed Demand & Turn-Away Reasons
            </h3>
            <p className="text-xs text-ink-soft mb-4">
              Requests received when courts were fully booked or blocked
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {demandReasons.map((d) => (
                <div key={d.reason} className="p-4 rounded-lg bg-surface-2 border border-border">
                  <span className="text-[11px] font-mono text-ink-soft uppercase">{d.reason}</span>
                  <div className="text-2xl font-bold text-navy mt-1 font-mono">{d.count}</div>
                  <span className="text-[10px] text-ink-faint">unmet booking attempts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 4: Occupancy */
        <div className="space-y-4">
          <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-b border-border text-ink-soft uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Court</th>
                  <th className="py-3 px-4 text-center">Confirmed Matches</th>
                  <th className="py-3 px-4 text-center">Utilized Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {occupancyList.map((c) => (
                  <tr key={c.courtName} className="hover:bg-surface-2/40">
                    <td className="py-3 px-4 font-bold text-navy">{c.courtName}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">{c.totalBookings}</td>
                    <td className="py-3 px-4 text-center font-mono">{c.totalHours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
