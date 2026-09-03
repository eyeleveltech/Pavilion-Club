'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Save,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import type { CustomerDetailData } from '@pavilion/db';

interface CustomerDetailViewProps {
  initialData: CustomerDetailData;
}

export function CustomerDetailView({ initialData }: CustomerDetailViewProps) {
  const router = useRouter();
  const [data, setData] = useState<CustomerDetailData>(initialData);
  const [notes, setNotes] = useState(initialData.customer.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Block modal / action
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [isProcessingBlock, setIsProcessingBlock] = useState(false);

  const customer = data.customer;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setNotesSaved(false);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleBlock = async (shouldBlock: boolean) => {
    setIsProcessingBlock(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBlocked: shouldBlock,
          reason: shouldBlock ? blockReason.trim() : null,
        }),
      });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          customer: {
            ...prev.customer,
            isBlocked: shouldBlock,
            blockedReason: shouldBlock ? blockReason.trim() : null,
          },
        }));
        setShowBlockDialog(false);
        setBlockReason('');
      }
    } catch (err) {
      console.error('Failed to toggle block status:', err);
    } finally {
      setIsProcessingBlock(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-1.5 rounded border border-border hover:bg-surface-2 text-ink-soft transition"
            title="Back to Customers"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              {customer.name}
            </h1>
            <p className="text-xs text-ink-soft mt-0.5">
              Player profile & booking timeline
            </p>
          </div>
        </div>

        {/* Block / Unblock Button */}
        {customer.isBlocked ? (
          <button
            onClick={() => handleToggleBlock(false)}
            disabled={isProcessingBlock}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-ok text-white text-xs font-semibold hover:opacity-90 transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Unblock Player</span>
          </button>
        ) : (
          <button
            onClick={() => setShowBlockDialog(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-danger/40 bg-danger-soft/30 text-danger text-xs font-semibold hover:bg-danger-soft transition"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Block Player</span>
          </button>
        )}
      </div>

      {/* Block Warning Banner if Blocked */}
      {customer.isBlocked && (
        <div className="p-4 rounded-lg bg-danger-soft text-danger border border-danger/40 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Player is Currently Blocked
            </h3>
            <p className="text-xs text-ink mt-0.5">
              Reason: {customer.blockedReason || 'Blocked by reception staff'}. Front desk cannot take bookings for this customer until unblocked.
            </p>
          </div>
        </div>
      )}

      {/* Block Confirmation Dialog */}
      {showBlockDialog && (
        <div className="p-5 rounded-lg border border-danger/40 bg-surface shadow-md space-y-3">
          <div className="flex items-start gap-2 text-danger">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">
                Block {customer.name} from booking?
              </h4>
              <p className="text-xs text-ink mt-0.5">
                Staff will be prevented from taking walk-in bookings for this phone number.
              </p>
            </div>
          </div>

          <input
            type="text"
            placeholder="Reason for block (e.g. Repeated no-shows, Non-payment)"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="w-full px-3 py-2 rounded border border-border bg-surface text-ink text-xs focus:outline-hidden focus:border-danger"
          />

          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => setShowBlockDialog(false)}
              className="py-1.5 px-3 rounded border border-border text-xs text-ink-soft hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              disabled={isProcessingBlock}
              onClick={() => handleToggleBlock(true)}
              className="py-1.5 px-4 rounded bg-danger text-white text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5"
            >
              {isProcessingBlock && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Block</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded border border-border bg-surface shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            Total Bookings
          </span>
          <div className="text-2xl font-bold text-navy mt-1 tabular-nums">
            {customer.bookingCount}
          </div>
          <p className="text-[11px] text-ink-faint mt-1">Confirmed matches</p>
        </div>

        <div className="p-4 rounded border border-border bg-surface shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            Total Spent
          </span>
          <div className="text-2xl font-bold text-navy mt-1 tabular-nums">
            ₹{(customer.totalSpentPaise / 100).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-ink-faint mt-1">Lifetime venue revenue</p>
        </div>

        <div className="p-4 rounded border border-border bg-surface shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            No-Shows
          </span>
          <div className={`text-2xl font-bold mt-1 tabular-nums ${customer.noShowCount > 0 ? 'text-warn' : 'text-navy'}`}>
            {customer.noShowCount}
          </div>
          <p className="text-[11px] text-ink-faint mt-1">Missed sessions</p>
        </div>

        <div className="p-4 rounded border border-border bg-surface shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            Phone & Contact
          </span>
          <div className="text-sm font-bold font-mono text-navy mt-1">
            {customer.phone}
          </div>
          <p className="text-[11px] text-ink-faint mt-1 truncate">
            {customer.email || 'No email on file'}
          </p>
        </div>
      </div>

      {/* Internal Staff Notes */}
      <div className="p-5 rounded-lg border border-border bg-surface shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            Desk Staff Notes
          </h2>
          {notesSaved && (
            <span className="text-xs font-semibold text-ok flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Notes Saved
            </span>
          )}
        </div>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add internal notes about player preferences, playstyle, or warnings..."
          className="w-full p-3 rounded border border-border bg-surface text-ink text-xs focus:outline-hidden focus:border-navy transition"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            disabled={isSavingNotes}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-navy text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {isSavingNotes ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 text-gold" />
            )}
            <span>Save Notes</span>
          </button>
        </div>
      </div>

      {/* Match / Booking History Timeline */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold tracking-tight text-navy">
          Match History ({data.history.length})
        </h2>

        <div className="border border-border rounded-lg bg-surface shadow-xs overflow-hidden">
          {data.history.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-faint">
              No booking records found for this player.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.history.map((h) => (
                <div
                  key={h.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-navy">
                        {h.reference}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-2 text-ink uppercase">
                        {h.channelName}
                      </span>
                      <span className="text-ink font-semibold">
                        {h.courtName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-ink-soft">
                      <Clock className="w-3.5 h-3.5 text-ink-faint" />
                      <span>{h.dateFormatted} · {h.timeLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <span className="font-bold text-navy text-sm tabular-nums">
                      ₹{(h.amountPaise / 100).toLocaleString('en-IN')}
                    </span>
                    <div>
                      {h.isPaid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ok-soft text-ok">
                          PAID
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warn-soft text-warn">
                          UNPAID
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
