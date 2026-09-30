'use client';

import { useState, useMemo } from 'react';
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
  Sparkles,
  Ticket,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  User,
  Activity,
  History,
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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // OTP Login State (for unauthenticated players)
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Cancellation State
  const [cancelTarget, setCancelTarget] = useState<BookingRecord | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Split bookings into Upcoming and Past
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const upcoming: BookingRecord[] = [];
    const past: BookingRecord[] = [];

    bookings.forEach((b) => {
      // Upcoming: confirmed booking and match has not ended (> -1 hr)
      if (b.status === 'confirmed' && b.hoursUntilMatch >= -1) {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    });

    // Sort upcoming ascending (nearest first)
    upcoming.sort((a, b) => b.hoursUntilMatch - a.hoursUntilMatch);

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    document.cookie = 'pavilion_customer_session=; path=/; max-age=0;';
    window.location.href = '/my-bookings';
  };

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
        if (json.devOtp) {
          setDevOtp(json.devOtp);
          setOtpCode(json.devOtp);
        }
      } else {
        setLoginError(json.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setLoginError('Network error. Please try again.');
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
        window.location.reload();
      } else {
        setLoginError(json.error || 'Invalid verification code.');
      }
    } catch (err) {
      setLoginError('Network error. Please try again.');
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
        setTimeout(() => {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === cancelTarget.id ? { ...b, status: 'cancelled', isCancellable: false } : b
            )
          );
          setCancelTarget(null);
          setCancelSuccess(false);
        }, 1200);
      } else {
        setCancelError(json.error || 'Cancellation failed. Please check fair play policy.');
      }
    } catch (err) {
      setCancelError('Network error cancelling booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gold-text">
            Player Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mt-0.5">
            My Match Passes
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Access your reserved courts, view digital match passes, and manage bookings.
          </p>
        </div>

        {customer ? (
          <div className="flex items-center gap-3">
            <Link
              href="/book"
              className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span>Book Court</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold" />
            </Link>
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-ink-soft hover:text-danger text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          <Link
            href="/book"
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
          >
            <span>Book Court</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold" />
          </Link>
        )}
      </div>

      {!customer ? (
        /* 2. Unauthenticated State: OTP Login Card */
        <div className="max-w-md mx-auto p-6 sm:p-8 bg-surface border border-border/90 rounded-2xl shadow-sm space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-full bg-navy/5 text-navy flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6 text-gold" />
            </div>
            <h2 className="text-lg font-bold text-navy">Access Your Match Passes</h2>
            <p className="text-xs text-ink-soft">
              Enter your registered mobile number to receive a verification code and view all your court bookings.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-danger-soft text-danger border border-danger/20 flex items-start gap-2 text-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-soft">
                Mobile Number *
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface text-ink text-sm font-mono tracking-wider focus:border-navy focus:ring-1 focus:ring-navy outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || phone.trim().length < 10}
                  className="px-4 py-2.5 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy/90 transition disabled:opacity-40 whitespace-nowrap cursor-pointer active:scale-95"
                >
                  {isSendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in">
                {devOtp && (
                  <div className="p-2.5 rounded-xl bg-gold/10 border border-gold/40 text-navy flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span className="font-semibold text-ink-soft">Test Code:</span>
                      <span className="font-mono font-bold text-navy text-sm tracking-wider">{devOtp}</span>
                    </div>
                    <span className="text-[10px] font-bold text-navy bg-white px-2 py-0.5 rounded-full border border-gold/30">
                      Auto-filled
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-soft">
                    Enter 6-Digit Verification Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-ink font-mono text-center font-bold tracking-[0.3em] text-lg focus:border-navy focus:ring-1 focus:ring-navy outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isLoggingIn || otpCode.length < 6}
                  className="w-full py-3 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy/90 transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-xs cursor-pointer active:scale-98"
                >
                  {isLoggingIn && <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />}
                  <span>Access My Bookings</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. Authenticated State: Player Dashboard */
        <div className="space-y-6">
          {/* Player Profile & Quick Stats Banner */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-surface-2/90 via-surface to-surface-2/60 border border-border/90 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-navy text-white font-bold text-base flex items-center justify-center shadow-xs">
                {(customer.name || 'P')[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-navy text-base">
                    {customer.name || 'Pavilion Player'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-gold/15 text-navy font-bold text-[10px] border border-gold/30">
                    Verified Player
                  </span>
                </div>
                <div className="text-xs text-ink-soft font-mono flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-gold" />
                  <span>+91 {customer.phone.replace(/\D/g, '').slice(-10)}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/80">
              <div className="text-center sm:text-right">
                <div className="text-lg font-mono font-extrabold text-navy">
                  {upcomingBookings.length}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-ink-soft">
                  Upcoming
                </div>
              </div>
              <div className="h-7 w-[1px] bg-border" />
              <div className="text-center sm:text-right">
                <div className="text-lg font-mono font-extrabold text-navy">
                  {pastBookings.length}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-ink-soft">
                  Past Matches
                </div>
              </div>
              <div className="h-7 w-[1px] bg-border" />
              <div className="text-center sm:text-right">
                <div className="text-lg font-mono font-extrabold text-navy">
                  {bookings.length}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-ink-soft">
                  Total
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Filter Tabs: Upcoming vs Past */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-2 border border-border w-full sm:w-auto self-start">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-surface text-navy shadow-xs border border-border/80'
                  : 'text-ink-soft hover:text-navy'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-gold" />
              <span>Upcoming Matches</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'upcoming' ? 'bg-navy text-white' : 'bg-surface text-ink-soft'
              }`}>
                {upcomingBookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('past')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-surface text-navy shadow-xs border border-border/80'
                  : 'text-ink-soft hover:text-navy'
              }`}
            >
              <History className="w-3.5 h-3.5 text-gold" />
              <span>Match History</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'past' ? 'bg-navy text-white' : 'bg-surface text-ink-soft'
              }`}>
                {pastBookings.length}
              </span>
            </button>
          </div>

          {/* Tab 1: Upcoming Bookings */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <div className="p-10 sm:p-12 text-center text-xs text-ink-soft space-y-3 bg-surface border border-border rounded-2xl shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-navy/5 text-navy flex items-center justify-center mx-auto mb-2">
                    <Ticket className="w-6 h-6 text-gold" />
                  </div>
                  <p className="font-bold text-navy text-base">No upcoming matches scheduled</p>
                  <p className="text-ink-soft max-w-sm mx-auto text-xs">
                    You don't have any active court bookings coming up. Reserve a badminton court at The Pavilion Club now.
                  </p>
                  <div className="pt-3">
                    <Link
                      href="/book"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 transition shadow-xs active:scale-95"
                    >
                      <span>Book a Court Now</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gold" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {upcomingBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-5 rounded-2xl bg-surface border border-border/90 hover:border-gold/40 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs group"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-navy text-sm tracking-wide bg-surface-2 px-2.5 py-1 rounded-md border border-border/80">
                            {b.reference}
                          </span>
                          <span className="font-bold text-ink text-sm">
                            {b.courtName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-ok-soft text-ok border border-ok/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
                            <span>Confirmed</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-ink-soft text-xs">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                            <span className="font-medium text-ink">{b.businessDate}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                            <span className="font-medium text-ink">{b.timeLabel}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono font-bold text-navy">
                            ₹{b.amountRupees}
                          </span>
                          <span className="text-[10px] text-ink-faint">
                            ({b.isPaid ? 'Paid' : 'Pay at Venue'})
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                        {/* View Match Pass Link */}
                        <Link
                          href={`/book/${b.reference}`}
                          className="px-3.5 py-2 rounded-xl bg-navy/5 hover:bg-navy text-navy hover:text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs group-hover:bg-navy group-hover:text-white"
                        >
                          <Ticket className="w-3.5 h-3.5 text-gold" />
                          <span>View Match Pass</span>
                          <ChevronRight className="w-3 h-3 opacity-60" />
                        </Link>

                        {/* Cancel Slot Button */}
                        {b.isCancellable && (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(b)}
                            className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-700 font-semibold text-xs hover:bg-rose-100 active:scale-95 transition shadow-2xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Past Match History */}
          {activeTab === 'past' && (
            <div className="space-y-4">
              {pastBookings.length === 0 ? (
                <div className="p-10 sm:p-12 text-center text-xs text-ink-soft space-y-2 bg-surface border border-border rounded-2xl shadow-xs">
                  <p className="font-bold text-navy text-sm">No past matches recorded</p>
                  <p className="text-ink-soft text-xs">
                    Your completed or cancelled bookings will be archived here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {pastBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 sm:p-5 rounded-2xl bg-surface border border-border/80 opacity-90 hover:opacity-100 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-ink-soft text-xs">
                            {b.reference}
                          </span>
                          <span className="font-semibold text-ink">{b.courtName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.status === 'completed'
                                ? 'bg-surface-2 text-ink-soft'
                                : b.status === 'cancelled'
                                ? 'bg-danger-soft text-danger'
                                : 'bg-surface-2 text-ink-soft'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-ink-soft text-[11px]">
                          <span>{b.businessDate}</span>
                          <span>•</span>
                          <span>{b.timeLabel}</span>
                          <span>•</span>
                          <span className="font-mono font-semibold text-navy">
                            ₹{b.amountRupees}
                          </span>
                        </div>
                      </div>

                      {/* Quick Links */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                        <Link
                          href={`/book/${b.reference}`}
                          className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-2 text-ink font-semibold text-[11px] transition flex items-center gap-1"
                        >
                          <Ticket className="w-3 h-3 text-gold" />
                          <span>View Details</span>
                        </Link>
                        <Link
                          href="/book"
                          className="px-3 py-1.5 rounded-lg bg-navy/5 hover:bg-navy/10 text-navy font-bold text-[11px] transition flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3 text-gold" />
                          <span>Book Again</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Cancellation Confirmation Modal */}
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

            <div className="p-3 bg-surface-2 rounded-xl border border-border text-[11px] text-ink-soft">
              Policy: {cancelTarget.hoursUntilMatch >= 2 ? "100% Free cancellation per Fair Play Policy (> 2 hours before match)." : "Late cancellation (< 2 hours before match). Slot will be immediately released."}
            </div>

            {cancelError && (
              <div className="p-2.5 rounded-xl bg-danger-soft text-danger text-xs font-semibold">
                {cancelError}
              </div>
            )}

            {cancelSuccess && (
              <div className="p-2.5 rounded-xl bg-ok-soft text-ok text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Booking cancelled successfully.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-xl border border-border text-ink text-xs font-semibold hover:bg-surface-2 cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-danger text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer"
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
