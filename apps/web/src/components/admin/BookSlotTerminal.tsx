'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  CreditCard,
  Banknote,
  PlusCircle,
  ShieldAlert,
  Loader2,
  Check,
  Wrench,
} from 'lucide-react';

interface CourtOption {
  id: string;
  name: string;
}

interface SlotOption {
  courtId: string;
  startMinutes: number;
  endMinutes: number;
  timeLabel: string;
  state: string;
  isFree: boolean;
  pricePaise: number;
  priceFormatted: string;
  startsAt: string;
  endsAt: string;
}

interface BookSlotTerminalProps {
  userRole?: string | undefined;
  initialCourts?: CourtOption[] | undefined;
  todayDate?: string | undefined;
}

export function BookSlotTerminal({
  userRole = 'desk',
  initialCourts = [],
  todayDate,
}: BookSlotTerminalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query param defaults
  const paramDate = searchParams.get('date');
  const paramCourtId = searchParams.get('courtId');
  const paramTime = searchParams.get('time');

  const [date, setDate] = useState<string>(paramDate || todayDate || new Date().toISOString().split('T')[0] || '');
  const [courts, setCourts] = useState<CourtOption[]>(initialCourts);
  const [selectedCourtId, setSelectedCourtId] = useState<string>(paramCourtId || initialCourts[0]?.id || '');
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);

  // Customer state
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMatch, setLookupMatch] = useState<{
    found: boolean;
    name?: string;
    bookingCount?: number;
  } | null>(null);

  // Pricing & Override
  const [showOverride, setShowOverride] = useState(false);
  const [overridePriceRupees, setOverridePriceRupees] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Payment mode: 'cash' | 'card'
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card'>('cash');
  const [terminalMode, setTerminalMode] = useState<'booking' | 'blackout'>('booking');
  const [blackoutReason, setBlackoutReason] = useState('Net & Court Maintenance');
  const [confirmedBlackout, setConfirmedBlackout] = useState<{
    courtName: string;
    timeLabel: string;
    date: string;
    reason: string;
  } | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    reference: string;
    bookingId: string;
    amountPaise: number;
    paymentMode: string;
    isPaid: boolean;
    courtName: string;
    timeLabel: string;
    customerName: string;
  } | null>(null);

  const canOverridePrice = userRole === 'owner' || userRole === 'manager';

  // 1. Fetch available slots whenever Date or Court changes
  const fetchSlots = useCallback(async (targetDate: string, courtId: string) => {
    try {
      const res = await fetch(
        `/api/admin/book/slots?date=${targetDate}${courtId ? `&courtId=${courtId}` : ''}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          setCourts(json.courts || []);
          setSlots(json.slots || []);
          if (!courtId && json.courts?.[0]?.id) {
            setSelectedCourtId(json.courts[0].id);
          }

          // If paramTime provided, preselect matching slot
          if (paramTime) {
            const match = json.slots.find(
              (s: SlotOption) => s.isFree && s.timeLabel.startsWith(paramTime)
            );
            if (match) setSelectedSlot(match);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    }
  }, [paramTime]);

  useEffect(() => {
    fetchSlots(date, selectedCourtId || '');
  }, [date, selectedCourtId, fetchSlots]);

  // 2. Debounced customer lookup by phone
  useEffect(() => {
    const trimmed = customerPhone.trim().replace(/[^\d+]/g, '');
    if (trimmed.length < 6) {
      setLookupMatch(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const res = await fetch(`/api/admin/customers/lookup?phone=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.found && json.customer) {
            setLookupMatch({
              found: true,
              name: json.customer.name,
              bookingCount: json.customer.bookingCount,
            });
            if (json.customer.name && !customerName) {
              setCustomerName(json.customer.name);
            }
          } else {
            setLookupMatch({ found: false });
          }
        }
      } catch (err) {
        console.error('Customer lookup failed:', err);
      } finally {
        setIsLookingUp(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [customerPhone, customerName]);

  // 3. Handle Submit
  const handleBookingSubmit = async (mode: 'cash' | 'card' | 'none', isBlackout = false) => {
    if (!selectedSlot) {
      setErrorMessage('Please select an available time slot.');
      return;
    }

    if (!isBlackout && (!customerPhone || customerPhone.trim().length < 6)) {
      setErrorMessage('Please enter a valid customer phone number.');
      return;
    }

    if (showOverride && !overrideReason.trim()) {
      setErrorMessage('A reason is required when overriding price.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: Record<string, unknown> = {
        courtId: selectedSlot.courtId,
        startsAt: selectedSlot.startsAt,
        endsAt: selectedSlot.endsAt,
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim() || 'Walk-in Guest',
        paymentMode: mode,
      };

      if (showOverride && overridePriceRupees) {
        payload.priceOverridePaise = Math.round(parseFloat(overridePriceRupees) * 100);
        payload.overrideReason = overrideReason.trim();
      }

      const currentCourt = courts.find((c) => c.id === selectedSlot.courtId);

      if (isBlackout) {
        const res = await fetch('/api/admin/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courtId: selectedSlot.courtId,
            startsAt: selectedSlot.startsAt,
            endsAt: selectedSlot.endsAt,
            isBlackout: true,
            blackoutReason: blackoutReason.trim() || 'Court Maintenance',
            paymentMode: 'none',
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.ok) {
          setErrorMessage(json.error || 'Failed to lock slot for maintenance');
          return;
        }

        setConfirmedBlackout({
          courtName: currentCourt?.name || 'Court',
          timeLabel: selectedSlot.timeLabel,
          date,
          reason: blackoutReason.trim() || 'Court Maintenance',
        });
        return;
      }

      const res = await fetch('/api/admin/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setErrorMessage(json.error || 'Failed to complete booking');
        return;
      }

      setConfirmedBooking({
        reference: json.reference || 'PC-BOOKING',
        bookingId: json.bookingId || '',
        amountPaise: json.amountPaise ?? selectedSlot.pricePaise,
        paymentMode: mode,
        isPaid: json.isPaid ?? false,
        courtName: currentCourt?.name || 'Court',
        timeLabel: selectedSlot.timeLabel,
        customerName: customerName.trim() || 'Walk-in Guest',
      });
    } catch (err) {
      console.error('Booking submission error:', err);
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCourtName = courts.find((c) => c.id === selectedCourtId)?.name || 'Court';
  const resolvedPriceFormatted = selectedSlot
    ? showOverride && overridePriceRupees
      ? `₹${parseFloat(overridePriceRupees).toLocaleString('en-IN')}`
      : selectedSlot.priceFormatted
    : '—';

  // 4A. Maintenance Blackout Success Screen
  if (confirmedBlackout) {
    return (
      <div className="max-w-xl mx-auto py-8 animate-in fade-in">
        <div className="p-8 rounded-2xl bg-surface border border-warn/30 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-warn/15 text-warn border border-warn/30 flex items-center justify-center mx-auto">
            <Wrench className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-widest font-bold text-warn">
              Court Maintenance Active
            </span>
            <h2 className="text-2xl font-bold text-navy mt-1">
              Slot Blocked (Off-Duty)
            </h2>
            <p className="text-xs text-ink-soft mt-1">
              This slot is temporarily taken out of service across all channels.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface-2/50 text-left space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-ink-soft">Court & Date:</span>
              <strong className="text-navy font-semibold">
                {confirmedBlackout.courtName} � {confirmedBlackout.date}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-ink-soft">Time Window:</span>
              <strong className="font-mono font-bold text-navy">
                {confirmedBlackout.timeLabel}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-ink-soft">Maintenance Reason:</span>
              <span className="font-semibold text-warn">{confirmedBlackout.reason}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">Channels Locked:</span>
              <span className="font-semibold text-ok">Desk, Website (/book), Turf Town API</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                setConfirmedBlackout(null);
                setSelectedSlot(null);
                fetchSlots(date, selectedCourtId || "");
              }}
              className="flex-1 py-2.5 px-4 rounded-lg bg-navy text-white text-xs font-semibold hover:opacity-90 transition shadow-xs flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-gold" />
              <span>Block Another Slot</span>
            </button>

            <Link
              href={"/admin/calendar?date=" + date}
              className="py-2.5 px-4 rounded-lg border border-border text-ink text-xs font-medium hover:bg-surface-2 transition flex items-center justify-center"
            >
              View in Calendar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4B. Customer Booking Success Screen
  if (confirmedBooking) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="p-8 rounded-lg bg-surface border border-border shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-ok-soft text-ok border border-ok/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-ink-soft">
              Booking Confirmed
            </span>
            <h2 className="text-3xl font-mono font-bold text-navy mt-1 tracking-wider">
              {confirmedBooking.reference}
            </h2>
            <p className="text-sm text-ink-soft mt-1">
              Slot successfully locked & assigned
            </p>
          </div>

          <div className="p-4 rounded border border-border bg-surface-2/50 text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-ink-soft">Court & Slot</span>
              <strong className="text-navy font-semibold">
                {confirmedBooking.courtName} · {confirmedBooking.timeLabel}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-ink-soft">Player Name</span>
              <strong className="text-ink font-semibold">
                {confirmedBooking.customerName}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-ink-soft">Amount</span>
              <strong className="text-navy font-bold text-sm">
                ₹{(confirmedBooking.amountPaise / 100).toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">Payment Status</span>
              {confirmedBooking.isPaid ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-ok-soft text-ok uppercase">
                  PAID ({confirmedBooking.paymentMode})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-warn-soft text-warn uppercase">
                  UNPAID (Pay Later)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                setConfirmedBooking(null);
                setSelectedSlot(null);
                setCustomerPhone('');
                setCustomerName('');
                setLookupMatch(null);
                setShowOverride(false);
                fetchSlots(date, selectedCourtId || '');
              }}
              className="flex-1 py-2.5 px-4 rounded bg-navy text-white text-xs font-semibold hover:opacity-90 transition shadow-sm flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-gold" />
              <span>Book Another Slot</span>
            </button>

            <Link
              href="/admin"
              className="py-2.5 px-4 rounded border border-border text-ink text-xs font-medium hover:bg-surface-2 transition flex items-center justify-center"
            >
              Back to Terminal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 rounded border border-border hover:bg-surface-2 text-ink-soft transition"
            title="Back to Now Board"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Book a slot
            </h1>
            <p className="text-xs text-ink-soft mt-0.5">
              Rapid walk-in booking & counter payment terminal
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-ink-faint">
          Target: &lt;20 seconds
        </span>
      </div>

      {/* 2 Clear Tabs: Player Booking vs Maintenance Blackout */}
      <div className="flex rounded-xl bg-surface-2 p-1 border border-border">
        <button
          type="button"
          onClick={() => {
            setTerminalMode("booking");
            setErrorMessage(null);
          }}
          className={"flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 " + (terminalMode === "booking" ? "bg-navy text-white shadow-xs" : "text-ink-soft hover:text-navy")}
        >
          <User className="w-4 h-4" />
          <span>Player Match Booking</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setTerminalMode("blackout");
            setErrorMessage(null);
          }}
          className={"flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 " + (terminalMode === "blackout" ? "bg-warn text-white shadow-xs" : "text-ink-soft hover:text-warn")}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance Blackout (Off-Duty)</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded bg-danger-soft text-danger border border-danger/30 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Booking Form Card */}
      <div className="bg-surface rounded-lg border border-border shadow-sm p-6 space-y-6">
        {/* Step 1: Date & Court Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot(null);
                }}
                className="w-full px-3.5 py-2 rounded border border-border bg-surface text-ink text-sm font-medium focus:outline-hidden focus:border-navy"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
              Court
            </label>
            <select
              value={selectedCourtId}
              onChange={(e) => {
                setSelectedCourtId(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full px-3.5 py-2 rounded border border-border bg-surface text-ink text-sm font-medium focus:outline-hidden focus:border-navy"
            >
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Time Slots Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Available Hours ({currentCourtName})
            </label>
            <span className="text-[11px] text-ink-faint">
              Green = Free · Red/Gray = Taken
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.startMinutes === slot.startMinutes;

              return (
                <button
                  key={slot.startMinutes}
                  type="button"
                  disabled={!slot.isFree}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2.5 rounded border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-navy text-white border-navy ring-2 ring-navy/30 shadow-xs'
                      : slot.isFree
                      ? 'bg-surface-2/50 border-border hover:bg-surface-2 hover:border-navy/40 text-ink'
                      : 'bg-surface-2/20 border-border/40 text-ink-faint cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="text-xs font-bold font-mono">
                    {slot.timeLabel.split('–')[0]}
                  </span>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className={isSelected ? 'text-gold' : slot.isFree ? 'text-ok font-semibold' : ''}>
                      {slot.isFree ? 'Free' : 'Taken'}
                    </span>
                    {slot.isFree && (
                      <span className={isSelected ? 'text-white/90 font-mono' : 'text-ink-soft font-mono'}>
                        {slot.priceFormatted}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {terminalMode === "blackout" ? (
          /* Maintenance Blackout Form */
          <div className="pt-4 border-t border-border space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
                Maintenance / Blackout Reason
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {[
                  "Net & Court Maintenance",
                  "Floor Cleaning / Mat Care",
                  "Lighting & Electrical",
                  "Academy Coaching Camp",
                  "Tournament / Private Event",
                  "Emergency Roof Leak",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBlackoutReason(preset)}
                    className={"p-2.5 rounded-lg border text-left text-xs font-medium transition " + (blackoutReason === preset ? "border-warn bg-warn/10 text-navy font-bold shadow-2xs" : "border-border bg-surface text-ink-soft hover:border-border-strong")}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or enter specific maintenance details..."
                value={blackoutReason}
                onChange={(e) => setBlackoutReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-ink text-xs focus:outline-hidden focus:border-warn"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-warn/10 border border-warn/30 text-xs text-ink-soft flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-warn shrink-0 mt-0.5" />
              <p>
                This action takes <strong>{currentCourtName}</strong> off-duty for the selected time window. It will be immediately blocked on the Desk terminal, the customer portal, and Turf Town partner apps. No customer payment is recorded.
              </p>
            </div>

            <button
              type="button"
              disabled={isSubmitting || !selectedSlot}
              onClick={() => handleBookingSubmit("none", true)}
              className="w-full py-3.5 px-4 rounded-xl bg-warn text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locking Slot for Maintenance...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Confirm Maintenance Block</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Customer Booking Form */
          <div className="space-y-6 animate-in fade-in">
            {/* Step 3: Customer Details */}
            <div className="pt-4 border-t border-border space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Phone Number
                    </label>
                    {isLookingUp && (
                      <span className="text-[11px] text-ink-faint flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Searching player...
                      </span>
                    )}
                    {lookupMatch?.found && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok">
                        <Check className="w-3 h-3" />
                        {lookupMatch.name} � {lookupMatch.bookingCount} bookings
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-ink-faint absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      placeholder="e.g. 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-border bg-surface text-ink text-sm font-mono focus:outline-hidden focus:border-navy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                    Customer Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-ink-faint absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Player or Guest Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-border bg-surface text-ink text-sm focus:outline-hidden focus:border-navy"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Price & Override */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-ink-soft block">
                  Resolved Price
                </span>
                <div className="text-3xl font-bold text-navy mt-1 tabular-nums font-mono">
                  {resolvedPriceFormatted}
                </div>
              </div>

              {canOverridePrice && (
                <div>
                  {!showOverride ? (
                    <button
                      type="button"
                      onClick={() => setShowOverride(true)}
                      className="text-xs font-semibold text-navy hover:text-gold transition underline"
                    >
                      [ Override Price ]
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy">Price Override</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowOverride(false);
                            setOverridePriceRupees("");
                            setOverrideReason("");
                          }}
                          className="text-ink-soft hover:text-ink text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="New Price (?)"
                          value={overridePriceRupees}
                          onChange={(e) => setOverridePriceRupees(e.target.value)}
                          className="w-32 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Mandatory Reason"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 5: Payment Mode Selection */}
            <div className="pt-4 border-t border-border space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
                Payment Mode (At Counter)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition flex-1">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="cash"
                    checked={paymentMode === "cash"}
                    onChange={() => setPaymentMode("cash")}
                    className="text-navy focus:ring-navy"
                  />
                  <Banknote className="w-4 h-4 text-ok" />
                  <span className="text-xs font-semibold text-ink">Cash Received</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition flex-1">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="card"
                    checked={paymentMode === "card"}
                    onChange={() => setPaymentMode("card")}
                    className="text-navy focus:ring-navy"
                  />
                  <CreditCard className="w-4 h-4 text-navy" />
                  <span className="text-xs font-semibold text-ink">Card Swiped (POS)</span>
                </label>
              </div>
            </div>

            {/* Step 6: Primary Button & Secondary Links */}
            <div className="pt-6 border-t border-border space-y-3">
              <button
                type="button"
                disabled={isSubmitting || !selectedSlot}
                onClick={() => handleBookingSubmit(paymentMode)}
                className="w-full py-3.5 px-4 rounded-xl bg-navy text-white font-bold text-sm hover:opacity-90 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    <span>Processing Booking & Receipt...</span>
                  </>
                ) : (
                  <span>Payment received � Confirm booking</span>
                )}
              </button>

              <div className="flex items-center justify-center text-xs pt-1">
                <button
                  type="button"
                  disabled={isSubmitting || !selectedSlot}
                  onClick={() => handleBookingSubmit("none")}
                  className="text-ink-soft hover:text-warn transition underline font-medium"
                >
                  Block without payment (Pay later at desk)
                </button>
              </div>
            </div>
          </div>
        )}</div>
    </div>
  );
}
