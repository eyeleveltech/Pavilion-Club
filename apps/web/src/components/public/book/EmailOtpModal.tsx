'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { requestLoginCode, verifyLoginCode, TurfApiError } from '@/lib/turfos-client';
import { cx } from './ui';

interface EmailOtpModalProps {
  isOpen: boolean;
  email: string;
  slotDetails?: string | undefined;
  courtName?: string | undefined;
  amountFormatted?: string | undefined;
  onVerify: () => Promise<void> | void;
  onClose: () => void;
  onChangeEmail: () => void;
}

const RESEND_COOLDOWN = 60;

export function EmailOtpModal({
  isOpen,
  email,
  slotDetails,
  courtName,
  amountFormatted,
  onVerify,
  onClose,
  onChangeEmail,
}: EmailOtpModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send real OTP code to customer email via TurfOS
  const sendEmailOtp = useCallback(async () => {
    if (!email) return;
    setIsSending(true);
    setError(null);

    try {
      await requestLoginCode(email.trim().toLowerCase());
      setCodeSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err: unknown) {
      const msg =
        err instanceof TurfApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not send verification code to your email.';
      setError(msg);
    } finally {
      setIsSending(false);
    }
  }, [email]);

  // Initial code dispatch when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      void sendEmailOtp();
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setIsVerifying(false);
      setIsSending(false);
      setCodeSent(false);
    }
  }, [isOpen, sendEmailOtp]);

  // Countdown timer for resend
  useEffect(() => {
    if (!isOpen || cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, cooldown]);

  // Handle single digit changes
  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, '');

    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    const char = cleaned.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);

    // Auto-advance to next input
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits filled, trigger verification
    if (index === 5 || nextDigits.every((d) => d !== '')) {
      const fullCode = nextDigits.join('');
      if (fullCode.length === 6) {
        void verifyCode(fullCode);
      }
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste of full 6-digit code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasted[i] || '';
    }
    setDigits(nextDigits);

    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === 6) {
      void verifyCode(pasted);
    }
  };

  // Verify the entered code against TurfOS
  const verifyCode = async (enteredCode?: string) => {
    const codeToVerify = enteredCode || digits.join('');
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await verifyLoginCode(email.trim().toLowerCase(), codeToVerify);
      await onVerify();
    } catch (err: unknown) {
      const msg =
        err instanceof TurfApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'That verification code did not work. Please check and try again.';
      setError(msg);
      setIsVerifying(false);
      inputRefs.current[5]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-otp-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f1e2e]/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
    >
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#c7a26a]/30 bg-[#0f1e2e] text-[#F9F6ED] shadow-2xl p-6 sm:p-8">
        {/* Subtle gold luxury ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#c7a26a]/15 blur-3xl"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isVerifying}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#F9F6ED]/60 hover:bg-white/10 hover:text-[#F9F6ED] transition-colors disabled:opacity-30"
          aria-label="Close verification modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c7a26a]/40 bg-[#c7a26a]/10 text-[#c7a26a] shadow-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>

        {/* Title & Email Info */}
        <div className="text-center space-y-1.5">
          <h2 id="email-otp-title" className="font-serif text-2xl font-semibold tracking-tight text-[#F9F6ED]">
            Verify Your Email
          </h2>
          <p className="text-sm text-[#F9F6ED]/75 leading-relaxed">
            {isSending
              ? 'Sending a 6-digit confirmation code to:'
              : 'We have sent a 6-digit confirmation code to:'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="font-semibold text-[#c7a26a] break-all text-[15px]">{email}</span>
            <button
              type="button"
              onClick={onChangeEmail}
              disabled={isVerifying}
              className="text-xs underline text-[#F9F6ED]/60 hover:text-[#c7a26a] transition-colors"
            >
              Change
            </button>
          </div>
        </div>

        {/* Booking Summary Pill */}
        {(slotDetails || courtName) && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-[#F9F6ED]/80">
            <span className="truncate font-medium">{slotDetails || 'Pickleball Booking'} · {courtName || 'Court'}</span>
            {amountFormatted && (
              <span className="font-semibold text-[#c7a26a] ml-2 shrink-0">{amountFormatted}</span>
            )}
          </div>
        )}

        {/* 6-Digit Segmented OTP Inputs */}
        <div className="mt-6">
          <div className="flex justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={isVerifying || isSending}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={cx(
                  'h-12 w-11 sm:h-14 sm:w-12 text-center text-xl font-bold font-mono rounded-lg border bg-white/5 text-[#F9F6ED] transition-all',
                  'focus:outline-none focus:border-[#c7a26a] focus:ring-2 focus:ring-[#c7a26a]/30 focus:bg-white/10',
                  error ? 'border-red-400/80 text-red-200' : digit ? 'border-[#c7a26a] bg-white/10' : 'border-white/20',
                  (isVerifying || isSending) && 'opacity-60 cursor-not-allowed'
                )}
                aria-label={'Digit ' + (idx + 1) + ' of verification code'}
              />
            ))}
          </div>

          {/* Status / Error Message */}
          {error ? (
            <p role="alert" className="mt-3 text-center text-xs font-medium text-red-400 animate-in fade-in">
              {error}
            </p>
          ) : isSending ? (
            <p className="mt-3 text-center text-xs text-[#c7a26a] animate-pulse">
              Sending verification code to your email…
            </p>
          ) : codeSent ? (
            <p className="mt-3 text-center text-xs text-emerald-400/90 font-medium">
              ✓ Verification code sent. Please check your inbox & spam folder.
            </p>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => void verifyCode()}
            disabled={isVerifying || isSending || digits.some((d) => !d)}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-[#c7a26a] text-[#0f1e2e] font-semibold text-[15px] hover:bg-[#d8b57d] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#c7a26a]/20"
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin h-4 w-4 text-[#0f1e2e]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Verifying…</span>
              </>
            ) : (
              <span>Verify & Proceed to Payment</span>
            )}
          </button>

          {/* Resend Timer / Action */}
          <div className="text-center pt-1 text-xs text-[#F9F6ED]/60">
            {cooldown > 0 ? (
              <span>Resend code in <strong className="font-mono text-[#F9F6ED]/80">{cooldown}s</strong></span>
            ) : (
              <button
                type="button"
                onClick={() => void sendEmailOtp()}
                disabled={isVerifying || isSending}
                className="font-medium text-[#c7a26a] hover:underline disabled:opacity-40"
              >
                Didn&apos;t receive the email? Resend code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
