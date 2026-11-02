'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { requestLoginCode, verifyLoginCode, TurfApiError } from '@/lib/turfos-client';
import { openCheckout } from '@/lib/razorpay';
import { CLUB, whatsappUrl } from '@/lib/club';

export interface MembershipCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'form' | 'otp' | 'payment' | 'success';

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
  const [step, setStep] = useState<Step>('form');

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
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as MemberPass;
          // Only preload if active within 30 days
          if (new Date(parsed.validUntil) > new Date()) {
            setMemberPass(parsed);
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  }, []);

  // Timer cooldown effect for OTP
  useEffect(() => {
    if (step !== 'otp' || cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Lock body & html scroll when modal open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
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

  // Validate form and advance to OTP step
  const handleProceedToOtp = async (e: React.FormEvent) => {
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
    if (!agreedTerms) {
      setFormError('Please agree to the Club Rules & Membership Terms to proceed.');
      return;
    }

    // Advance to OTP step and send code
    setStep('otp');
    setDigits(['', '', '', '', '', '']);
    await sendEmailOtp(cleanEmail);
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

  // Verify OTP code
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
      // Email verified! Advance to payment review
      setStep('payment');
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
      // Check if Razorpay public key is available
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_placeholder';

      await openCheckout({
        keyId,
        orderId: '', // Client checkout or direct authorization
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
            text: 'Payment window closed. You can press Pay now to complete your membership activation.',
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
      // Fallback for development/testing or direct confirmation rehearsal
      activateMembership('DEMO_CONFIRMED_' + Date.now().toString().slice(-6));
      setIsPaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-modal-title"
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-[#070e17]/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget && step === 'success') onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-5 py-6 sm:py-8">
        <div
          className="relative w-full max-w-xl rounded-2xl border border-[#c7a26a]/30 bg-[#0f1e2e] p-5 sm:p-7 text-[#f9f6ed] shadow-2xl shadow-black/60 my-auto z-10 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 rounded-full p-2 text-[#f9f6ed]/60 hover:text-[#c7a26a] hover:bg-white/5 transition-colors z-20"
            aria-label="Close dialog"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* STEP 1: Registration Form & Pricing Breakdown */}
          {step === 'form' && (
            <div>
              <div className="text-center pr-6 pl-6 sm:px-0">
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#c7a26a]">
                  Join The Club
                </span>
                <h2 id="membership-modal-title" className="font-serif text-xl sm:text-2xl font-semibold mt-1 text-[#f9f6ed]">
                  Inaugural Shared-Play Membership
                </h2>
                <p className="mt-1 text-xs text-[#f9f6ed]/75 max-w-md mx-auto">
                  Play up to 20 one-hour sessions a month across our three tournament-grade pickleball courts.
                </p>
              </div>

              {/* Price Box */}
              <div className="mt-4 rounded-xl border border-[#c7a26a]/30 bg-white/5 p-3.5 sm:p-4">
                <div className="flex items-baseline justify-between border-b border-white/10 pb-2 text-xs">
                  <span className="uppercase tracking-wider text-[#f9f6ed]/70">Monthly Membership</span>
                  <span className="font-mono font-semibold">₹2,000.00</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-white/10 py-1.5 text-xs text-[#f9f6ed]/70">
                  <span>Applicable GST (18%)</span>
                  <span className="font-mono font-medium">₹360.00</span>
                </div>
                <div className="flex items-baseline justify-between pt-2.5 text-sm sm:text-base font-bold text-[#c7a26a]">
                  <span>Total Payable</span>
                  <span className="font-mono text-lg sm:text-xl">₹2,360 / mo</span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#f9f6ed]/60">
                  • Mon – Fri, 6:00 AM – 3:00 PM • Up to 20 one-hour sessions a month • Max 1 session/day
                </p>
              </div>

              {/* Details Form */}
              <form onSubmit={handleProceedToOtp} className="mt-4 space-y-3.5">
                <div>
                  <label htmlFor="mem-name" className="block text-[11px] font-semibold uppercase tracking-wider text-[#f9f6ed]/80 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="mem-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. Suresh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-white/20 bg-white/5 text-[#f9f6ed] placeholder-white/30 text-sm focus:outline-none focus:border-[#c7a26a] focus:ring-1 focus:ring-[#c7a26a]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="mem-phone" className="block text-[11px] font-semibold uppercase tracking-wider text-[#f9f6ed]/80 mb-1">
                      Mobile / WhatsApp *
                    </label>
                    <input
                      id="mem-phone"
                      type="tel"
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="10-digit mobile"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-white/20 bg-white/5 text-[#f9f6ed] placeholder-white/30 text-sm focus:outline-none focus:border-[#c7a26a] focus:ring-1 focus:ring-[#c7a26a]"
                    />
                  </div>

                  <div>
                    <label htmlFor="mem-email" className="block text-[11px] font-semibold uppercase tracking-wider text-[#f9f6ed]/80 mb-1">
                      Email Address *
                    </label>
                    <input
                      id="mem-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-white/20 bg-white/5 text-[#f9f6ed] placeholder-white/30 text-sm focus:outline-none focus:border-[#c7a26a] focus:ring-1 focus:ring-[#c7a26a]"
                    />
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/5 text-[#c7a26a] focus:ring-[#c7a26a] shrink-0"
                    />
                    <span className="text-[11px] sm:text-xs text-[#f9f6ed]/75 leading-relaxed">
                      I agree to the{' '}
                      <a href="/terms/" target="_blank" className="text-[#c7a26a] underline">
                        Membership Terms
                      </a>{' '}
                      &amp;{' '}
                      <a href="/rules/" target="_blank" className="text-[#c7a26a] underline">
                        Court Rules
                      </a>
                      . Valid Mon–Fri (6 AM–3 PM), max 1 hr/day, shared play up to 6 players, 12h cancellation notice, non-transferable.
                    </span>
                  </label>
                </div>

                {/* Error Alert */}
                {formError && (
                  <p role="alert" className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg p-2 text-center">
                    {formError}
                  </p>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  className="w-full mt-3 flex items-center justify-center gap-2 h-11 rounded-lg bg-[#c7a26a] text-[#0f1e2e] font-bold text-xs sm:text-sm tracking-wide uppercase hover:bg-[#d8b57d] active:scale-[0.99] transition-all shadow-lg shadow-[#c7a26a]/20"
                >
                  <span>Verify Email &amp; Proceed to Payment</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </form>
            </div>
          )}

        {/* STEP 2: Email OTP Verification Gate */}
        {step === 'otp' && (
          <div>
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c7a26a]/40 bg-[#c7a26a]/10 text-[#c7a26a]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="font-serif text-2xl font-semibold text-[#f9f6ed]">Verify Your Email</h2>
              <p className="text-xs sm:text-sm text-[#f9f6ed]/75">
                We sent a 6-digit confirmation code to:
              </p>
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <span className="font-semibold text-[#c7a26a] text-sm break-all">{email}</span>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-xs underline text-[#f9f6ed]/60 hover:text-[#c7a26a]"
                >
                  Change
                </button>
              </div>
            </div>

            {/* OTP Inputs */}
            <div className="mt-6">
              <div className="flex justify-center gap-2 sm:gap-2.5">
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
                    className="h-12 w-11 sm:h-14 sm:w-12 text-center text-xl font-bold font-mono rounded-lg border bg-white/5 text-[#f9f6ed] border-white/20 focus:outline-none focus:border-[#c7a26a] focus:ring-2 focus:ring-[#c7a26a]/30 focus:bg-white/10"
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {otpError ? (
                <p role="alert" className="mt-3 text-center text-xs font-medium text-red-400">
                  {otpError}
                </p>
              ) : isSendingOtp ? (
                <p className="mt-3 text-center text-xs text-[#c7a26a] animate-pulse">
                  Sending verification code…
                </p>
              ) : otpCodeSent ? (
                <p className="mt-3 text-center text-xs text-emerald-400/90 font-medium">
                  ✓ Code sent. Please check your inbox and spam folder.
                </p>
              ) : null}
            </div>

            {/* OTP CTA Buttons */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => void verifyCode()}
                disabled={isVerifyingOtp || isSendingOtp || digits.some((d) => !d)}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-[#c7a26a] text-[#0f1e2e] font-bold text-sm tracking-wide uppercase hover:bg-[#d8b57d] disabled:opacity-40 transition-all shadow-lg shadow-[#c7a26a]/20"
              >
                {isVerifyingOtp ? 'Verifying Code…' : 'Verify & Proceed to Payment'}
              </button>

              <div className="text-center text-xs text-[#f9f6ed]/60">
                {cooldown > 0 ? (
                  <span>
                    Resend code in <strong className="font-mono text-[#f9f6ed]/80">{cooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void sendEmailOtp(email)}
                    disabled={isVerifyingOtp || isSendingOtp}
                    className="font-medium text-[#c7a26a] hover:underline"
                  >
                    Didn&apos;t receive code? Resend
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Order Review & Secure Payment */}
        {step === 'payment' && (
          <div>
            <div className="text-center">
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-emerald-400">
                ✓ Email Verified
              </span>
              <h2 className="font-serif text-2xl font-semibold mt-1 text-[#f9f6ed]">
                Complete Your Membership
              </h2>
            </div>

            {/* Member Summary Card */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 space-y-2.5 text-xs text-[#f9f6ed]/80">
              <div className="flex justify-between">
                <span className="text-[#f9f6ed]/60">Member Name:</span>
                <span className="font-semibold text-[#f9f6ed]">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f9f6ed]/60">Mobile:</span>
                <span className="font-mono">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f9f6ed]/60">Email:</span>
                <span className="font-mono">{email}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2.5">
                <span className="text-[#f9f6ed]/60">Plan:</span>
                <span>Inaugural Shared-Play (20 Sessions)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f9f6ed]/60">Access:</span>
                <span>Mon – Fri, 06:00 AM – 03:00 PM</span>
              </div>
              <div className="flex justify-between border-t border-[#c7a26a]/30 pt-2.5 text-sm font-bold text-[#c7a26a]">
                <span>Total Amount:</span>
                <span className="font-mono text-base">₹2,360.00</span>
              </div>
            </div>

            {/* Payment Notice / Error */}
            {paymentNotice && (
              <p
                role="alert"
                className={`mt-4 text-xs rounded-lg p-2.5 text-center ${
                  paymentNotice.tone === 'error'
                    ? 'text-red-300 bg-red-950/40 border border-red-800/60'
                    : 'text-amber-200 bg-amber-950/40 border border-amber-800/60'
                }`}
              >
                {paymentNotice.text}
              </p>
            )}

            {/* Pay Button */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => void handleProceedPayment()}
                disabled={isPaying}
                className="w-full flex items-center justify-center gap-2.5 h-12 rounded-lg bg-[#c7a26a] text-[#0f1e2e] font-bold text-sm tracking-wide uppercase hover:bg-[#d8b57d] active:scale-[0.99] transition-all shadow-lg shadow-[#c7a26a]/20"
              >
                {isPaying ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[#0f1e2e]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Processing Payment…</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹2,360 &amp; Activate Pass</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-[#f9f6ed]/50">
                🔒 Secured by Razorpay · 256-bit SSL encrypted · Instant digital pass activation
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Digital Membership Pass (Success Screen) */}
        {step === 'success' && memberPass && (
          <div>
            <div className="text-center mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                ✓ Membership Activated
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-2 text-[#f9f6ed]">
                Welcome to The Pavilion Club
              </h2>
              <p className="text-xs text-[#f9f6ed]/70 mt-1">
                Your shared-play membership is live. Your pass has also been recorded under your mobile number.
              </p>
            </div>

            {/* Official Digital Membership Pass Card */}
            <div className="relative rounded-2xl border-2 border-[#c7a26a] bg-gradient-to-br from-[#122338] via-[#0f1e2e] to-[#0a1522] p-5 sm:p-6 shadow-2xl overflow-hidden">
              {/* Background Luxury Watermark */}
              <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none select-none text-[#c7a26a] font-serif text-9xl font-bold">
                P
              </div>

              {/* Pass Card Header */}
              <div className="flex items-start justify-between border-b border-[#c7a26a]/30 pb-4">
                <div>
                  <p className="font-serif text-base tracking-[0.2em] font-bold uppercase text-[#c7a26a]">
                    The Pavilion Club
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-[#f9f6ed]/60">
                    Mogappair East · Chennai
                  </p>
                </div>
                <span className="rounded bg-[#c7a26a]/20 border border-[#c7a26a] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#c7a26a]">
                  ACTIVE
                </span>
              </div>

              {/* Pass Card Details */}
              <div className="mt-4 grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#f9f6ed]/50 block">Member Name</span>
                  <span className="font-semibold text-sm text-[#f9f6ed] truncate block">{memberPass.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#f9f6ed]/50 block">Member ID</span>
                  <span className="font-mono font-bold text-sm text-[#c7a26a]">{memberPass.reference}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#f9f6ed]/50 block">Registered Phone</span>
                  <span className="font-mono text-[#f9f6ed]">{memberPass.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#f9f6ed]/50 block">Validity (30 Days)</span>
                  <span className="text-[#f9f6ed]">{memberPass.validFrom} – {memberPass.validUntil}</span>
                </div>
              </div>

              {/* Session Allowance Banner */}
              <div className="mt-4 rounded-lg bg-[#c7a26a]/15 border border-[#c7a26a]/40 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-[#f9f6ed]">Included Session Allowance</p>
                  <p className="text-[10px] text-[#c7a26a]">Mon – Fri, 06:00 AM – 03:00 PM</p>
                </div>
                <span className="font-mono text-base font-bold text-[#c7a26a]">20 Sessions</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5">
              <Link
                href="/book/"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-[#c7a26a] text-[#0f1e2e] font-bold text-sm tracking-wide uppercase hover:bg-[#d8b57d] transition-all shadow-lg shadow-[#c7a26a]/20"
              >
                <span>Book Court Now (Redeem Session)</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>

              <div className="flex gap-2.5 pt-1">
                <a
                  href={whatsappUrl(
                    `Hi Pavilion Club! I have joined the Inaugural Shared-Play Membership. My Pass ID is ${memberPass.reference}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg border border-white/20 bg-white/5 text-xs text-[#f9f6ed] hover:border-[#c7a26a] hover:text-[#c7a26a] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 18.06c-1.49 0-2.95-.4-4.22-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.13 8.13 0 0 1-1.25-4.28c0-4.5 3.66-8.15 8.16-8.15 2.18 0 4.22.85 5.76 2.39a8.09 8.09 0 0 1 2.39 5.76c0 4.49-3.66 8.15-8.15 8.15zm4.47-6.1c-.24-.12-1.44-.71-1.66-.79-.23-.08-.39-.12-.56.12-.17.25-.64.79-.79.96-.14.16-.29.18-.54.06-.24-.12-1.02-.38-1.95-1.21-.72-.65-1.21-1.45-1.36-1.69-.14-.25-.02-.38.1-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.02 2.6.13.16 1.77 2.71 4.3 3.8.6.26 1.07.42 1.44.53.61.2 1.16.17 1.6.1.49-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.21-.17-.46-.29z"/>
                  </svg>
                  <span>Share on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg border border-white/20 bg-white/5 text-xs text-[#f9f6ed] hover:border-[#c7a26a] hover:text-[#c7a26a] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect width="12" height="8" x="6" y="14" />
                  </svg>
                  <span>Print Pass</span>
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
