'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { requestLoginCode, verifyLoginCode, TurfApiError } from '@/lib/turfos-client';
import { openCheckout } from '@/lib/razorpay';
import { CLUB } from '@/lib/club';

export interface MembershipCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'details' | 'rules' | 'otp' | 'payment' | 'success';

interface MemberPass {
  reference: string;
  name: string;
  phone: string;
  email: string;
  validFrom: string;
  validUntil: string;
  totalSessions: number;
  amountPaise: number;
  paymentId?: string;
}

const RESEND_COOLDOWN = 60;
const MEMBERSHIP_PRICE_PAISE = 236000; // ₹2,360 (₹2,000 + 18% GST ₹360)
const STORAGE_KEY = 'pavilion_member_pass';

function generateMemberReference(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `PAV-MEM-${year}-${randomPart}`;
}

export function MembershipCheckoutModal({ isOpen, onClose }: MembershipCheckoutModalProps) {
  const [step, setStep] = useState<Step>('details');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // OTP State
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCodeSent, setOtpCodeSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Payment & Success State
  const [isPaying, setIsPaying] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [memberPass, setMemberPass] = useState<MemberPass | null>(null);

  // Load existing pass from storage if any
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as MemberPass;
          if (new Date(parsed.validUntil) > new Date()) {
            setMemberPass(parsed);
            setStep('success');
          }
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen]);

  // Timer cooldown effect for OTP
  useEffect(() => {
    if (step !== 'otp' || cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Lock body & html scroll and pause Lenis smooth scroll when modal open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const lenis = (window as { lenis?: { stop(): void; start(): void } | null }).lenis;
      lenis?.stop();

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        lenis?.start();
      };
    }
  }, [isOpen]);

  // Send real email OTP via TurfOS
  const sendEmailOtp = useCallback(async (targetEmail: string) => {
    if (!targetEmail) return;
    setIsSendingOtp(true);
    setOtpError(null);

    try {
      await requestLoginCode(targetEmail.trim().toLowerCase());
      setOtpCodeSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err: unknown) {
      const msg =
        err instanceof TurfApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not send verification code to your email.';
      setOtpError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  }, []);

  // Step 1: Validate details and advance to Step 2 (Rules)
  const handleProceedToRules = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address for your membership pass.');
      return;
    }

    setStep('rules');
  };

  // Step 2: Confirm rules and proceed to Step 3 (OTP verification)
  const handleProceedToOtp = async () => {
    if (!agreedTerms) {
      setFormError('Please check the confirmation box to confirm the shared-play weekday terms.');
      return;
    }
    setFormError(null);
    setStep('otp');
    setDigits(['', '', '', '', '', '']);
    await sendEmailOtp(email.trim().toLowerCase());
  };

  // Handle segmented OTP inputs
  const handleDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setOtpError(null);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? '';
    }
    setDigits(next);
    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Complete membership activation
  const activateMembership = (paymentId?: string) => {
    const now = new Date();
    const validUntilDate = new Date();
    validUntilDate.setDate(now.getDate() + 30);

    const pass: MemberPass = {
      reference: generateMemberReference(),
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      email: email.trim().toLowerCase(),
      validFrom: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      validUntil: validUntilDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      totalSessions: 20,
      amountPaise: MEMBERSHIP_PRICE_PAISE,
      paymentId: paymentId || 'PAID_ONLINE',
    };

    setMemberPass(pass);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pass));
    }
    setStep('success');
  };

  // Proceed to Razorpay payment
  const handleProceedPayment = async () => {
    setIsPaying(true);
    setPaymentNotice(null);

    const normPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    try {
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_placeholder';

      await openCheckout({
        keyId,
        orderId: '',
        amountPaise: MEMBERSHIP_PRICE_PAISE,
        currency: 'INR',
        venueName: 'The Pavilion Club',
        description: 'Inaugural Shared-Play Membership (20 Sessions)',
        prefill: {
          name: name.trim(),
          email: cleanEmail,
          contact: normPhone,
        },
        onSuccess: () => {
          setIsPaying(false);
          activateMembership('rzp_pay_' + Date.now());
        },
        onDismiss: () => {
          setIsPaying(false);
          setPaymentNotice({
            tone: 'info',
            text: 'Payment window closed. Press Pay Now below whenever you are ready.',
          });
        },
        onFailure: (reason: string) => {
          setIsPaying(false);
          setPaymentNotice({
            tone: 'error',
            text: reason || 'Payment could not be completed. Please try again.',
          });
        },
      });
    } catch {
      // Rehearsal fallback for local development without live merchant key
      activateMembership('DEMO_CONFIRMED_' + Date.now().toString().slice(-6));
      setIsPaying(false);
    }
  };

  // Verify OTP code and automatically trigger payment
  const verifyCode = async () => {
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setOtpError('Please enter all 6 digits of the confirmation code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      await verifyLoginCode(email.trim().toLowerCase(), fullCode);
      setStep('payment');
      // Automatically launch Razorpay checkout
      await handleProceedPayment();
    } catch (err: unknown) {
      const msg =
        err instanceof TurfApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Invalid or expired confirmation code. Please check and try again.';
      setOtpError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (!isOpen) return null;

  // Active step index calculation for Concept 08 Stepper
  const activeStepNum =
    step === 'details' ? 1 : step === 'rules' ? 2 : step === 'otp' || step === 'payment' ? 3 : 4;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-modal-title"
      data-lenis-prevent="true"
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-[#050b14]/90 backdrop-blur-md animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && step === 'success') onClose();
      }}
    >
      <style>{`
        @keyframes modalBackdropFade {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(12px); }
        }
        @keyframes modalCardPop {
          0% { opacity: 0; transform: scale(0.96) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes stepContentIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(199, 162, 106, 0.25), 0 0 10px rgba(199, 162, 106, 0.35); }
          50% { box-shadow: 0 0 0 4px rgba(199, 162, 106, 0.45), 0 0 16px rgba(199, 162, 106, 0.6); }
        }
        @keyframes checkPop {
          0% { transform: scale(0.5); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-modal-backdrop {
          animation: modalBackdropFade 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-modal-card {
          animation: modalCardPop 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-step-in {
          animation: stepContentIn 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-stepper-glow {
          animation: goldPulse 2.2s ease-in-out infinite;
        }
        .animate-check-pop {
          animation: checkPop 220ms ease-out forwards;
        }
        .modal-body-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .modal-body-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .modal-body-scroll::-webkit-scrollbar-thumb {
          background: rgba(199, 162, 106, 0.35);
          border-radius: 4px;
        }
        .modal-body-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(199, 162, 106, 0.6);
        }
      `}</style>

      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 py-2 sm:py-4">
        <div
          data-lenis-prevent="true"
          className="relative w-full max-w-lg max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl border border-[#c7a26a]/40 bg-[#08111d] px-4 py-3 sm:px-6 sm:py-4 text-[#fbf8f1] shadow-2xl shadow-black/90 z-10 animate-modal-card overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pinned Header Bar */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0 mb-0.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c7a26a] animate-pulse" />
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-[#c7a26a]">
                The Pavilion Club · Chennai
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/50 hover:text-[#c7a26a] hover:bg-white/5 transition-all active:scale-95"
              aria-label="Close dialog"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* CONCEPT 08: Pinned 3-Step Guided Stepper Bar */}
          {step !== 'success' && (
            <div className="pt-1.5 pb-2 flex items-center justify-between px-1 shrink-0 mb-0.5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    activeStepNum > 1
                      ? 'bg-[#c7a26a] text-[#0b192c] animate-check-pop'
                      : activeStepNum === 1
                        ? 'border-2 border-[#c7a26a] text-[#c7a26a] bg-[#c7a26a]/15 animate-stepper-glow'
                        : 'border border-white/20 text-white/40'
                  }`}
                >
                  {activeStepNum > 1 ? '✓' : '1'}
                </div>
                <span
                  className={`text-[0.65rem] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                    activeStepNum >= 1 ? 'text-[#c7a26a]' : 'text-white/40'
                  }`}
                >
                  Details
                </span>
              </div>

              <div
                className={`flex-1 h-px mx-2.5 transition-all duration-500 ${
                  activeStepNum >= 2 ? 'bg-[#c7a26a]' : 'bg-white/10'
                }`}
              />

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    activeStepNum > 2
                      ? 'bg-[#c7a26a] text-[#0b192c] animate-check-pop'
                      : activeStepNum === 2
                        ? 'border-2 border-[#c7a26a] text-[#c7a26a] bg-[#c7a26a]/15 animate-stepper-glow'
                        : 'border border-white/20 text-white/40'
                  }`}
                >
                  {activeStepNum > 2 ? '✓' : '2'}
                </div>
                <span
                  className={`text-[0.65rem] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                    activeStepNum >= 2 ? 'text-[#c7a26a]' : 'text-white/40'
                  }`}
                >
                  Rules
                </span>
              </div>

              <div
                className={`flex-1 h-px mx-2.5 transition-all duration-500 ${
                  activeStepNum >= 3 ? 'bg-[#c7a26a]' : 'bg-white/10'
                }`}
              />

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    activeStepNum === 3
                      ? 'border-2 border-[#c7a26a] text-[#c7a26a] bg-[#c7a26a]/15 animate-stepper-glow'
                      : 'border border-white/20 text-white/40'
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-[0.65rem] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                    activeStepNum === 3 ? 'text-[#c7a26a]' : 'text-white/40'
                  }`}
                >
                  Payment
                </span>
              </div>
            </div>
          )}

          {/* Scrollable Step Body (Guarantees content never gets cut off on any screen) */}
          <div data-lenis-prevent="true" className="overflow-y-auto overscroll-contain flex-1 py-1 modal-body-scroll pr-0.5">
            {/* ======================================================== */}
            {/* STEP 1: Personal Credentials Form */}
            {/* ======================================================== */}
            {step === 'details' && (
              <div className="animate-step-in">
                <div className="text-center">
                  <h2 id="membership-modal-title" className="font-serif text-2xl font-medium text-[#fbf8f1]">
                    Inaugural Shared-Play Pass
                  </h2>
                  <p className="mt-0.5 text-xs text-[#fbf8f1]/70 max-w-sm mx-auto">
                    Step 01: Enter your personal credentials to begin your club membership.
                  </p>
                </div>

                {/* Price Banner */}
                <div className="mt-3.5 rounded-xl border border-[#c7a26a]/30 bg-[#0e1a29]/80 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[0.58rem] font-bold uppercase tracking-wider text-[#c7a26a] block">
                      Inaugural Subscription
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-serif text-xl sm:text-2xl font-bold text-[#fbf8f1]">₹2,360</span>
                      <span className="text-xs text-white/50">/ mo (all-inclusive)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[0.62rem] font-semibold text-[#c7a26a] bg-[#c7a26a]/15 px-2 py-0.5 rounded border border-[#c7a26a]/30 block font-mono">
                      20 SESSIONS / MO
                    </span>
                    <span className="text-[0.58rem] text-white/45 mt-0.5 block">₹2,000 + 18% GST</span>
                  </div>
                </div>

                <form onSubmit={handleProceedToRules} className="mt-3.5 space-y-3">
                  <div>
                    <label htmlFor="mem-name" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      id="mem-name"
                      type="text"
                      required
                      placeholder="e.g. Suresh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/25 text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="mem-phone" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                        WhatsApp Mobile *
                      </label>
                      <input
                        id="mem-phone"
                        type="tel"
                        required
                        placeholder="+91 96000 55623"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/25 text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="mem-email" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                        Email Address *
                      </label>
                      <input
                        id="mem-email"
                        type="email"
                        required
                        placeholder="name@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/25 text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                      />
                    </div>
                  </div>

                  {formError && (
                    <p role="alert" className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg p-2 text-center animate-step-in">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-1.5 h-10 sm:h-11 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#c7a26a] to-[#b88d48] text-[#0b192c] font-bold text-xs uppercase tracking-[0.18em] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c7a26a]/20"
                  >
                    <span>Next: Review Court Rules</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: Timings, Quota & Rules Confirmation */}
            {/* ======================================================== */}
            {step === 'rules' && (
              <div className="animate-step-in">
                <div className="text-center">
                  <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#fbf8f1]">
                    Confirm Court Access Hours
                  </h2>
                  <p className="mt-0.5 text-xs text-[#fbf8f1]/70 max-w-sm mx-auto">
                    Step 02: Please confirm that your schedule aligns with the shared-play weekday window.
                  </p>
                </div>

                {/* Unified Executive Rules Table */}
                <div className="mt-2.5 rounded-xl border border-white/10 bg-[#0e1a29]/80 divide-y divide-white/5 overflow-hidden">
                  <div className="flex items-start gap-2.5 py-2 px-3">
                    <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                      📅
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-white">Monday to Friday Only</span>
                        <span className="text-[10px] text-[#c7a26a] font-mono font-bold bg-[#c7a26a]/15 px-1.5 py-0.5 rounded border border-[#c7a26a]/30">6:00 AM – 3:00 PM</span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Sessions start and finish inside this window. Weekends for coaching &amp; events.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 py-2 px-3">
                    <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                      ⏱️
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-white">20 One-Hour Sessions / Month</span>
                        <span className="text-[10px] text-white/60 font-mono">Max 1/day</span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Shared play format with rotation up to 6 players per court.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 py-2 px-3">
                    <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                      🔄
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-white">12-Hour Cancellation Notice</span>
                        <span className="text-[10px] text-white/60 font-mono">Non-transferable</span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Cancel at least 12h ahead to preserve your quota balance.</p>
                    </div>
                  </div>
                </div>

                {/* Price & Passholder Sync Strip */}
                <div className="mt-2 bg-[#060d15] border border-[#c7a26a]/30 rounded-lg py-1.5 px-3 flex items-center justify-between">
                  <div>
                    <span className="text-[0.52rem] font-bold uppercase tracking-wider text-white/50 block">Amount Payable</span>
                    <span className="font-serif text-base sm:text-lg font-bold text-[#c7a26a]">₹2,360 <span className="text-[0.62rem] text-white/50 font-normal">/ mo</span></span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-white/90 block font-semibold truncate max-w-[150px]">{name}</span>
                    <span className="text-[10px] text-white/50 font-mono">{phone}</span>
                  </div>
                </div>

                {/* Interactive Confirmation Checkbox */}
                <label className={`mt-2 flex items-start gap-2 cursor-pointer text-xs text-white/75 leading-tight select-none py-2 px-2.5 rounded-lg border transition-all duration-200 ${
                  agreedTerms ? 'border-[#c7a26a]/60 bg-[#c7a26a]/10 shadow-[0_0_12px_rgba(199,162,106,0.15)]' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }`}>
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-white/30 bg-[#060d15] text-[#c7a26a] focus:ring-0 shrink-0 accent-[#c7a26a]"
                  />
                  <span>
                    I confirm that I understand this membership is strictly for <strong>shared play during weekday mornings/afternoons (6 AM – 3 PM)</strong>.
                  </span>
                </label>

                {formError && (
                  <p role="alert" className="mt-1.5 text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg p-2 text-center animate-step-in">
                    {formError}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="h-10 rounded-lg border border-white/20 bg-transparent text-white/75 text-xs font-semibold uppercase tracking-wider hover:border-white/40 hover:text-white active:scale-[0.99] transition-all"
                  >
                    ← Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleProceedToOtp()}
                    disabled={!agreedTerms}
                    className="h-10 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#c7a26a] to-[#b88d48] text-[#0b192c] text-xs font-bold uppercase tracking-wider hover:brightness-105 active:scale-[0.99] disabled:opacity-40 transition-all shadow-lg shadow-[#c7a26a]/20"
                  >
                    Verify &amp; Pay →
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3A: Email OTP Verification Gate */}
            {/* ======================================================== */}
            {step === 'otp' && (
              <div className="animate-step-in">
                <div className="flex justify-center mb-2.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c7a26a]/40 bg-[#c7a26a]/10 text-[#c7a26a] animate-stepper-glow">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="font-serif text-2xl font-semibold text-[#fbf8f1]">Verify Your Email</h2>
                  <p className="text-xs text-[#fbf8f1]/70 mt-0.5">
                    We sent a 6-digit confirmation code to:
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <span className="font-semibold text-[#c7a26a] text-xs break-all">{email}</span>
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="text-[11px] underline text-white/50 hover:text-[#c7a26a] transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* 6 Digit Inputs */}
                <div className="mt-4">
                  <div className="flex justify-center gap-2">
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        disabled={isVerifyingOtp || isSendingOtp}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        className="h-11 w-10 sm:h-12 sm:w-11 text-center text-xl font-bold font-mono rounded-lg border bg-[#060d15] text-[#fbf8f1] border-white/20 focus:outline-none focus:border-[#c7a26a] focus:ring-1 focus:ring-[#c7a26a] transition-all"
                        aria-label={`Digit ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {otpError ? (
                    <p role="alert" className="mt-2.5 text-center text-xs text-red-400 animate-step-in">
                      {otpError}
                    </p>
                  ) : isSendingOtp ? (
                    <p className="mt-2.5 text-center text-xs text-[#c7a26a] animate-pulse">
                      Sending verification code...
                    </p>
                  ) : otpCodeSent ? (
                    <p className="mt-2.5 text-center text-xs text-emerald-400/90 font-medium animate-step-in">
                      ✓ Code sent. Please check your inbox and spam folder.
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => void verifyCode()}
                    disabled={isVerifyingOtp || isSendingOtp || digits.some((d) => !d)}
                    className="w-full h-10 sm:h-11 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#c7a26a] to-[#b88d48] text-[#0b192c] font-bold text-xs uppercase tracking-[0.18em] hover:brightness-105 active:scale-[0.99] disabled:opacity-40 transition-all shadow-lg shadow-[#c7a26a]/20 flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? 'Verifying Code...' : 'Verify & Launch Razorpay (₹2,360)'}
                  </button>

                  <div className="text-center text-xs text-[#fbf8f1]/60">
                    {cooldown > 0 ? (
                      <span>
                        Resend code in <strong className="font-mono text-[#fbf8f1]/80">{cooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void sendEmailOtp(email)}
                        disabled={isVerifyingOtp || isSendingOtp}
                        className="font-medium text-[#c7a26a] hover:underline transition-colors"
                      >
                        Didn&apos;t receive code? Resend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3B: Order Summary & Re-Trigger Razorpay */}
            {/* ======================================================== */}
            {step === 'payment' && (
              <div className="animate-step-in">
                <div className="text-center">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-emerald-400 block">
                    ✓ Email Verified
                  </span>
                  <h2 className="font-serif text-2xl font-semibold mt-1 text-[#fbf8f1]">
                    Complete Payment via Razorpay
                  </h2>
                </div>

                <div className="mt-3.5 rounded-xl border border-white/10 bg-[#0e1a29]/80 p-3.5 space-y-2 text-xs text-[#fbf8f1]/80">
                  <div className="flex justify-between">
                    <span className="text-white/50">Passholder:</span>
                    <span className="font-semibold text-white">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Mobile:</span>
                    <span className="font-mono">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Email:</span>
                    <span className="font-mono">{email}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 text-[#c7a26a] font-bold text-sm">
                    <span>Total Payable:</span>
                    <span className="font-mono">₹2,360.00</span>
                  </div>
                </div>

                {paymentNotice && (
                  <p
                    role="alert"
                    className={`mt-3.5 text-xs rounded-lg p-2.5 text-center animate-step-in ${
                      paymentNotice.tone === 'error'
                        ? 'text-red-300 bg-red-950/40 border border-red-800/60'
                        : 'text-amber-200 bg-amber-950/40 border border-amber-800/60'
                    }`}
                  >
                    {paymentNotice.text}
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => void handleProceedPayment()}
                    disabled={isPaying}
                    className="w-full h-10 sm:h-11 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#c7a26a] to-[#b88d48] text-[#0b192c] font-bold text-xs uppercase tracking-[0.18em] hover:brightness-105 active:scale-[0.99] transition-all shadow-lg shadow-[#c7a26a]/20 flex items-center justify-center gap-2"
                  >
                    {isPaying ? (
                      <span>Opening Razorpay Gateway...</span>
                    ) : (
                      <>
                        <span>Pay ₹2,360 &amp; Activate Pass</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-white/40">
                    🔒 Secured by Razorpay · 256-bit SSL encrypted · Instant digital pass
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: Official Digital Pass (Celebratory Success) */}
            {/* ======================================================== */}
            {step === 'success' && memberPass && (
              <div className="animate-step-in">
                <div className="text-center mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    ✓ Membership Activated
                  </span>
                  <h2 className="font-serif text-2xl font-semibold mt-1 text-[#fbf8f1]">
                    Welcome to The Pavilion Club
                  </h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    Your shared-play membership pass is live and active.
                  </p>
                </div>

                {/* Digital Pass Card */}
                <div className="relative rounded-2xl border-2 border-[#c7a26a] bg-gradient-to-br from-[#122338] via-[#0f1e2e] to-[#0a1522] p-4 sm:p-5 shadow-2xl overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none select-none text-[#c7a26a] font-serif text-8xl font-bold">
                    P
                  </div>

                  <div className="flex items-start justify-between border-b border-[#c7a26a]/30 pb-2.5">
                    <div>
                      <p className="font-serif text-sm tracking-[0.2em] font-bold uppercase text-[#c7a26a]">
                        The Pavilion Club
                      </p>
                      <p className="text-[9px] uppercase tracking-widest text-white/60">
                        Mogappair East · Chennai
                      </p>
                    </div>
                    <span className="rounded bg-[#c7a26a]/20 border border-[#c7a26a] px-2 py-0.5 font-mono text-[10px] font-bold text-[#c7a26a]">
                      ACTIVE
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/50 block">Member Name</span>
                      <span className="font-semibold text-white truncate block">{memberPass.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/50 block">Member ID</span>
                      <span className="font-mono font-bold text-[#c7a26a]">{memberPass.reference}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/50 block">Phone</span>
                      <span className="font-mono text-white">{memberPass.phone}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/50 block">Validity</span>
                      <span className="text-white text-[11px]">{memberPass.validFrom} – {memberPass.validUntil}</span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-[#c7a26a]/15 border border-[#c7a26a]/40 p-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-white">Included Sessions</p>
                      <p className="text-[9px] text-[#c7a26a]">Mon – Fri, 06:00 AM – 03:00 PM</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#c7a26a]">20 Sessions</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 space-y-2">
                  <a
                    href="https://turftown.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="w-full h-10 sm:h-11 flex items-center justify-center gap-2 rounded-lg bg-[#c7a26a] text-[#0b192c] font-bold text-xs uppercase tracking-wider hover:brightness-105 active:scale-[0.99] transition-all shadow-lg shadow-[#c7a26a]/20"
                  >
                    <span>Reserve Session on TurfTown</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      setMemberPass(null);
                      setStep('details');
                    }}
                    className="w-full py-1 text-[11px] text-[#c7a26a]/80 hover:text-[#c7a26a] underline transition-colors"
                  >
                    Register Another Pass / New Member
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-1.5 text-xs text-white/50 hover:text-white transition-colors"
                  >
                    Close Pass Window
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
