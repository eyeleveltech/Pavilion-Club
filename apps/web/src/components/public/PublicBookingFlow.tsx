'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunrise,
  Moon,
  ArrowRight,
  Loader2,
  X,
  Phone,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { PublicDaySlotItem, PublicMonthDayAvailability } from '@pavilion/db';

interface PublicBookingFlowProps {
  initialDate: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function PublicBookingFlow({ initialDate }: PublicBookingFlowProps) {
  const router = useRouter();

  // Date selection state
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentYear, setCurrentYear] = useState(() => parseInt(initialDate.split('-')[0]!, 10));
  const [currentMonth, setCurrentMonth] = useState(() => parseInt(initialDate.split('-')[1]!, 10));

  // Data states
  const [monthDays, setMonthDays] = useState<PublicMonthDayAvailability[]>([]);
  const [daySlots, setDaySlots] = useState<PublicDaySlotItem[]>([]);
  const [allCourts, setAllCourts] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Selected Slots State
  const [selectedSlotTimes, setSelectedSlotTimes] = useState<string[]>([]); // startsAt ISOs
  const [overrideCourtId, setOverrideCourtId] = useState<string | null>(null);

  // Hold State (10-minute timer)
  const [holdReference, setHoldReference] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isCreatingHold, setIsCreatingHold] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // 1. Fetch Month Availability
  useEffect(() => {
    async function loadMonth() {
      setIsLoadingMonth(true);
      try {
        const res = await fetch(`/api/public/month?year=${currentYear}&month=${currentMonth}`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok) setMonthDays(json.days);
        }
      } catch (err) {
        console.error('Failed to load month:', err);
      } finally {
        setIsLoadingMonth(false);
      }
    }
    loadMonth();
  }, [currentYear, currentMonth]);

  // 2. Fetch Day Slots when selectedDate changes
  useEffect(() => {
    async function loadSlots() {
      setIsLoadingSlots(true);
      setSelectedSlotTimes([]);
      setOverrideCourtId(null);
      try {
        const res = await fetch(`/api/public/slots?date=${selectedDate}`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok) {
            setDaySlots(json.slots);
            setAllCourts(json.allCourts);
          }
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedDate]);

  // 3. Countdown timer effect
  useEffect(() => {
    if (!holdExpiresAt) return;
    const interval = setInterval(() => {
      const diffSec = Math.max(0, Math.floor((holdExpiresAt.getTime() - Date.now()) / 1000));
      setSecondsRemaining(diffSec);
      if (diffSec <= 0) {
        setHoldReference(null);
        setHoldExpiresAt(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  // Slot toggle (single or consecutive merge)
  const handleSlotToggle = (slot: PublicDaySlotItem) => {
    if (!slot.isAvailable) return;

    if (selectedSlotTimes.includes(slot.startsAt)) {
      setSelectedSlotTimes(selectedSlotTimes.filter((t) => t !== slot.startsAt));
    } else {
      // In this version, player can select consecutive slots or single slot
      setSelectedSlotTimes([slot.startsAt]);
    }
  };

  const selectedSlots = daySlots.filter((s) => selectedSlotTimes.includes(s.startsAt));
  const totalAmountRupees = selectedSlots.reduce((acc, s) => acc + s.priceRupees, 0);
  const totalAmountPaise = totalAmountRupees * 100;

  // Selected Court determination
  const defaultCourt = selectedSlots[0]
    ? selectedSlots[0].availableCourts[0]
    : allCourts[0];
  const assignedCourt = overrideCourtId
    ? allCourts.find((c) => c.id === overrideCourtId) || defaultCourt
    : defaultCourt;

  // Start Hold Reservation
  const handleProceedToHold = async () => {
    if (selectedSlots.length === 0 || !assignedCourt) return;
    setIsCreatingHold(true);
    setBookingError(null);

    const firstSlot = selectedSlots[0]!;
    const lastSlot = selectedSlots[selectedSlots.length - 1]!;

    try {
      const res = await fetch('/api/public/book/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: assignedCourt.id,
          startsAt: firstSlot.startsAt,
          endsAt: lastSlot.endsAt,
          pricePaise: totalAmountPaise,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setHoldReference(json.reference);
        const exp = new Date(json.expiresAt);
        setHoldExpiresAt(exp);
        setSecondsRemaining(Math.floor((exp.getTime() - Date.now()) / 1000));
        setShowOtpModal(true);
      } else {
        setBookingError(json.error || 'Failed to hold slot. Please try another slot.');
      }
    } catch (err) {
      console.error('Hold error:', err);
      setBookingError('Network error. Please try again.');
    } finally {
      setIsCreatingHold(false);
    }
  };

  // OTP Send
  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 10) return;
    setIsSendingOtp(true);
    setBookingError(null);

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
          setOtpCode(json.devCode); // auto-fill dev code for seamless testing
        }
      } else {
        setBookingError(json.error || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('OTP error:', err);
      setBookingError('Network error sending OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // OTP Verify and Confirm Pay At Venue
  const handleVerifyAndConfirm = async () => {
    if (!otpCode || !holdReference) return;
    setIsVerifyingOtp(true);
    setBookingError(null);

    try {
      // 1. Verify OTP
      const otpRes = await fetch('/api/public/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode, name }),
      });
      const otpJson = await otpRes.json();

      if (!otpRes.ok || !otpJson.ok) {
        setBookingError(otpJson.error || 'Invalid OTP code.');
        setIsVerifyingOtp(false);
        return;
      }

      // 2. Confirm Booking on Pay at Venue
      const confirmRes = await fetch('/api/public/book/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: holdReference,
          phone,
          name,
        }),
      });
      const confirmJson = await confirmRes.json();

      if (confirmRes.ok && confirmJson.ok) {
        router.push(`/book/${holdReference}`);
      } else {
        setBookingError(confirmJson.error || 'Failed to confirm booking.');
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      setBookingError('Network error confirming booking.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-8 pb-32">
      {/* 1. Page Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">
          Select Date & Time
        </h1>
        <p className="text-xs text-ink-soft mt-0.5">
          Step 1: Pick a date · Step 2: Choose slot · Step 3: Confirm with mobile OTP
        </p>
      </div>

      {/* Active Hold Banner if in progress */}
      {holdReference && secondsRemaining !== null && secondsRemaining > 0 && (
        <div className="p-4 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-between gap-4 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-navy shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-navy">Slot Held for You:</span>{' '}
              <span className="text-ink">
                {assignedCourt?.name} on {selectedDate} ({selectedSlots[0]?.timeLabel})
              </span>
            </div>
          </div>
          <div className="font-mono font-bold text-navy text-sm tabular-nums shrink-0">
            ⏱️ {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
          </div>
        </div>
      )}

      {bookingError && (
        <div className="p-4 rounded-lg bg-danger-soft text-danger border border-danger/30 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{bookingError}</span>
        </div>
      )}

      {/* 2. Step 1: Month Calendar with Availability Dots */}
      <section className="p-6 rounded-2xl bg-surface border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-bold tracking-tight text-navy">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h2>
          </div>

          {/* Month Steppers */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded border border-border hover:bg-surface-2 text-ink-soft hover:text-ink transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded border border-border hover:bg-surface-2 text-ink-soft hover:text-ink transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-ink-soft pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ok" />
            <span>Available</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warn" />
            <span>Filling fast</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-border" />
            <span>Sold out / Past</span>
          </span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-[11px] font-bold text-ink-faint py-1">
              {d}
            </div>
          ))}

          {/* Padding for first day of week */}
          {monthDays.length > 0 &&
            Array.from({ length: monthDays[0]!.weekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12" />
            ))}

          {monthDays.map((d) => {
            const isSelected = d.date === selectedDate;
            const isPast = d.status === 'past';
            const isSoldOut = d.status === 'sold_out';

            return (
              <button
                key={d.date}
                disabled={isPast || isSoldOut}
                onClick={() => setSelectedDate(d.date)}
                className={`h-12 sm:h-14 rounded-lg flex flex-col items-center justify-center relative transition ${
                  isSelected
                    ? 'bg-navy text-white font-bold shadow-sm'
                    : isPast || isSoldOut
                    ? 'opacity-30 cursor-not-allowed bg-surface-2/40 text-ink-faint'
                    : 'hover:bg-surface-2 bg-surface text-ink border border-border/60'
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold">{d.dayOfMonth}</span>

                {/* Dot */}
                {!isPast && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isSelected
                        ? 'bg-gold'
                        : d.status === 'free'
                        ? 'bg-ok'
                        : d.status === 'filling'
                        ? 'bg-warn'
                        : 'bg-border'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Step 2: Slot Grid (Morning / Afternoon / Evening) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-navy">
              Available Slots for {selectedDate}
            </h2>
            <p className="text-xs text-ink-soft">
              Select your match time · Best court is automatically assigned
            </p>
          </div>

          {/* Auto Court Display & Change Switcher */}
          {assignedCourt && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-ink-soft">Allocated:</span>
              <select
                value={overrideCourtId || assignedCourt.id}
                onChange={(e) => setOverrideCourtId(e.target.value)}
                className="px-2.5 py-1 rounded border border-border bg-surface text-navy font-bold text-xs"
              >
                {allCourts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isLoadingSlots ? (
          <div className="p-12 text-center text-xs text-ink-faint flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-navy" />
            <span>Checking court schedule...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Morning */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
                <Sunrise className="w-4 h-4 text-gold" />
                <span>Morning Sessions (06:00 AM – 12:00 PM)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {daySlots
                  .filter((s) => s.period === 'morning')
                  .map((slot) => {
                    const isSelected = selectedSlotTimes.includes(slot.startsAt);
                    return (
                      <button
                        key={slot.startsAt}
                        disabled={!slot.isAvailable}
                        onClick={() => handleSlotToggle(slot)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-navy text-white border-navy ring-2 ring-navy/20 shadow-md'
                            : !slot.isAvailable
                            ? 'opacity-35 cursor-not-allowed bg-surface-2 border-border text-ink-faint'
                            : 'bg-surface border-border hover:border-navy hover:bg-surface-2 text-ink'
                        }`}
                      >
                        <div className="text-xs font-bold font-mono">{slot.timeLabel}</div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className={isSelected ? 'text-gold font-bold' : 'text-navy font-bold'}>
                            ₹{slot.priceRupees}
                          </span>
                          <span className="text-[10px] opacity-75">
                            {slot.isAvailable ? slot.availableCourts.length + ' courts free' : 'Booked'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Afternoon */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
                <Sun className="w-4 h-4 text-gold" />
                <span>Afternoon Sessions (12:00 PM – 05:00 PM)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {daySlots
                  .filter((s) => s.period === 'afternoon')
                  .map((slot) => {
                    const isSelected = selectedSlotTimes.includes(slot.startsAt);
                    return (
                      <button
                        key={slot.startsAt}
                        disabled={!slot.isAvailable}
                        onClick={() => handleSlotToggle(slot)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-navy text-white border-navy ring-2 ring-navy/20 shadow-md'
                            : !slot.isAvailable
                            ? 'opacity-35 cursor-not-allowed bg-surface-2 border-border text-ink-faint'
                            : 'bg-surface border-border hover:border-navy hover:bg-surface-2 text-ink'
                        }`}
                      >
                        <div className="text-xs font-bold font-mono">{slot.timeLabel}</div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className={isSelected ? 'text-gold font-bold' : 'text-navy font-bold'}>
                            ₹{slot.priceRupees}
                          </span>
                          <span className="text-[10px] opacity-75">
                            {slot.isAvailable ? slot.availableCourts.length + ' courts free' : 'Booked'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Evening */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
                <Moon className="w-4 h-4 text-gold" />
                <span>Evening & Prime Sessions (05:00 PM – 11:00 PM)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {daySlots
                  .filter((s) => s.period === 'evening')
                  .map((slot) => {
                    const isSelected = selectedSlotTimes.includes(slot.startsAt);
                    return (
                      <button
                        key={slot.startsAt}
                        disabled={!slot.isAvailable}
                        onClick={() => handleSlotToggle(slot)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-navy text-white border-navy ring-2 ring-navy/20 shadow-md'
                            : !slot.isAvailable
                            ? 'opacity-35 cursor-not-allowed bg-surface-2 border-border text-ink-faint'
                            : 'bg-surface border-border hover:border-navy hover:bg-surface-2 text-ink'
                        }`}
                      >
                        <div className="text-xs font-bold font-mono">{slot.timeLabel}</div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className={isSelected ? 'text-gold font-bold' : 'text-navy font-bold'}>
                            ₹{slot.priceRupees}
                          </span>
                          <span className="text-[10px] opacity-75">
                            {slot.isAvailable ? slot.availableCourts.length + ' courts free' : 'Booked'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Sticky Summary Bar (Accessible one-handed at 360px on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border shadow-2xl p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-navy">
                {selectedSlots.length > 0 ? selectedSlots[0]!.timeLabel : 'Select a slot'}
              </span>
              {assignedCourt && selectedSlots.length > 0 && (
                <span className="text-ink-soft font-medium">· {assignedCourt.name}</span>
              )}
            </div>
            <div className="text-lg sm:text-xl font-bold text-navy font-mono">
              ₹{totalAmountRupees.toLocaleString('en-IN')}{' '}
              <span className="text-xs text-ink-soft font-sans font-normal">
                {selectedSlots.length > 0 ? '(Pay at Venue)' : ''}
              </span>
            </div>
          </div>

          <button
            disabled={selectedSlots.length === 0 || isCreatingHold}
            onClick={handleProceedToHold}
            className="px-6 py-3 rounded-lg bg-navy text-white font-bold text-xs hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-sm"
          >
            {isCreatingHold ? (
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
            ) : (
              <>
                <span>Continue to Book</span>
                <ArrowRight className="w-4 h-4 text-gold" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Mobile Phone + OTP Modal (Mandatory in pay_at_venue) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-bold tracking-tight text-navy">
                  Player Mobile Verification
                </h3>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="p-1 rounded text-ink-faint hover:text-ink hover:bg-surface-2 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-soft mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-ink text-xs focus:border-navy"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-soft mb-1">
                  Mobile Number (10 Digits) *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="text-xs font-mono font-bold text-ink-soft absolute left-3 top-2.5">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-3 py-2 rounded-lg border border-border bg-surface text-ink font-mono text-xs focus:border-navy"
                    />
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || phone.trim().length < 10}
                    className="px-4 py-2 rounded-lg bg-surface-2 border border-border text-navy font-bold text-xs hover:bg-surface transition disabled:opacity-50"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : otpSent ? (
                      'Resend'
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </div>
              </div>

              {/* Dev Code Helper for Seamless Local Testing */}
              {devCode && (
                <div className="p-2.5 rounded bg-ok-soft text-ok border border-ok/30 text-[11px] font-mono">
                  Dev OTP Code: <strong>{devCode}</strong> (Auto-filled below)
                </div>
              )}

              {otpSent && (
                <div>
                  <label className="block font-semibold text-ink-soft mb-1">
                    Enter 6-Digit OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-ink font-mono text-base font-bold tracking-widest text-center focus:border-navy"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
              <div className="text-[11px] text-ink-soft">
                Total: <strong className="text-navy font-mono">₹{totalAmountRupees}</strong>
              </div>

              <button
                disabled={!otpSent || !otpCode || isVerifyingOtp}
                onClick={handleVerifyAndConfirm}
                className="px-6 py-2.5 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 shadow-sm"
              >
                {isVerifyingOtp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                ) : (
                  <>
                    <span>Confirm & Pay at Venue</span>
                    <Check className="w-4 h-4 text-gold" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
