'use client';

import { useState, useEffect, useRef } from 'react';
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
  Mail,
  Edit3,
  User,
  Check,
  Sparkles,
  Zap,
  Award,
} from 'lucide-react';
import type { PublicDaySlotItem, PublicMonthDayAvailability } from '@pavilion/db';

interface PublicBookingFlowProps {
  initialDate: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTo12Hour(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr.replace(/(\d{1,2}):(\d{2})/g, (_, hStr, mStr) => {
    let hour = parseInt(hStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, '0')}:${mStr} ${ampm}`;
  });
}

export function PublicBookingFlow({ initialDate }: PublicBookingFlowProps) {
  const router = useRouter();

  // Date selection state
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentYear, setCurrentYear] = useState(() => parseInt(initialDate.split('-')[0]!, 10));
  const [currentMonth, setCurrentMonth] = useState(() => parseInt(initialDate.split('-')[1]!, 10));

  // Quick select helper dates
  const todayObj = new Date();
  const todayStr = formatLocalDate(todayObj);

  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = formatLocalDate(tomorrowObj);

  const weekendObj = new Date();
  const currentDayOfWeek = weekendObj.getDay(); // 0 = Sun, 6 = Sat
  if (currentDayOfWeek !== 0 && currentDayOfWeek !== 6) {
    weekendObj.setDate(weekendObj.getDate() + (6 - currentDayOfWeek)); // Next Saturday
  }
  const weekendStr = formatLocalDate(weekendObj);

  // Data states
  const [monthDays, setMonthDays] = useState<PublicMonthDayAvailability[]>([]);
  const [daySlots, setDaySlots] = useState<PublicDaySlotItem[]>([]);
  const [allCourts, setAllCourts] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Selected Slots State
  const [selectedSlotTimes, setSelectedSlotTimes] = useState<string[]>([]); // startsAt ISOs
  const [overrideCourtId, setOverrideCourtId] = useState<string | null>(null);

  // Segmented Control State & 120fps Zero-Lag GPU Drag Ref Handling
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const segContainerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    startPercent: number;
    currentPercent: number;
    segWidth: number;
    hasMoved: boolean;
    lockedHorizontal: boolean;
    lastX: number;
    lastTime: number;
    velocity: number;
  } | null>(null);

  const getPeriodIndex = (p: 'morning' | 'afternoon' | 'evening') => (p === 'morning' ? 0 : p === 'afternoon' ? 1 : 2);
  const indexToPeriod = (idx: number): 'morning' | 'afternoon' | 'evening' => (idx === 0 ? 'morning' : idx === 1 ? 'afternoon' : 'evening');

  // Keep thumb in sync when selectedPeriod changes (e.g. tap, date change)
  useEffect(() => {
    if (thumbRef.current && (!dragRef.current || !dragRef.current.hasMoved)) {
      const idx = getPeriodIndex(selectedPeriod);
      thumbRef.current.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)';
      thumbRef.current.style.transform = `translate3d(${idx * 100}%, 0, 0)`;
    }
  }, [selectedPeriod]);

  // Auto-focus optimal period when slots load or date changes
  useEffect(() => {
    if (daySlots.length === 0) return;
    if (selectedSlots.length > 0 && selectedSlots[0]?.period) {
      setSelectedPeriod(selectedSlots[0].period);
      return;
    }
    const nowMs = Date.now();
    const hasMorning = daySlots.some(
      (s) => s.period === 'morning' && s.isAvailable && !s.isPast && new Date(s.startsAt).getTime() > nowMs
    );
    const hasAfternoon = daySlots.some(
      (s) => s.period === 'afternoon' && s.isAvailable && !s.isPast && new Date(s.startsAt).getTime() > nowMs
    );
    const hasEvening = daySlots.some(
      (s) => s.period === 'evening' && s.isAvailable && !s.isPast && new Date(s.startsAt).getTime() > nowMs
    );

    if (hasMorning) {
      setSelectedPeriod('morning');
    } else if (hasAfternoon) {
      setSelectedPeriod('afternoon');
    } else if (hasEvening) {
      setSelectedPeriod('evening');
    }
  }, [selectedDate, daySlots]);

  const handleSelectPeriod = (period: 'morning' | 'afternoon' | 'evening') => {
    if (dragRef.current?.hasMoved) return;
    const idx = getPeriodIndex(period);
    if (thumbRef.current) {
      thumbRef.current.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)';
      thumbRef.current.style.transform = `translate3d(${idx * 100}%, 0, 0)`;
    }
    setSelectedPeriod(period);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(6);
  };

  const onPointerDownSeg = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!segContainerRef.current) return;
    if (e.isPrimary === false) return;

    const rect = segContainerRef.current.getBoundingClientRect();
    const segWidth = (rect.width - 8) / 3;
    const startIdx = getPeriodIndex(selectedPeriod);
    const startPercent = startIdx * 100;

    const drag = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      startPercent,
      currentPercent: startPercent,
      segWidth,
      hasMoved: false,
      lockedHorizontal: false,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
    dragRef.current = drag;

    const onWindowMove = (ev: PointerEvent) => {
      if (!dragRef.current || !thumbRef.current) return;
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;

      if (!drag.lockedHorizontal) {
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          if (Math.abs(dx) >= Math.abs(dy)) {
            drag.lockedHorizontal = true;
          } else {
            // Vertical scroll detected: let page scroll naturally
            cleanup();
            dragRef.current = null;
            return;
          }
        } else {
          return;
        }
      }

      drag.hasMoved = true;
      const now = performance.now();
      const dt = now - drag.lastTime;
      if (dt > 8) {
        drag.velocity = (ev.clientX - drag.lastX) / dt;
        drag.lastX = ev.clientX;
        drag.lastTime = now;
      }

      const percentDelta = (dx / drag.segWidth) * 100;
      let newPercent = drag.startPercent + percentDelta;

      // Elastic rubber-band spring damping at edges
      if (newPercent < 0) {
        newPercent = newPercent * 0.25;
      } else if (newPercent > 200) {
        newPercent = 200 + (newPercent - 200) * 0.25;
      }

      drag.currentPercent = newPercent;

      // 100% Direct GPU compositor transform in PERCENTAGE (Never aborts or mismatches!)
      thumbRef.current.style.transition = 'none';
      thumbRef.current.style.transform = `translate3d(${newPercent}%, 0, 0)`;
    };

    const onWindowUp = () => {
      cleanup();
      if (!thumbRef.current) {
        dragRef.current = null;
        return;
      }

      const currentIdx = getPeriodIndex(selectedPeriod);
      let targetIdx = currentIdx;

      if (drag.hasMoved && drag.lockedHorizontal) {
        const percentDelta = drag.currentPercent - drag.startPercent;

        // Intentional swipe / flick: if dragged > 15% of segment or swiped with speed
        if (drag.velocity > 0.25 || percentDelta > 15) {
          // Swiped RIGHT -> next segment!
          targetIdx = Math.min(2, currentIdx + 1);
        } else if (drag.velocity < -0.25 || percentDelta < -15) {
          // Swiped LEFT -> previous segment!
          targetIdx = Math.max(0, currentIdx - 1);
        } else {
          // Position-based snap to nearest slot (0, 1, or 2)
          targetIdx = Math.round(drag.currentPercent / 100);
          targetIdx = Math.max(0, Math.min(2, targetIdx));
        }
      }

      // Smooth animated snap to exact target slot in percentage (0%, 100%, 200%)
      thumbRef.current.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)';
      thumbRef.current.style.transform = `translate3d(${targetIdx * 100}%, 0, 0)`;

      const targetPeriod = indexToPeriod(targetIdx);
      setSelectedPeriod(targetPeriod);
      if (targetPeriod !== selectedPeriod && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }

      setTimeout(() => {
        dragRef.current = null;
      }, 50);
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
    };

    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
  };

  // Hold State (10-minute timer)
  const [holdReference, setHoldReference] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isCreatingHold, setIsCreatingHold] = useState(false);

  // Player Verification & OTP Modal State (2-Step Flow)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [modalStep, setModalStep] = useState<'details' | 'otp'>('details');
  const [otpChannel, setOtpChannel] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  return () => clearInterval(timer);
  }, [resendCooldown]);

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

  // Quick date selector
  const handleQuickDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    const [y, m] = dateStr.split('-').map(Number);
    if (y && m) {
      setCurrentYear(y);
      setCurrentMonth(m);
    }
  };

  // Slot toggle (single or consecutive)
  const handleSlotToggle = (slot: PublicDaySlotItem) => {
    const isSlotPast = Boolean(slot.isPast || new Date(slot.startsAt).getTime() <= Date.now());
    if (!slot.isAvailable || isSlotPast) return;

    if (selectedSlotTimes.includes(slot.startsAt)) {
      setSelectedSlotTimes(selectedSlotTimes.filter((t) => t !== slot.startsAt));
    } else {
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
        setModalStep('details');
        setFormError(null);
        setBookingError(null);
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

  // Step 1 -> Step 2: Validate details ONLY (NO OTP sent yet!)
  const handleProceedToStep2 = () => {
    setFormError(null);
    setBookingError(null);

    // 1. Validate Phone (10 digits)
    const digitsOnly = phone.replace(/\D/g, '');
    const cleanPhone = digitsOnly.length === 12 && digitsOnly.startsWith('91')
      ? digitsOnly.slice(2)
      : digitsOnly.slice(-10);

    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // 2. Validate Email (Compulsory)
    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setFormError('Please enter a valid email address (compulsory for booking confirmation pass).');
      return;
    }

    // Move to Step 2 without sending OTP yet
    setOtpSent(false);
    setOtpCode('');
    setModalStep('otp');
  };

  // Step 2: User explicitly chooses channel (phone or email) -> OTP is sent and channel is locked!
  const handleSelectChannelAndSendOtp = async (channel: 'phone' | 'email') => {
    setBookingError(null);
    setOtpChannel(channel);
    setIsSendingOtp(true);

    const digitsOnly = phone.replace(/\D/g, '');
    const cleanPhone = digitsOnly.slice(-10);

    try {
      const res = await fetch('/api/public/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, email: email.trim(), channel }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setOtpSent(true);
        if (json.devOtp) {
          setDevOtp(json.devOtp);
          setOtpCode(json.devOtp);
        } else {
          setOtpCode('');
        }
        setResendCooldown(30);
      } else {
        setBookingError(json.error || 'Failed to send verification code. Please try again.');
      }
    } catch (err) {
      console.error('OTP send error:', err);
      setBookingError('Network error sending verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Resend OTP (only to the ALREADY chosen channel)
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp) return;
    await handleSelectChannelAndSendOtp(otpChannel);
  };

  // Step 2: Reset channel choice if user wants to switch cleanly
  const handleChangeChannel = () => {
    setOtpSent(false);
    setOtpCode('');
    setDevOtp(null);
    setBookingError(null);
  };

  // Step 2: Verify OTP and Confirm Pay At Venue
  const handleVerifyAndConfirm = async () => {
    if (!otpCode || !holdReference) return;
    setIsVerifyingOtp(true);
    setBookingError(null);

    const digitsOnly = phone.replace(/\D/g, '');
    const cleanPhone = digitsOnly.length === 12 && digitsOnly.startsWith('91')
      ? digitsOnly.slice(2)
      : digitsOnly.slice(-10);

    try {
      // 1. Verify OTP with name and compulsory email
      const otpRes = await fetch('/api/public/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code: otpCode.trim(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
        }),
      });
      const otpJson = await otpRes.json();

      if (!otpRes.ok || !otpJson.ok) {
        setBookingError(otpJson.error || 'Invalid or expired verification code.');
        setIsVerifyingOtp(false);
        return;
      }

      // 2. Confirm Booking on Pay at Venue
      const confirmRes = await fetch('/api/public/book/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(otpJson.sessionToken ? { Authorization: 'Bearer ' + otpJson.sessionToken } : {}),
        },
        body: JSON.stringify({
          reference: holdReference,
          phone: cleanPhone,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          sessionToken: otpJson.sessionToken,
        }),
      });
      const confirmJson = await confirmRes.json();

      if (confirmRes.ok && confirmJson.ok) {
        router.push('/book/' + holdReference);
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

  // Render individual slot card (Only available active bookable slots)
  const renderSlotCard = (slot: PublicDaySlotItem) => {
    const isSelected = selectedSlotTimes.includes(slot.startsAt);

    return (
      <button
        key={slot.startsAt}
        onClick={() => handleSlotToggle(slot)}
        className={`relative p-3.5 rounded-2xl border text-left transition-all duration-300 ease-out active:scale-95 flex flex-col justify-between group cursor-pointer ${
          isSelected
            ? 'bg-navy text-white border-navy shadow-lg scale-[1.02]'
            : 'bg-surface border-border hover:border-gold hover:shadow-md hover:bg-surface-2/30 text-ink'
        }`}
      >
        <div className="flex items-center justify-between gap-1 w-full">
          <span
            className={`font-mono font-bold text-xs sm:text-sm tracking-tight ${
              isSelected ? 'text-white' : 'text-navy'
            }`}
          >
            {formatTo12Hour(slot.timeLabel)}
          </span>
          {isSelected ? (
            <span className="w-5 h-5 rounded-full bg-gold text-navy flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          ) : slot.availableCourts.length === 1 ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              1 Left
            </span>
          ) : null}
        </div>

        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
          <span
            className={`font-extrabold text-sm sm:text-base font-mono ${
              isSelected ? 'text-gold' : 'text-navy'
            }`}
          >
            ₹{slot.priceRupees}
          </span>
          <span
            className={`text-[10px] uppercase font-medium tracking-wider ${
              isSelected ? 'text-white/80' : 'text-ink-soft'
            }`}
          >
            60 mins
          </span>
        </div>
      </button>
    );
  };

  // Filter strictly available upcoming future slots (Zero closed clutter)
  const availableSlots = daySlots.filter(
    (s) => s.isAvailable && !s.isPast && new Date(s.startsAt).getTime() > Date.now()
  );
  const morningAvailable = availableSlots.filter((s) => s.period === 'morning');
  const afternoonAvailable = availableSlots.filter((s) => s.period === 'afternoon');
  const eveningAvailable = availableSlots.filter((s) => s.period === 'evening');

  const allMorning = daySlots.filter((s) => s.period === 'morning');
  const allAfternoon = daySlots.filter((s) => s.period === 'afternoon');
  const allEvening = daySlots.filter((s) => s.period === 'evening');

  const nowMs = Date.now();
  const isMorningPassed = allMorning.length > 0 && allMorning.every((s) => s.isPast || new Date(s.startsAt).getTime() <= nowMs);
  const isAfternoonPassed = allAfternoon.length > 0 && allAfternoon.every((s) => s.isPast || new Date(s.startsAt).getTime() <= nowMs);
  const isEveningPassed = allEvening.length > 0 && allEvening.every((s) => s.isPast || new Date(s.startsAt).getTime() <= nowMs);

  const getPeriodSubtitle = (period: 'morning' | 'afternoon' | 'evening') => {
    if (period === 'morning') {
      if (isMorningPassed) return 'Passed';
      if (morningAvailable.length === 0) return 'Full';
      return `${morningAvailable.length} free`;
    }
    if (period === 'afternoon') {
      if (isAfternoonPassed) return 'Passed';
      if (afternoonAvailable.length === 0) return 'Full';
      return `${afternoonAvailable.length} free`;
    }
    if (period === 'evening') {
      if (isEveningPassed) return 'Passed';
      if (eveningAvailable.length === 0) return 'Full';
      return `${eveningAvailable.length} free`;
    }
    return '';
  };

  const activePeriodSlots =
    selectedPeriod === 'morning'
      ? morningAvailable
      : selectedPeriod === 'afternoon'
      ? afternoonAvailable
      : eveningAvailable;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-10 sm:pb-12">
      {/* 1. Page Header & Hero */}
      <div className="border-b border-border pb-3 sm:pb-5 space-y-2.5 sm:space-y-3">
        {/* 3 Badges - Equal 3-column grid on mobile (No swipe), flex on desktop */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-2 text-[9.5px] sm:text-[11px] whitespace-nowrap">
          <span className="inline-flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-1 sm:px-3 py-1 rounded-full font-bold uppercase bg-gold/15 text-navy border border-gold/40 shadow-xs truncate">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold shrink-0" />
            <span className="truncate">Pavilion<span className="hidden sm:inline"> Club · Court Reservation</span></span>
          </span>
          <span className="inline-flex items-center justify-center sm:justify-start gap-1 px-1 sm:px-2.5 py-1 rounded-full font-medium bg-surface-2 text-ink-soft border border-border truncate">
            <span className="truncate">3 Pro <span className="hidden sm:inline">Regulation </span>Courts</span>
          </span>
          <span className="inline-flex items-center justify-center sm:justify-start gap-1 px-1 sm:px-2.5 py-1 rounded-full font-semibold text-ok bg-ok/10 border border-ok/30 truncate">
            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">10-Min Hold<span className="hidden sm:inline"> Lock</span></span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-navy">
              Select Date & Match Time
            </h1>
            <p className="text-[11px] sm:text-sm text-ink-soft mt-0.5 sm:mt-1">
              Real-time court availability · Pay at Venue with zero advance fee
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold text-ink-soft shrink-0">
            <span className="flex items-center gap-1 text-navy">
              <CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Instant WhatsApp Pass
            </span>
          </div>
        </div>

        {/* Quick Date Shortcuts - 3-column equal grid, perfectly fitted without swipe */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleQuickDateSelect(todayStr)}
            className={`py-1.5 sm:py-2 px-1 rounded-xl font-semibold transition-all duration-300 ease-out active:scale-95 flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              selectedDate === todayStr
                ? 'bg-navy text-white shadow-sm '
                : 'bg-surface border border-border text-ink hover:border-gold/60 hover:bg-surface-2'
            }`}
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold shrink-0" />
            <span className="truncate">Today</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDateSelect(tomorrowStr)}
            className={`py-1.5 sm:py-2 px-1 rounded-xl font-semibold transition-all duration-300 ease-out active:scale-95 flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              selectedDate === tomorrowStr
                ? 'bg-navy text-white shadow-sm '
                : 'bg-surface border border-border text-ink hover:border-gold/60 hover:bg-surface-2'
            }`}
          >
            <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold shrink-0" />
            <span className="truncate">Tomorrow</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDateSelect(weekendStr)}
            className={`py-1.5 sm:py-2 px-1 rounded-xl font-semibold transition-all duration-300 ease-out active:scale-95 flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              selectedDate === weekendStr
                ? 'bg-navy text-white shadow-sm '
                : 'bg-surface border border-border text-ink hover:border-gold/60 hover:bg-surface-2'
            }`}
          >
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold shrink-0" />
            <span className="truncate"><span className="hidden sm:inline">This </span>Weekend</span>
          </button>
        </div>
      </div>

      {/* Active Hold Banner if in progress */}
      {holdReference && secondsRemaining !== null && secondsRemaining > 0 && (
        <div className="p-4 rounded-2xl bg-navy text-white border border-gold/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center shrink-0 border border-gold/30">
              <Clock className="w-5 h-5 text-gold animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gold uppercase tracking-wider">Slot Reserved For You</span>
                <span className="w-2 h-2 rounded-full bg-ok animate-ping" />
              </div>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                {assignedCourt?.name} · {selectedDate} ({formatTo12Hour(selectedSlots[0]?.timeLabel || "")})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            <span className="text-[11px] text-white/70 uppercase font-semibold">Hold Expires:</span>
            <span className="font-mono font-bold text-gold text-base tabular-nums">
              ⏱️ {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {bookingError && (
        <div className="p-4 rounded-xl bg-danger-soft text-danger border border-danger/30 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{bookingError}</span>
        </div>
      )}

      {/* 2. Step 1: Month Calendar with Availability Dots */}
      <section className="p-3.5 sm:p-6 rounded-2xl bg-surface border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gold" />
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-navy">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h2>
          </div>

          {/* Month Steppers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 rounded-lg border border-border hover:bg-surface-2 text-ink-soft hover:text-navy transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 rounded-lg border border-border hover:bg-surface-2 text-ink-soft hover:text-navy transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] text-ink-soft pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-ok shadow-xs" />
            <span className="font-medium">Available</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warn shadow-xs" />
            <span className="font-medium">Filling fast</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-border shadow-xs" />
            <span className="font-medium">Sold out / Past</span>
          </span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-[11px] font-bold text-ink-faint py-1 uppercase tracking-wider">
              {d}
            </div>
          ))}

          {/* Padding for first day of week */}
          {monthDays.length > 0 &&
            Array.from({ length: monthDays[0]!.weekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 sm:h-14" />
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
                className={`h-12 sm:h-14 rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 ease-out active:scale-95 ${
                  isSelected
                    ? 'bg-navy text-white font-bold shadow-md scale-[1.02] border border-navy'
                    : isPast || isSoldOut
                    ? 'opacity-30 cursor-not-allowed bg-surface-2/40 text-ink-faint border border-transparent'
                    : 'hover:bg-surface-2 bg-surface text-ink border border-border/70 hover:border-gold/60'
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold transition-colors duration-300">{d.dayOfMonth}</span>

                {/* Dot */}
                {!isPast && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 transition-colors duration-300 ${
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

      {/* 3. Step 2: Slot Grid with Court Pills */}
      <section className="space-y-6">
        <div className="space-y-3 border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-navy flex items-center gap-2">
                Available Slots for {selectedDate}
              </h2>
              <p className="text-xs text-ink-soft">
                Pick your preferred time · 60-minute standard match pass
              </p>
            </div>


          </div>

          {/* Interactive Court Segmented Pills - Equal 3-column grid without swipe */}
          {allCourts.length > 0 && (
            <div className="pt-1">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {allCourts.map((court) => {
                  const isCourtSelected = (overrideCourtId || assignedCourt?.id) === court.id;
                  return (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => setOverrideCourtId(court.id)}
                      className={`py-1.5 sm:py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-300 ease-out active:scale-95 flex items-center justify-center gap-1.5 ${
                        isCourtSelected
                          ? 'bg-navy text-white shadow-sm '
                          : 'bg-surface border border-border text-ink hover:border-navy/40 hover:bg-surface-2'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 transition-colors duration-300 ${isCourtSelected ? 'bg-gold' : 'bg-ok'}`} />
                      <span className="truncate">{court.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {isLoadingSlots ? (
          <SlotGridSkeleton />
        ) : (
          availableSlots.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-surface border border-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-2 text-ink-soft flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-gold" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-navy">
                No Available Slots Remaining
              </h3>
              <p className="text-xs text-ink-soft max-w-sm mx-auto">
                All slots for {selectedDate} are either completed or fully booked. Please select a future date to book your match.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Interactive Segmented Control (Morning / Afternoon / Evening) with 120fps Zero-Lag GPU Drag & Swipe */}
            <div className="pt-2">
            <div
              ref={segContainerRef}
              onPointerDown={onPointerDownSeg}
              className="relative grid grid-cols-3 bg-[#EFE9DB] p-1 rounded-2xl border border-[#E0D8C6] select-none shadow-xs cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
            >
              {/* Sliding Active Pill with Zero-Lag Direct GPU Transform */}
              <div
                ref={thumbRef}
                className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] bg-white rounded-[13px] shadow-[0_2px_8px_rgba(15,30,46,0.12)] pointer-events-none will-change-transform"
                style={{
                  transform: `translate3d(${getPeriodIndex(selectedPeriod) * 100}%, 0, 0)`,
                  transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />

              {/* Morning Segment */}
              <button
                type="button"
                onClick={() => handleSelectPeriod('morning')}
                className="relative z-10 py-2 sm:py-2.5 px-1 flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer"
              >
                <span
                  className={`text-xs sm:text-sm transition-colors ${
                    selectedPeriod === 'morning'
                      ? 'font-bold text-[#0f1e2e]'
                      : isMorningPassed
                      ? 'font-medium text-[#0f1e2e]/40'
                      : 'font-semibold text-[#0f1e2e]/70'
                  }`}
                >
                  Morning
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight mt-0.5 ${
                    isMorningPassed
                      ? 'text-[#0f1e2e]/40'
                      : morningAvailable.length === 0
                      ? 'text-danger font-medium'
                      : selectedPeriod === 'morning'
                      ? 'text-[#0f1e2e]/70'
                      : 'text-[#0f1e2e]/60'
                  }`}
                >
                  {getPeriodSubtitle('morning')}
                </span>
              </button>

              {/* Afternoon Segment */}
              <button
                type="button"
                onClick={() => handleSelectPeriod('afternoon')}
                className="relative z-10 py-2 sm:py-2.5 px-1 flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer"
              >
                <span
                  className={`text-xs sm:text-sm transition-colors ${
                    selectedPeriod === 'afternoon'
                      ? 'font-bold text-[#0f1e2e]'
                      : isAfternoonPassed
                      ? 'font-medium text-[#0f1e2e]/40'
                      : 'font-semibold text-[#0f1e2e]/70'
                  }`}
                >
                  Afternoon
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight mt-0.5 ${
                    isAfternoonPassed
                      ? 'text-[#0f1e2e]/40'
                      : afternoonAvailable.length === 0
                      ? 'text-danger font-medium'
                      : selectedPeriod === 'afternoon'
                      ? 'text-[#0f1e2e]/70'
                      : 'text-[#0f1e2e]/60'
                  }`}
                >
                  {getPeriodSubtitle('afternoon')}
                </span>
              </button>

              {/* Evening Segment */}
              <button
                type="button"
                onClick={() => handleSelectPeriod('evening')}
                className="relative z-10 py-2 sm:py-2.5 px-1 flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer"
              >
                <span
                  className={`text-xs sm:text-sm transition-colors ${
                    selectedPeriod === 'evening'
                      ? 'font-bold text-[#0f1e2e]'
                      : isEveningPassed
                      ? 'font-medium text-[#0f1e2e]/40'
                      : 'font-semibold text-[#0f1e2e]/70'
                  }`}
                >
                  Evening
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight mt-0.5 ${
                    isEveningPassed
                      ? 'text-[#0f1e2e]/40'
                      : eveningAvailable.length === 0
                      ? 'text-danger font-medium'
                      : selectedPeriod === 'evening'
                      ? 'text-[#0f1e2e]/70'
                      : 'text-[#0f1e2e]/60'
                  }`}
                >
                  {getPeriodSubtitle('evening')}
                </span>
              </button>
            </div>
          </div>

          {/* Active Period Slots Grid */}
          <div className="space-y-4">
            {activePeriodSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                {activePeriodSlots.map(renderSlotCard)}
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center rounded-2xl bg-surface-2/60 border border-border space-y-2">
                <p className="text-xs sm:text-sm font-semibold text-navy">
                  {selectedPeriod === 'morning' && isMorningPassed
                    ? 'Morning sessions have passed for today.'
                    : selectedPeriod === 'afternoon' && isAfternoonPassed
                    ? 'Afternoon sessions have passed for today.'
                    : `No available slots in the ${selectedPeriod} session for this date.`}
                </p>
                <p className="text-[11px] text-ink-soft">
                  Select another session above or choose a different date.
                </p>
              </div>
            )}
          </div>
          </div>
        )
      )}
    </section>

      {/* 4. Floating Frosted-Glass Bottom Dock (Ergonomic for 320px, 375px, 425px) */}
      <div className="mt-10 sm:mt-12 sticky bottom-4 sm:bottom-6 z-40 max-w-2xl mx-auto bg-surface/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-3 sm:p-4 transition-all duration-300">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 hidden sm:flex">
              <CalendarIcon className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs truncate">
                <span className="font-bold text-navy truncate">
                  {selectedSlots.length > 0 ? formatTo12Hour(selectedSlots[0]!.timeLabel) : 'Select a match slot'}
                </span>
                {assignedCourt && selectedSlots.length > 0 && (
                  <span className="text-ink-soft font-medium text-[11px] truncate">
                    · {assignedCourt.name}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-xl font-extrabold text-navy font-mono">
                  ₹{totalAmountRupees.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] sm:text-xs text-ink-soft font-normal truncate">
                  {selectedSlots.length > 0 ? '· Pay at Venue' : ''}
                </span>
              </div>
            </div>
          </div>

          <button
            disabled={selectedSlots.length === 0 || isCreatingHold}
            onClick={handleProceedToHold}
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-navy text-white font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition disabled:opacity-40 flex items-center gap-1.5 sm:gap-2 shadow-md whitespace-nowrap shrink-0"
          >
            {isCreatingHold ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                <span>Holding...</span>
              </>
            ) : (
              <>
                <span>Book Slot</span>
                <ArrowRight className="w-4 h-4 text-gold" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Two-Step Player Verification & OTP Modal (Channel Choice: Phone or Email in Step 2) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center border border-gold/30">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-navy">
                    {modalStep === 'details'
                      ? 'Player Information'
                      : !otpSent
                      ? 'Select OTP Channel'
                      : 'Enter Verification Code'}
                  </h3>
                  <p className="text-[11px] text-ink-soft">
                    {modalStep === 'details'
                      ? 'Instant WhatsApp, SMS & Email pass'
                      : !otpSent
                      ? 'Choose where to receive your 6-digit code'
                      : otpChannel === 'email'
                      ? 'Code sent to ' + email.trim()
                      : 'Code sent to +91 ' + phone.replace(/\D/g, '').slice(-10)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setFormError(null);
                  setBookingError(null);
                }}
                className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-2 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Progress Pill */}
            <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-surface-2 border border-border">
              <div className="flex items-center gap-1.5 font-semibold text-navy">
                <span className="w-4 h-4 rounded-full bg-navy text-gold text-[10px] font-bold flex items-center justify-center">
                  {modalStep === 'details' ? '1' : '2'}
                </span>
                <span>{modalStep === 'details' ? 'Step 1 of 2: Player Details' : 'Step 2 of 2: OTP Verification'}</span>
              </div>
              {modalStep === 'otp' && (
                <button
                  onClick={() => {
                    setModalStep('details');
                    setBookingError(null);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-navy hover:text-gold-text underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit details</span>
                </button>
              )}
            </div>

            {modalStep === 'details' ? (
              /* ===== POPUP 1: PLAYER DETAILS ONLY ===== */
              <div className="space-y-3.5 text-xs">
                {/* 1. Name */}
                <div>
                  <label className="block font-semibold text-ink-soft mb-1.5">
                    Your Name (Optional)
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-ink text-xs focus:border-navy focus:ring-1 focus:ring-navy outline-hidden"
                    />
                  </div>
                </div>

                {/* 2. Mobile Number (Clean full width input) */}
                <div>
                  <label className="block font-semibold text-ink-soft mb-1.5">
                    Mobile Number (10 Digits) *
                  </label>
                  <div className="relative">
                    <span className="text-xs font-mono font-bold text-ink-soft absolute left-3 top-3">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                        if (formError) setFormError(null);
                      }}
                      className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-border bg-surface text-ink font-mono text-xs focus:border-navy focus:ring-1 focus:ring-navy outline-hidden"
                    />
                  </div>
                </div>

                {/* 3. Email Address */}
                <div>
                  <label className="block font-semibold text-ink-soft mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-3" />
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-ink text-xs focus:border-navy focus:ring-1 focus:ring-navy outline-hidden"
                    />
                  </div>
                </div>

                {/* Validation Error Banner */}
                {formError && (
                  <div className="p-2.5 rounded-xl bg-danger-soft text-danger border border-danger/20 flex items-start gap-2 text-[11px] animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Policy Banner */}
                <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center gap-2 text-[11px] text-ink-soft">
                  <CheckCircle2 className="w-4 h-4 text-ok shrink-0" />
                  <span>Pay at venue upon arrival · Instant WhatsApp, SMS & Email pass</span>
                </div>
              </div>
            ) : (
              /* ===== POPUP 2: 2ND POPUP / NEXT STEP ===== */
              !otpSent ? (
                /* Phase A: User chooses SMS or Email to send OTP */
                <div className="space-y-3.5 text-xs animate-in fade-in">
                  <div className="text-center space-y-1 py-1">
                    <h4 className="text-sm font-bold text-navy">
                      Where should we send your OTP?
                    </h4>
                    <p className="text-[11px] text-ink-soft">
                      Choose WhatsApp/SMS or Email below. Your 6-digit code will be sent once you click.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Option 1: WhatsApp / SMS */}
                    <button
                      type="button"
                      disabled={isSendingOtp}
                      onClick={() => handleSelectChannelAndSendOtp('phone')}
                      className="w-full p-3.5 rounded-xl border border-border bg-surface hover:border-navy hover:bg-surface-2 active:scale-[0.99] transition flex items-center justify-between text-left group cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-navy/10 text-navy flex items-center justify-center group-hover:bg-navy group-hover:text-gold transition">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-navy text-xs">WhatsApp / SMS</div>
                          <div className="text-[11px] text-ink-soft font-mono">
                            +91 {phone.replace(/\D/g, '').slice(-10)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-navy group-hover:text-gold-text">
                        <span>{isSendingOtp && otpChannel === 'phone' ? 'Sending...' : 'Send OTP'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gold" />
                      </div>
                    </button>

                    {/* Option 2: Email */}
                    <button
                      type="button"
                      disabled={isSendingOtp}
                      onClick={() => handleSelectChannelAndSendOtp('email')}
                      className="w-full p-3.5 rounded-xl border border-border bg-surface hover:border-navy hover:bg-surface-2 active:scale-[0.99] transition flex items-center justify-between text-left group cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-navy/10 text-navy flex items-center justify-center group-hover:bg-navy group-hover:text-gold transition">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-navy text-xs">Email Inbox</div>
                          <div className="text-[11px] text-ink-soft font-mono truncate max-w-[170px] sm:max-w-[210px]">
                            {email.trim()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-navy group-hover:text-gold-text">
                        <span>{isSendingOtp && otpChannel === 'email' ? 'Sending...' : 'Send OTP'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gold" />
                      </div>
                    </button>
                  </div>

                  {bookingError && (
                    <div className="p-2.5 rounded-xl bg-danger-soft text-danger border border-danger/20 flex items-start gap-2 text-[11px] animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{bookingError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Phase B: OTP has been sent to chosen channel (LOCKED) -> Enter 6-digit code */
                <div className="space-y-3.5 text-xs animate-in fade-in">
                  {/* Locked Channel Confirmation Badge */}
                  <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-ok-soft text-ok flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-navy">
                          {otpChannel === 'email' ? 'Code sent to Email' : 'Code sent to WhatsApp / SMS'}
                        </div>
                        <div className="text-[10px] text-ink-soft font-mono">
                          {otpChannel === 'email' ? email.trim() : '+91 ' + phone.replace(/\D/g, '').slice(-10)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeChannel}
                      className="text-[11px] font-bold text-navy hover:text-gold-text underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {/* Dev / Test OTP Helper Banner */}
                  {devOtp && (
                    <div className="p-3 rounded-xl bg-gold/10 border border-gold/40 text-navy flex items-center justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold shrink-0" />
                        <div className="text-[11px] leading-tight">
                          <span className="font-semibold text-ink-soft">Test Verification Code: </span>
                          <span className="font-mono font-extrabold text-navy text-sm tracking-wider">{devOtp}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-navy bg-white px-2 py-0.5 rounded-full border border-gold/30 shadow-2xs">
                        Auto-filled
                      </span>
                    </div>
                  )}

                  {/* 6-Digit OTP Code Input */}
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-ink-soft text-center">
                      Enter 6-Digit Verification Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                        if (bookingError) setBookingError(null);
                      }}
                      className="w-full px-3 py-3 rounded-xl border border-border bg-surface text-ink font-mono text-2xl font-bold tracking-[0.35em] text-center focus:border-navy focus:ring-1 focus:ring-navy outline-hidden"
                    />
                  </div>

                  {/* Resend OTP Row */}
                  <div className="flex items-center justify-between text-[11px] text-ink-soft pt-1">
                    <span>Didn't receive the code?</span>
                    {resendCooldown > 0 ? (
                      <span className="font-mono text-ink-faint">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={isSendingOtp}
                        className="font-bold text-navy hover:text-gold-text underline cursor-pointer disabled:opacity-50"
                      >
                        {isSendingOtp ? 'Sending...' : 'Resend Code'}
                      </button>
                    )}
                  </div>

                  {/* Verification Error Banner */}
                  {bookingError && (
                    <div className="p-2.5 rounded-xl bg-danger-soft text-danger border border-danger/20 flex items-start gap-2 text-[11px] animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{bookingError}</span>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Modal Footer with Dynamic Action Button */}
            <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
              <div className="text-xs text-ink-soft">
                Total: <strong className="text-navy font-mono text-sm">₹{totalAmountRupees}</strong>
              </div>

              {modalStep === 'details' ? (
                <button
                  disabled={phone.trim().length < 10 || !email.trim()}
                  onClick={handleProceedToStep2}
                  className="px-5 sm:px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:opacity-90 active:scale-95 transition disabled:opacity-40 flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <span>Proceed to Verification</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </button>
              ) : !otpSent ? (
                <div className="text-[11px] text-ink-faint italic">
                  Select SMS or Email above
                </div>
              ) : (
                <button
                  disabled={otpCode.length < 6 || isVerifyingOtp}
                  onClick={handleVerifyAndConfirm}
                  className="px-5 sm:px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:opacity-90 active:scale-95 transition disabled:opacity-40 flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Book</span>
                      <Check className="w-4 h-4 text-gold stroke-[3]" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function SlotGridSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Skeleton Group 1: Morning Sessions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full animate-skeleton" />
          <div className="w-44 sm:w-56 h-3.5 rounded-md animate-skeleton" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`m-skel-${i}`}
              className="p-3.5 rounded-2xl border border-border/60 bg-surface flex flex-col justify-between h-[86px] shadow-xs"
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <div className="w-16 h-4 rounded-md animate-skeleton" />
                <div className="w-12 h-4 rounded-md animate-skeleton" />
              </div>
              <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                <div className="w-12 h-4.5 rounded-md animate-skeleton" />
                <div className="w-10 h-3 rounded-md animate-skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Group 2: Afternoon Sessions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full animate-skeleton" />
          <div className="w-48 sm:w-60 h-3.5 rounded-md animate-skeleton" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`a-skel-${i}`}
              className="p-3.5 rounded-2xl border border-border/60 bg-surface flex flex-col justify-between h-[86px] shadow-xs"
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <div className="w-16 h-4 rounded-md animate-skeleton" />
                <div className="w-12 h-4 rounded-md animate-skeleton" />
              </div>
              <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                <div className="w-12 h-4.5 rounded-md animate-skeleton" />
                <div className="w-10 h-3 rounded-md animate-skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Group 3: Evening Sessions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full animate-skeleton" />
          <div className="w-52 sm:w-64 h-3.5 rounded-md animate-skeleton" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`e-skel-${i}`}
              className="p-3.5 rounded-2xl border border-border/60 bg-surface flex flex-col justify-between h-[86px] shadow-xs"
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <div className="w-16 h-4 rounded-md animate-skeleton" />
                <div className="w-12 h-4 rounded-md animate-skeleton" />
              </div>
              <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                <div className="w-12 h-4.5 rounded-md animate-skeleton" />
                <div className="w-10 h-3 rounded-md animate-skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
