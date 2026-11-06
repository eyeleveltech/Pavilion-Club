'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { requestLoginCode, verifyLoginCode, TurfApiError } from '@/lib/turfos-client';
import { openCheckout, getRazorpayKeyId } from '@/lib/razorpay';
import { addPickleballEnquiry } from '@/lib/enquiry-store';
import { CLUB, whatsappUrl } from '@/lib/club';
import { GoldButton } from '@/components/public/site/GoldButton';

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


interface LuxuryMetalPassCardProps {
  memberPass: MemberPass;
}

function LuxuryMetalPassCard({ memberPass }: LuxuryMetalPassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  const copyNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(memberPass.reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Format reference as clean spaced ID: e.g., PAV 2026 8492
  const formattedNumber = memberPass.reference.replace(/-/g, ' ');

  // Format valid thru as MM/YY: e.g. 12/26
  const untilDate = new Date(memberPass.validUntil);
  const validThru = isNaN(untilDate.getTime())
    ? '12/26'
    : `${String(untilDate.getMonth() + 1).padStart(2, '0')}/${String(untilDate.getFullYear()).slice(-2)}`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
        aspectRatio: '1.586',
        background: 'linear-gradient(135deg, #444b58 0%, #2b323e 35%, #181d26 70%, #0d1117 100%)',
      }}
      className="relative mx-auto w-full max-w-[400px] rounded-[22px] select-none cursor-pointer overflow-hidden p-4 sm:p-5 flex flex-col justify-between border border-white/15 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.12),inset_0_1px_1.5px_rgba(255,255,255,0.35),inset_0_-1px_1.5px_rgba(0,0,0,0.6)]"
    >
      {/* Dynamic Sheen Layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-[3]"
        style={{
          opacity: isHovered ? 1 : 0.6,
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 65%)`,
        }}
      />

      {/* 3D Debossed Guilloche Rosette Medallion (Top-Right) */}
      <svg
        className="absolute -top-[42px] -right-[42px] w-[275px] h-[275px] pointer-events-none z-[1] opacity-90"
        style={{
          filter: 'drop-shadow(1px 1px 0px rgba(255, 255, 255, 0.22)) drop-shadow(-1.2px -1.2px 0px rgba(0, 0, 0, 0.85))',
        }}
        viewBox="0 0 240 240"
        fill="none"
      >
        <circle cx="170" cy="70" r="130" stroke="rgba(0,0,0,0.85)" strokeWidth="2.5" />
        <circle cx="170" cy="70" r="130" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />

        <circle cx="170" cy="70" r="115" stroke="rgba(0,0,0,0.85)" strokeWidth="2.5" />
        <circle cx="170" cy="70" r="115" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />

        <circle cx="170" cy="70" r="100" stroke="rgba(0,0,0,0.7)" strokeWidth="2" />
        <circle cx="170" cy="70" r="100" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

        <circle cx="170" cy="70" r="85" stroke="rgba(0,0,0,0.85)" strokeWidth="2.5" />
        <circle cx="170" cy="70" r="85" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />

        <circle cx="170" cy="70" r="70" stroke="rgba(0,0,0,0.7)" strokeWidth="2" />
        <circle cx="170" cy="70" r="70" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

        <circle cx="170" cy="70" r="55" stroke="rgba(0,0,0,0.85)" strokeWidth="2.5" />
        <circle cx="170" cy="70" r="55" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />

        {/* Guilloche Rays */}
        <g stroke="rgba(255,255,255,0.2)" strokeWidth="1.4" strokeLinecap="round">
          <line x1="170" y1="-50" x2="170" y2="-25" />
          <line x1="170" y1="165" x2="170" y2="190" />
          <line x1="50" y1="70" x2="75" y2="70" />
          <line x1="265" y1="70" x2="290" y2="70" />
          <line x1="85" y1="-15" x2="102" y2="2" />
          <line x1="238" y1="138" x2="255" y2="155" />
          <line x1="85" y1="155" x2="102" y2="138" />
          <line x1="238" y1="2" x2="255" y2="-15" />
        </g>

        {/* 5-Pointed Stars along concentric arc */}
        <g fill="rgba(255,255,255,0.22)">
          <polygon points="90,45 93,52 101,52 95,57 97,64 90,60 83,64 85,57 79,52 87,52" />
          <polygon points="120,5 123,12 131,12 125,17 127,24 120,20 113,24 115,17 109,12 117,12" />
          <polygon points="80,105 83,112 91,112 85,117 87,124 80,120 73,124 75,117 69,112 77,112" />
        </g>

        {/* Debossed Center Pavilion P-C Monogram Inside Medallion */}
        <g transform="translate(138, 20) scale(1.05)">
          <rect x="2" y="2" width="60" height="96" rx="28" stroke="rgba(0,0,0,0.85)" strokeWidth="3.5" fill="none" />
          <rect x="2" y="2" width="60" height="96" rx="28" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" fill="none" />
          <path d="M30 26 L30 76" stroke="rgba(0,0,0,0.85)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M30 26 L30 76" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M30 26 H37 C43 26 48 30 48 37 C48 42 45 45 42 46" stroke="rgba(0,0,0,0.85)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M30 26 H37 C43 26 48 30 48 37 C48 42 45 45 42 46" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M42 46 C36 44 32 44.5 30 46 C23 48 18 53 18 61 C18 69 23 75 30 77 C37 79 43 77 47 73" stroke="rgba(0,0,0,0.85)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M42 46 C36 44 32 44.5 30 46 C23 48 18 53 18 61 C18 69 23 75 30 77 C37 79 43 77 47 73" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>
      </svg>

      {/* Floating Action Pills (Top-Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
        <a
          href="#wallet"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            alert('Pass download prepared for Apple Wallet');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#090b0e]/90 border border-white/15 text-[10px] sm:text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] backdrop-blur-md hover:scale-[1.02] transition-transform"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M15 12H18" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M6 9H12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Add to Apple Wallet</span>
        </a>

        <button
          type="button"
          onClick={copyNumber}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#090b0e] text-[10px] sm:text-[11px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.35)] hover:scale-[1.02] transition-transform"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{copied ? 'Copied!' : 'Copy number'}</span>
        </button>
      </div>

      {/* Top Left: Official Emblem & Brand Title */}
      <div className="relative z-10 flex items-center gap-2 max-w-[130px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Pavilion_monogram.png"
          alt="Pavilion Club Monogram"
          className="w-10 h-10 object-contain shrink-0"
          style={{
            filter: 'brightness(1.8) drop-shadow(-1px -1px 0px rgba(0,0,0,0.8)) drop-shadow(1px 1px 0px rgba(255,255,255,0.35))',
          }}
        />
        <div className="flex flex-col overflow-hidden">
          <span className="font-serif text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] leading-tight">
            The Pavilion Club
          </span>
          <span className="text-[7.5px] font-semibold tracking-[0.12em] uppercase text-white/60 mt-0.5 whitespace-nowrap">
            Mogappair East
          </span>
        </div>
      </div>

      {/* Card Footer Details */}
      <div className="relative z-10 flex justify-between items-end">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-semibold text-white/70">Inaugural Shared-Play</span>
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white">
              Founding Member
            </span>
          </div>
          <div className="font-sans text-xl sm:text-2xl font-extrabold tracking-[0.08em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] leading-tight">
            {formattedNumber}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-white/75 mt-1">
            {memberPass.name || 'Member'}
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-white/60">
            Valid Thru
          </span>
          <span className="font-mono text-xs sm:text-sm font-bold text-white leading-tight mt-0.5">
            {validThru}
          </span>
          <span className="text-[8px] font-bold tracking-wider uppercase text-white/60 mt-0.5">
            20 Sessions · Mon–Fri
          </span>
        </div>
      </div>
    </div>
  );
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
      const params = new URLSearchParams(window.location.search);
      if (params.get('pass') === 'preview' || window.location.hash === '#pass') {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + 30);
        setMemberPass({
          reference: 'PAV-2026-8492',
          name: 'Suresh Kumar',
          email: 'suresh.kumar@example.com',
          phone: '+91 96000 55623',
          validFrom: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          validUntil: future.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          totalSessions: 20,
          amountPaise: 236000,
                  });
        setStep('success');
        return;
      }
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
    const ref = generateMemberReference();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const finalPaymentId = paymentId || `pay_${Date.now().toString(36)}`;

    const pass: MemberPass = {
      reference: ref,
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      validFrom: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      validUntil: validUntilDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      totalSessions: 20,
      amountPaise: MEMBERSHIP_PRICE_PAISE,
      paymentId: finalPaymentId,
    };

    setMemberPass(pass);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pass));
    }

    // Auto-save to Front Desk Enquiries Console
    addPickleballEnquiry({
      reference: ref,
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      plan: 'Inaugural Shared-Play Membership (20 Sessions)',
      sessions: 20,
      amountPaise: MEMBERSHIP_PRICE_PAISE,
      paymentId: finalPaymentId,
    });

    setStep('success');
  };

  // Proceed to Razorpay payment
  const handleProceedPayment = async () => {
    setIsPaying(true);
    setPaymentNotice(null);

    const rawDigits = phone.replace(/\D/g, '');
    const normPhone = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits.slice(-10);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const keyId = getRazorpayKeyId();

      if (!keyId || keyId === 'rzp_live_placeholder') {
        // Local dev / rehearsal simulation fallback
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          setTimeout(() => {
            setIsPaying(false);
            activateMembership('TEST_PAY_' + Math.random().toString(36).substring(2, 9).toUpperCase());
          }, 600);
          return;
        }

        setPaymentNotice({
          tone: 'error',
          text: 'Razorpay Key ID is not configured. Please add razorpayKeyId in /club-config.js on Hostinger or NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local.',
        });
        setIsPaying(false);
        return;
      }

      await openCheckout({
        keyId,
        amountPaise: MEMBERSHIP_PRICE_PAISE,
        currency: 'INR',
        venueName: 'The Pavilion Club',
        description: 'Inaugural Shared-Play Membership (20 Sessions)',
        prefill: {
          name: name.trim(),
          email: cleanEmail,
          contact: normPhone,
        },
        onSuccess: (paymentId) => {
          setIsPaying(false);
          activateMembership(paymentId || ('pay_' + Date.now().toString(36)));
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
    } catch (err: unknown) {
      setIsPaying(false);
      // Fallback only for local development on localhost
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        activateMembership('TEST_CONFIRMED_' + Date.now().toString().slice(-6));
        return;
      }
      setPaymentNotice({
        tone: 'error',
        text: err instanceof Error ? err.message : 'Could not launch payment gateway. If using an ad-blocker, please disable it for Razorpay and retry.',
      });
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
        .modal-body-scroll { overflow-x: hidden !important; }
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
          <div data-lenis-prevent="true" className="overflow-y-auto overflow-x-hidden overscroll-contain flex-1 py-1 modal-body-scroll pr-0.5">
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

                  <GoldButton type="submit" fullWidth className="mt-1.5">Next: Review Court Rules →</GoldButton>
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
                  <button type="button" onClick={() => setStep('details')} className="h-11 border border-white/20 bg-transparent text-white/75 text-xs font-semibold uppercase tracking-[0.2em] hover:border-white/50 hover:text-white active:scale-[0.99] transition-all rounded-none">← Edit Details</button>
                  <GoldButton type="button" onClick={() => void handleProceedToOtp()} disabled={!agreedTerms}>Verify &amp; Pay →</GoldButton>
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
                  <GoldButton type="button" onClick={() => void verifyCode()} disabled={isVerifyingOtp || isSendingOtp || digits.some((d) => !d)} fullWidth>{isVerifyingOtp ? 'Verifying Code...' : 'Verify & Launch Razorpay (₹2,360)'}</GoldButton>

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
                  <GoldButton type="button" onClick={() => void handleProceedPayment()} disabled={isPaying} fullWidth>{isPaying ? 'Opening Razorpay Gateway...' : 'Pay ₹2,360 & Activate Pass →'}</GoldButton>
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
                {/* Header Title with Celebration Badge */}
                <div className="text-center mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 shadow-sm">
                    ✓ Official Digital Pass Issued
                  </span>
                  <h2 className="font-serif text-2xl font-semibold mt-1 text-[#fbf8f1]">
                    Welcome to The Pavilion Club
                  </h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    Your luxury digital pass is active for Mon–Fri 6:00 AM – 3:00 PM Shared-Play sessions.
                  </p>
                </div>

                {/* 3D Titanium Metal Pass Card */}
                <LuxuryMetalPassCard memberPass={memberPass} />

                {/* Quick Actions Suite (Matching Reference Image Layout) */}
                <div className="mt-5 flex justify-center items-center gap-6 sm:gap-8">
                  {/* 1. Member Hours Access & Rules */}
                  <a
                    href="#hours"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Membership Access Hours: Monday to Friday, 6:00 AM – 3:00 PM. Up to 20 Shared-Play sessions per month at The Pavilion Club, Mogappair East.');
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer text-white no-underline"
                  >
                    <div className="w-12 h-12 rounded-full bg-white text-[#0b0f14] grid place-items-center shadow-[0_6px_16px_rgba(0,0,0,0.4)] group-hover:scale-105 group-hover:bg-[#f0f2f5] transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-semibold text-white/80 tracking-wide group-hover:text-white">
                      Member Hours
                    </span>
                  </a>

                  {/* 2. WhatsApp Concierge */}
                  <a
                    href={whatsappUrl(
                      `Hi Pavilion Club! I have joined the Inaugural Shared-Play Membership. My Member Pass ID is ${memberPass.reference}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 group cursor-pointer text-white no-underline"
                  >
                    <div className="w-12 h-12 rounded-full bg-white text-[#0b0f14] grid place-items-center shadow-[0_6px_16px_rgba(0,0,0,0.4)] group-hover:scale-105 group-hover:bg-[#f0f2f5] transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 18.06c-1.49 0-2.95-.4-4.22-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.13 8.13 0 0 1-1.25-4.28c0-4.5 3.66-8.15 8.16-8.15 2.18 0 4.22.85 5.76 2.39a8.09 8.09 0 0 1 2.39 5.76c0 4.49-3.66 8.15-8.15 8.15zm4.47-6.1c-.24-.12-1.44-.71-1.66-.79-.23-.08-.39-.12-.56.12-.17.25-.64.79-.79.96-.14.16-.29.18-.54.06-.24-.12-1.02-.38-1.95-1.21-.72-.65-1.21-1.45-1.36-1.69-.14-.25-.02-.38.1-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.02 2.6.13.16 1.77 2.71 4.3 3.8.6.26 1.07.42 1.44.53.61.2 1.16.17 1.6.1.49-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.21-.17-.46-.29z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-semibold text-white/80 tracking-wide group-hover:text-white">
                      WhatsApp
                    </span>
                  </a>

                  {/* 3. Save Pass */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer text-white no-underline border-none bg-transparent"
                  >
                    <div className="w-12 h-12 rounded-full bg-white text-[#0b0f14] grid place-items-center shadow-[0_6px_16px_rgba(0,0,0,0.4)] group-hover:scale-105 group-hover:bg-[#f0f2f5] transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-semibold text-white/80 tracking-wide group-hover:text-white">
                      Save pass
                    </span>
                  </button>
                </div>

                  <div className="pt-4 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem(STORAGE_KEY);
                        setMemberPass(null);
                        setStep('details');
                      }}
                      className="text-[#c7a26a]/80 hover:text-[#c7a26a] underline transition-colors"
                    >
                      Register New Member
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      Done & Close
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
