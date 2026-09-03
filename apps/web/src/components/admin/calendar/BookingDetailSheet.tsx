'use client';

import { useState } from 'react';
import {
  X,
  User,
  Phone,
  Clock,
  MapPin,
  CreditCard,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import type { DaySlotBooking } from '@pavilion/db';

interface BookingDetailSheetProps {
  booking: DaySlotBooking | null;
  courtName: string;
  timeLabel: string;
  dateFormatted: string;
  onClose: () => void;
  onActionComplete: () => void;
}

export function BookingDetailSheet({
  booking,
  courtName,
  timeLabel,
  dateFormatted,
  onClose,
  onActionComplete,
}: BookingDetailSheetProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!booking) return null;

  const handleTakePayment = async (method: 'cash' | 'card') => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/calendar/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amountPaise: booking.amountPaise,
          method,
        }),
      });
      if (res.ok) {
        onActionComplete();
        onClose();
      } else {
        setErrorMessage('Failed to record payment');
      }
    } catch {
      setErrorMessage('Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (booking.isPartner && !cancelReason.trim()) {
      setErrorMessage('Reason is required for partner cancellations.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/calendar/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          isPartner: booking.isPartner,
          reason: cancelReason.trim() || 'Desk cancellation',
        }),
      });
      if (res.ok) {
        onActionComplete();
        onClose();
      } else {
        const json = await res.json();
        setErrorMessage(json.error || 'Failed to cancel booking');
      }
    } catch {
      setErrorMessage('Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/40 backdrop-blur-xs transition-opacity">
      {/* Slide-over Container */}
      <div className="w-full max-w-md bg-surface h-full shadow-2xl border-l border-border flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-ink-soft">
              Booking Details
            </span>
            <h2 className="text-xl font-mono font-bold text-navy">
              {booking.reference}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-surface-2 text-ink-soft hover:text-ink transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 rounded bg-danger-soft text-danger border border-danger/30 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Slot Information */}
          <div className="p-4 rounded border border-border bg-surface-2/40 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-ink">
              <MapPin className="w-3.5 h-3.5 text-ink-soft" />
              <strong className="text-navy">{courtName}</strong>
            </div>
            <div className="flex items-center gap-2 text-ink-soft">
              <Clock className="w-3.5 h-3.5" />
              <span>{dateFormatted} · {timeLabel}</span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
              Customer
            </h3>
            <div className="p-4 rounded border border-border bg-surface space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-ink-soft" />
                <span className="font-semibold text-navy text-sm">
                  {booking.customerName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-ink-soft font-mono">
                <Phone className="w-3.5 h-3.5 text-ink-faint" />
                <span>{booking.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Financial & Channel */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
              Payment & Channel
            </h3>
            <div className="p-4 rounded border border-border bg-surface space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Channel</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-navy/10 text-navy uppercase">
                  {booking.channelName}
                </span>
              </div>

              {booking.partnerReference && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">Partner Ref</span>
                  <span className="font-mono text-ink font-semibold">
                    {booking.partnerReference}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Amount</span>
                <span className="text-base font-bold text-navy tabular-nums">
                  ₹{(booking.amountPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-ink-soft">Status</span>
                {booking.isPaid ? (
                  <span className="inline-flex items-center gap-1 font-bold text-ok">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PAID
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-warn animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    UNPAID (Desk to Collect)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action: Take Payment if Unpaid */}
          {!booking.isPaid && !booking.isPartner && (
            <div className="p-4 rounded border border-warn/40 bg-warn-soft/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-warn">
                <AlertTriangle className="w-4 h-4" />
                <span>Collect Balance at Counter</span>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={isProcessing}
                  onClick={() => handleTakePayment('cash')}
                  className="flex-1 py-2 px-3 rounded bg-navy text-white text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5"
                >
                  <Banknote className="w-3.5 h-3.5 text-gold" />
                  <span>Receive Cash</span>
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleTakePayment('card')}
                  className="flex-1 py-2 px-3 rounded border border-border bg-surface text-navy text-xs font-semibold hover:bg-surface-2 transition flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Card POS</span>
                </button>
              </div>
            </div>
          )}

          {/* Turf Town Warning Dialog */}
          {showCancelDialog && (
            <div className="p-4 rounded border border-danger/40 bg-danger-soft/20 space-y-3 text-xs">
              <div className="flex items-start gap-2 text-danger">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="font-bold">
                    {booking.isPartner
                      ? 'Warning: Turf Town Partner Booking'
                      : 'Confirm Cancellation'}
                  </h4>
                  {booking.isPartner ? (
                    <p className="mt-1 text-ink leading-relaxed">
                      Cancelling here frees the court but does <strong>NOT</strong> refund the customer.
                      They must cancel in the Turf Town app to receive their refund.
                    </p>
                  ) : (
                    <p className="mt-1 text-ink">
                      This will free the slot immediately on the calendar.
                    </p>
                  )}
                </div>
              </div>

              {booking.isPartner && (
                <input
                  type="text"
                  placeholder="Mandatory cancellation reason (e.g. Rain, Net Repair)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-border bg-surface text-ink text-xs"
                />
              )}

              <div className="flex gap-2 pt-1">
                <button
                  disabled={isProcessing}
                  onClick={handleCancelBooking}
                  className="py-2 px-3 rounded bg-danger text-white font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Cancel Anyway</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => setShowCancelDialog(false)}
                  className="py-2 px-3 rounded border border-border text-ink text-xs font-medium hover:bg-surface-2 transition"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border bg-surface-2/30 flex items-center justify-between">
          {!showCancelDialog && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="text-xs font-semibold text-danger hover:underline transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel Booking</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-2 px-4 rounded border border-border bg-surface text-ink text-xs font-medium hover:bg-surface-2 transition ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
