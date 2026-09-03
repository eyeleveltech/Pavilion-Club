'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Phone,
  ShieldCheck,
  X,
  Loader2,
  LogOut,
  ArrowRight,
} from 'lucide-react';

interface BookingRecord {
  id: string;
  reference: string;
  courtName: string;
  businessDate: string;
  timeLabel: string;
  amountRupees: number;
  paidRupees: number;
  isPaid: boolean;
  status: string;
  isCancellable: boolean;
  hoursUntilMatch: number;
}

interface CustomerProfile {
  id: string;
  name: string | null;
  phone: string;
}

interface MyBookingsViewProps {
  initialCustomer?: CustomerProfile | null;
  initialBookings?: BookingRecord[];
}

export function MyBookingsView({
  initialCustomer = null,
  initialBookings = [],
}: MyBookingsViewProps) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(initialCustomer);
  const [bookings, setBookings] = useState<BookingRecord[]>(initialBookings);

  // OTP Login State (for unauthenticated players)
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Cancellation State
  const [cancelTarget, setCancelTarget] = useState<BookingRecord | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 10) return;
    setIsSendingOtp(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/public/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setOtpSent(true);
        if (json.devCode) {
          setDevCode(json.devCode);
          setOtpCode(json.devCode);
        }
      } else {
        setLoginError(json.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setLoginError('Network error.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/public/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setCustomer(json.customer);
        // Refresh page to load customer's bookings
        window.location.reload();
      } else {
        setLoginError(json.error || 'Invalid OTP code.');
      }
    } catch (err) {
      setLoginError('Network error.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch('/api/public/my-bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: cancelTarget.id }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setCancelSuccess(true);
        setBookings((prev) =>
          prev.map((b) => (b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b))
        );
        setTimeout(() => {
          setCancelSuccess(false);
          setCancelTarget(null);
        }, 2000);
      } else {
        setCancelError(json.error || 'Failed to cancel booking.');
      }
    } catch (err) {
      setCancelError('Network error cancelling booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">
            My Bookings & Matches
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            View your upcoming sessions, past history, and manage cancellations
          </p>
        </div>

        {customer && (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-ink-soft">{customer.phone}</span>
            <button
              onClick={() => {
                document.cookie = 'pavilion_customer_session=; path=/; max-age=0;';
                window.location.reload();
              }}
              className="inline-flex items-center gap-1 text-ink-faint hover:text-danger transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Unauthenticated State: OTP Login Form */}
      {!customer ? (
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-surface border border-border shadow-xs text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-navy/10 text-navy flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6 text-gold" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-navy">Player Login</h2>
            <p className="text-xs text-ink-soft">
              Enter your mobile number to view and manage your reservations
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded bg-danger-soft text-danger border border-danger/30 text-xs font-semibold">
              {loginError}
            </div>
          )}

          <div className="space-y-4 text-xs text-left">
            <div>
              <label className="block font-semibold text-ink-soft mb-1">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-ink font-mono text-xs focus:border-navy"
                />
                <button
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || phone.trim().length < 10}
                  className="px-4 py-2 rounded-lg bg-navy text-white font-bold text-xs hover:opacity-90 transition disabled:opacity-40"
                >
                  {isSendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
            </div>

            {devCode && (
              <div className="p-2.5 rounded bg-ok-soft text-ok border border-ok/30 text-[11px] font-mono">
                Dev OTP: <strong>{devCode}</strong>
              </div>
            )}

            {otpSent && (
              <div className="space-y-2">
                <label className="block font-semibold text-ink-soft">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-ink font-mono text-center font-bold tracking-widest text-sm focus:border-navy"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoggingIn || !otpCode}
                  className="w-full py-2.5 rounded-lg bg-navy text-white font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-xs"
                >
                  {isLoggingIn && <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />}
                  <span>Access My Bookings</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. Authenticated State: Bookings List */
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-soft space-y-3 bg-surface border border-border rounded-xl">
              <p className="font-semibold text-navy text-sm">No bookings found</p>
              <p className="text-ink-faint">
                You haven&apos;t booked any badminton courts yet.
              </p>
              <div className="pt-2">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition"
                >
                  <span>Book a Court Now</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gold" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-xl bg-surface border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-navy text-sm">
                        {b.reference}
                      </span>
                      <span className="font-semibold text-ink">{b.courtName}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'confirmed'
                            ? 'bg-ok-soft text-ok'
                            : b.status === 'cancelled'
                            ? 'bg-danger-soft text-danger'
                            : 'bg-surface-2 text-ink-soft'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-ink-soft">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gold" />
                        <span>{b.businessDate}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gold" />
                        <span>{b.timeLabel}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="font-bold text-navy text-sm font-mono">
                        ₹{b.amountRupees}
                      </div>
                      <p className="text-[10px] text-ink-faint">
                        {b.isPaid ? 'Paid at counter' : 'Pay at venue'}
                      </p>
                    </div>

                    {b.status === 'confirmed' && (
                      <div>
                        {b.isCancellable ? (
                          <button
                            onClick={() => setCancelTarget(b)}
                            className="px-3 py-1.5 rounded border border-danger/30 text-danger font-semibold text-xs hover:bg-danger-soft transition"
                          >
                            Cancel Slot
                          </button>
                        ) : (
                          <span
                            className="text-[10px] text-ink-faint"
                            title="Cancellations are only allowed up to 24 hours before match time"
                          >
                            Past 24h cutoff
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Cancellation Confirmation Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">
                Cancel Booking {cancelTarget.reference}?
              </h3>
            </div>

            <p className="text-xs text-ink leading-relaxed">
              Are you sure you want to cancel your session on <strong>{cancelTarget.businessDate} ({cancelTarget.timeLabel})</strong>? Your reserved court will immediately be made available for other players.
            </p>

            <div className="p-3 bg-surface-2 rounded-lg border border-border text-[11px] text-ink-soft">
              Policy: Free cancellation is permitted as this match is more than 24 hours away.
            </div>

            {cancelError && (
              <div className="p-2.5 rounded bg-danger-soft text-danger text-xs font-semibold">
                {cancelError}
              </div>
            )}

            {cancelSuccess && (
              <div className="p-2.5 rounded bg-ok-soft text-ok text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Booking cancelled successfully.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isCancelling}
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-lg border border-border text-ink text-xs font-semibold hover:bg-surface-2"
              >
                Keep Booking
              </button>
              <button
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-lg bg-danger text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
              >
                {isCancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Cancel Booking</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
