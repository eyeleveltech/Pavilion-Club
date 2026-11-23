'use client';

import { useState, useEffect, useRef } from 'react';
import {
  submitEnquiry,
} from '@/lib/turfos-client';
import { addPickleballEnquiry, addStudioEnquiry } from '@/lib/enquiry-store';
import { CLUB, whatsappUrl } from '@/lib/club';
import { GoldButton } from '@/components/public/site/GoldButton';
import {
  PrintRegistrationSheet,
  type PrintableRegistrationData,
} from '@/components/public/studio/PrintRegistrationSheet';

export interface MembershipCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'details' | 'rules' | 'success';

export interface MemberPass {
  reference: string;
  name: string;
  phone: string;
  email: string;
  category: 'pickleball' | 'studio';
  planTitle: string;
  validFrom: string;
  validUntil: string;
  totalSessions: number;
  amountPaise: number;
  paymentId?: string | undefined;
  studioProgramme?: string | undefined;
  studioCohort?: string | undefined;
}

const MEMBERSHIP_PRICE_PAISE = 236000; // ₹2,360 (₹2,000 + 18% GST ₹360)
const STORAGE_KEY = 'pavilion_member_pass';

const STUDIO_PROGRAMMES = [
  'Dance (Hip-Hop & Contemporary)',
  'Salsa & Latin Social',
  'Dance Fitness (Cardio & Core)',
  'Yoga & Mindful Movement',
  'Boxing & Combat Conditioning',
  'Silambam (Traditional Martial Arts)',
  'Gymnastics & Tumbling',
  'Personal Training (1-on-1)',
  'Studio Floor Rental',
];

const STUDIO_COHORTS = [
  'Kids (Ages 4–10)',
  'Juniors (Ages 10–14)',
  'Teens (Ages 14–18)',
  'Adults (18+)',
  'All Ages / Open Batch',
];

const STUDIO_BATCH_OPTIONS = [
  'Weekday Batch (Mon · Wed · Fri · 12 Classes)',
  'Weekend Batch (Sat · Sun · 8 Classes)',
  'Morning Batch (06:00 AM – 07:00 AM)',
  'Evening Batch (05:00 PM – 06:00 PM)',
  'Night Batch (07:00 PM – 08:00 PM)',
];

function generateMemberReference(category: 'pickleball' | 'studio'): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const prefix = category === 'pickleball' ? 'PAV-MEM' : 'PAV-STU';
  return `${prefix}-${year}-${randomPart}`;
}

export interface LuxuryMetalPassCardProps {
  memberPass: MemberPass;
}

export function LuxuryMetalPassCard({ memberPass }: LuxuryMetalPassCardProps) {
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

  const formattedNumber = memberPass.reference.replace(/-/g, ' ');

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

      {/* 3D Debossed Guilloche Rosette Medallion */}
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
      </svg>

      {/* Row 1: Brand & Status Header */}
      <div className="relative z-[4] flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c7a26a] animate-pulse" />
            <span className="text-[9px] uppercase tracking-[0.25em] font-black text-[#c7a26a]">
              The Pavilion Club
            </span>
          </div>
          <span className="text-[11px] font-bold tracking-wider text-white/90 block mt-0.5">
            {memberPass.category === 'pickleball' ? 'MEMBER PASS · 12H QUOTA' : 'STUDIO ADMISSION PASS'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#c7a26a]/15 border border-[#c7a26a]/40 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#c7a26a]">
          <span>VERIFIED AT DESK</span>
        </div>
      </div>

      {/* Row 2: Chip & Reference ID */}
      <div className="relative z-[4] my-auto pt-2">
        <div className="flex items-center justify-between mb-2">
          {/* Smart EMV Chip simulation */}
          <div className="w-10 h-7 rounded bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#aa771c] p-[1px] shadow-md">
            <div className="w-full h-full rounded-[3px] border border-black/30 grid grid-cols-2 grid-rows-2 p-0.5 gap-0.5">
              <div className="border border-black/20 rounded-sm"></div>
              <div className="border border-black/20 rounded-sm"></div>
              <div className="border border-black/20 rounded-sm"></div>
              <div className="border border-black/20 rounded-sm"></div>
            </div>
          </div>

          <div
            onClick={copyNumber}
            className="flex items-center gap-1 text-[11px] font-mono text-white/70 hover:text-[#c7a26a] transition-colors"
            title="Click to copy ID"
          >
            <span>{copied ? '✓ Copied' : '📋 Copy'}</span>
          </div>
        </div>

        <div
          onClick={copyNumber}
          className="font-mono text-base sm:text-lg tracking-[0.2em] font-extrabold text-white text-shadow-sm select-all"
        >
          {formattedNumber}
        </div>
      </div>

      {/* Row 3: Member Name & Quota Footer */}
      <div className="relative z-[4] flex items-end justify-between pt-1 border-t border-white/10">
        <div>
          <span className="text-[8px] uppercase tracking-wider text-white/40 block font-semibold">
            Passholder
          </span>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide block truncate max-w-[200px]">
            {memberPass.name}
          </span>
          <span className="text-[9px] font-mono text-white/60 block">
            {memberPass.phone}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[8px] uppercase tracking-wider text-white/40 block font-semibold">
            Monthly Allowance
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#c7a26a] font-mono block">
            {memberPass.category === 'pickleball' ? '12 Hours Quota' : `${memberPass.totalSessions} Classes`}
          </span>
          <span className="text-[9px] font-mono text-white/50 block">
            Thru {validThru}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MembershipCheckoutModal({ isOpen, onClose }: MembershipCheckoutModalProps) {
  const [step, setStep] = useState<Step>('details');

  // Category Toggle: 'pickleball' (12h Quota) vs 'studio' (Dance/Yoga/Boxing)
  const [category, setCategory] = useState<'pickleball' | 'studio'>('pickleball');

  // Shared Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Studio-Specific Form State
  const [studioProgramme, setStudioProgramme] = useState(STUDIO_PROGRAMMES[0] ?? 'Dance');
  const [studioCohort, setStudioCohort] = useState(STUDIO_COHORTS[3] ?? 'Adults (18+)');
  const [studioBatch, setStudioBatch] = useState(STUDIO_BATCH_OPTIONS[0] ?? 'Weekday Batch');

  // Submission & Pass State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberPass, setMemberPass] = useState<MemberPass | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // Load existing pass from storage if any
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (window.location.hash === '#join' || params.get('join') === 'true' || params.get('join') === '1') {
        setStep('details');
        setFormError(null);
        return;
      }

      if (params.get('pass') === 'preview' || window.location.hash === '#pass') {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + 30);
        setMemberPass({
          reference: 'PAV-MEM-2026-8492',
          name: 'Suresh Kumar',
          email: 'suresh.kumar@example.com',
          phone: '+91 96000 55623',
          category: 'pickleball',
          planTitle: 'Inaugural Shared-Play Membership (12 Hours)',
          validFrom: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          validUntil: future.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          totalSessions: 12,
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
            return;
          }
        } catch {
          // ignore
        }
      }

      setStep('details');
      setFormError(null);
    }
  }, [isOpen]);

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
      setFormError('Please enter a valid email address.');
      return;
    }

    setStep('rules');
  };

  // Step 2: Confirm Rules & Issue Digital Pass Directly
  // CRITICAL REQUIREMENT: Payment is completely bypassed / hidden right now!
  const handleConfirmAndIssuePass = async () => {
    if (!agreedTerms) {
      setFormError('Please check the confirmation box to confirm the club terms.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const ref = generateMemberReference(category);
    const now = new Date();
    const validUntilDate = new Date(now.getTime() + 30 * 86400000);

    const planTitle =
      category === 'pickleball'
        ? 'Inaugural Shared-Play Membership (12 Hours)'
        : `Pavilion Studio · ${studioProgramme}`;

    const newPass: MemberPass = {
      reference: ref,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      category,
      planTitle,
      validFrom: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      validUntil: validUntilDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      totalSessions: 12,
      amountPaise: category === 'pickleball' ? MEMBERSHIP_PRICE_PAISE : 0,
      paymentId: 'PAY_AT_DESK',
      studioProgramme: category === 'studio' ? studioProgramme : undefined,
      studioCohort: category === 'studio' ? studioCohort : undefined,
    };

    setMemberPass(newPass);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPass));
    }

    // 1. Submit Registration Dossier to Pavilion Serverless Route (/api/onboard)
    // This triggers the A4 printable email format to hello@thepavilionclub.com
    try {
      await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: ref,
          category,
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          plan: planTitle,
          sessions: 12,
          studioCategory: category === 'studio' ? studioProgramme : undefined,
          studioCohort: category === 'studio' ? studioCohort : undefined,
          studioSlot: category === 'studio' ? studioBatch : undefined,
          notes,
          amountDisplay: category === 'pickleball' ? '₹2,360.00' : 'Studio Standard',
          paymentStatus: 'Pay at Desk',
        }),
      });
    } catch (err) {
      console.warn('API onboard delivery logged:', err);
    }

    // 2. Add to Central Turf-OS Enquiries
    try {
      await submitEnquiry({
        type: category === 'pickleball' ? 'membership' : 'studio',
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        category: planTitle,
        notes: `Registration ref: ${ref} (12 Hours Quota). Payment: Pay at Desk. Notes: ${notes || 'None'}`,
        details: {
          reference: ref,
          category,
          plan: planTitle,
          sessions: 12,
        },
      });
    } catch (err) {
      console.error('[TURF-OS ENQUIRY SUBMISSION FAILED]:', err);
    }

    // 3. Add to Front Desk Console Cache
    if (category === 'pickleball') {
      addPickleballEnquiry({
        reference: ref,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        plan: 'Inaugural Shared-Play Membership (12 Hours)',
        sessions: 12,
        amountPaise: MEMBERSHIP_PRICE_PAISE,
        paymentId: 'PAY_AT_DESK',
        status: 'Pay at Desk',
        notes,
      });
    } else {
      addStudioEnquiry({
        reference: ref,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        category: studioProgramme,
        cohort: studioCohort,
        day: studioBatch,
        timeSlot: studioBatch,
        notes,
      });
    }

    setIsSubmitting(false);
    // Straight to next step: Digital Pass issued!
    setStep('success');
  };

  if (!isOpen) return null;

  const printableData: PrintableRegistrationData | null = memberPass
    ? {
        reference: memberPass.reference,
        name: memberPass.name,
        phone: memberPass.phone,
        email: memberPass.email,
        category: memberPass.planTitle,
        cohort: memberPass.studioCohort || (memberPass.category === 'pickleball' ? 'Pickleball Member' : 'Studio Member'),
        timeSlot: memberPass.category === 'pickleball' ? 'Mon–Fri 6:00 AM – 3:00 PM (12 Hours Monthly Quota)' : studioBatch,
        amountDisplay: memberPass.category === 'pickleball' ? '₹2,360 / mo (All-Inclusive)' : 'Standard Studio Rates',
        notes: notes || undefined,
        createdAt: new Date().toISOString(),
      }
    : null;

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
      `}</style>

      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 py-2 sm:py-4">
        <div
          data-lenis-prevent="true"
          className="relative w-full max-w-lg max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl border border-[#c7a26a]/40 bg-[#08111d] px-4 py-3 sm:px-6 sm:py-4 text-[#fbf8f1] shadow-2xl shadow-black/90 z-10 animate-modal-card overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Brand Header Bar */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0 mb-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c7a26a] animate-pulse" />
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-[#c7a26a]">
                The Pavilion Club · Member Onboarding
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

          {/* 2-Step Guided Stepper Bar (Payment bypassed per user request) */}
          {step !== 'success' && (
            <div className="pt-1.5 pb-2 flex items-center justify-between px-1 shrink-0 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step === 'rules'
                      ? 'bg-[#c7a26a] text-[#0b192c]'
                      : 'border-2 border-[#c7a26a] text-[#c7a26a] bg-[#c7a26a]/15 animate-stepper-glow'
                  }`}
                >
                  {step === 'rules' ? '✓' : '1'}
                </div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#c7a26a]">
                  Particulars
                </span>
              </div>

              <div
                className={`flex-1 h-px mx-3 transition-all duration-500 ${
                  step === 'rules' ? 'bg-[#c7a26a]' : 'bg-white/10'
                }`}
              />

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step === 'rules'
                      ? 'border-2 border-[#c7a26a] text-[#c7a26a] bg-[#c7a26a]/15 animate-stepper-glow'
                      : 'border border-white/20 text-white/40'
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-[0.65rem] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                    step === 'rules' ? 'text-[#c7a26a]' : 'text-white/40'
                  }`}
                >
                  Rules &amp; Pass
                </span>
              </div>
            </div>
          )}

          {/* Scrollable Step Body */}
          <div data-lenis-prevent="true" className="overflow-y-auto overflow-x-hidden overscroll-contain flex-1 py-1 modal-body-scroll pr-0.5">
            {/* ======================================================== */}
            {/* STEP 1: Unified Form (Pickleball & Studio) */}
            {/* ======================================================== */}
            {step === 'details' && (
              <div className="animate-step-in">
                <div className="text-center">
                  <h2 id="membership-modal-title" className="font-serif text-2xl font-medium text-[#fbf8f1]">
                    Unified Member Registration
                  </h2>
                  <p className="mt-0.5 text-xs text-[#fbf8f1]/70 max-w-sm mx-auto">
                    Select your programme below and enter your credentials to obtain your member pass.
                  </p>
                </div>

                {/* Category Pill Selector */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 p-1 bg-[#050b14] rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCategory('pickleball')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all flex flex-col items-center gap-0.5 ${
                      category === 'pickleball'
                        ? 'bg-[#c7a26a] text-[#08111d] shadow-md font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>🎾 Pickleball Membership</span>
                    <span className="text-[10px] opacity-80 font-mono">12 Hours Monthly Quota</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('studio')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all flex flex-col items-center gap-0.5 ${
                      category === 'studio'
                        ? 'bg-[#c7a26a] text-[#08111d] shadow-md font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>🧘 The Studio Mogappair</span>
                    <span className="text-[10px] opacity-80 font-mono">Dance · Fitness · Yoga</span>
                  </button>
                </div>

                {/* Quota & Pricing Banner */}
                {category === 'pickleball' ? (
                  <div className="mt-3 rounded-xl border border-[#c7a26a]/30 bg-[#0e1a29]/80 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[0.58rem] font-bold uppercase tracking-wider text-[#c7a26a] block">
                        Inaugural Shared-Play Pass · Save ₹1,000
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-serif text-xl sm:text-2xl font-bold text-[#fbf8f1]">₹2,360</span>
                        <span className="text-xs text-white/50">/ mo (₹2,000 + 18% GST)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[0.62rem] font-semibold text-[#c7a26a] bg-[#c7a26a]/15 px-2 py-0.5 rounded border border-[#c7a26a]/30 block font-mono">
                        12 HOURS / MO
                      </span>
                      <span className="text-[0.58rem] text-emerald-400 mt-0.5 block font-semibold">Pay at Club Desk</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-white/10 bg-[#0e1a29]/80 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[0.58rem] font-bold uppercase tracking-wider text-[#c7a26a] block">
                        Pavilion Studio Mogappair
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-serif text-lg font-bold text-[#fbf8f1]">Class &amp; Floor Hire</span>
                        <span className="text-xs text-white/50">· Admission Intake</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[0.62rem] font-semibold text-[#c7a26a] bg-[#c7a26a]/15 px-2 py-0.5 rounded border border-[#c7a26a]/30 block font-mono">
                        12 CLASSES / MO
                      </span>
                      <span className="text-[0.58rem] text-emerald-400 mt-0.5 block font-semibold">Pay at Club Desk</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleProceedToRules} className="mt-3 space-y-3">
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
                        className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/25 text-xs focus:outline-none focus:border-[#c7a26a] transition-all font-mono"
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

                  {/* Studio Options Dropdowns (When Studio is selected) */}
                  {category === 'studio' && (
                    <div className="space-y-3 pt-1 border-t border-white/10 animate-step-in">
                      <div>
                        <label htmlFor="stu-programme" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                          Select Studio Programme *
                        </label>
                        <select
                          id="stu-programme"
                          value={studioProgramme}
                          onChange={(e) => setStudioProgramme(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                        >
                          {STUDIO_PROGRAMMES.map((prog) => (
                            <option key={prog} value={prog} className="bg-[#08111d]">
                              {prog}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="stu-cohort" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                            Target Cohort *
                          </label>
                          <select
                            id="stu-cohort"
                            value={studioCohort}
                            onChange={(e) => setStudioCohort(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                          >
                            {STUDIO_COHORTS.map((coh) => (
                              <option key={coh} value={coh} className="bg-[#08111d]">
                                {coh}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="stu-batch" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                            Preferred Batch *
                          </label>
                          <select
                            id="stu-batch"
                            value={studioBatch}
                            onChange={(e) => setStudioBatch(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                          >
                            {STUDIO_BATCH_OPTIONS.map((bat) => (
                              <option key={bat} value={bat} className="bg-[#08111d]">
                                {bat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="mem-notes" className="block text-[0.62rem] font-semibold uppercase tracking-wider text-white/70 mb-1">
                      Notes / Skill Level / Preferences (Optional)
                    </label>
                    <input
                      id="mem-notes"
                      type="text"
                      placeholder="e.g. Beginner level, morning preference"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-white/15 bg-[#060d15] text-[#fbf8f1] placeholder-white/25 text-xs focus:outline-none focus:border-[#c7a26a] transition-all"
                    />
                  </div>

                  {formError && (
                    <p role="alert" className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg p-2 text-center animate-step-in">
                      {formError}
                    </p>
                  )}

                  <GoldButton type="submit" fullWidth className="mt-1.5">
                    Next: Review Guidelines &amp; Issue Pass →
                  </GoldButton>
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
                    {category === 'pickleball' ? 'Confirm Court Access Hours' : 'Confirm Studio Guidelines'}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#fbf8f1]/70 max-w-sm mx-auto">
                    Step 02: Review the schedule and confirm your admission details.
                  </p>
                </div>

                {/* Rules Table */}
                <div className="mt-2.5 rounded-xl border border-white/10 bg-[#0e1a29]/80 divide-y divide-white/5 overflow-hidden">
                  {category === 'pickleball' ? (
                    <>
                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          📅
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">Monday to Friday Only</span>
                            <span className="text-[10px] text-[#c7a26a] font-mono font-bold bg-[#c7a26a]/15 px-1.5 py-0.5 rounded border border-[#c7a26a]/30">6:00 AM – 3:00 PM</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Shared play sessions start and finish inside this window. Weekends for tournaments &amp; coaching.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          ⏱️
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">12 Hours of Play / Month</span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">Max 1 hr/day</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Front desk deducts 1 hour per check-in until all 12 hours are utilized.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          🎾
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">Direct Walk-In Access</span>
                            <span className="text-[10px] text-[#c7a26a] font-mono font-bold">No Slot Booking</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">No advance booking needed. Present digital pass at front desk for instant entry.</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          🧘
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">{studioProgramme}</span>
                            <span className="text-[10px] text-[#c7a26a] font-mono font-bold bg-[#c7a26a]/15 px-1.5 py-0.5 rounded border border-[#c7a26a]/30">{studioCohort}</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Scheduled class intake at The Pavilion Studio Mogappair East.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 py-2 px-3">
                        <div className="w-6 h-6 rounded-md bg-[#c7a26a]/15 border border-[#c7a26a]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          👟
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white">Indoor Footwear Protocol</span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">Clean Soles Only</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Dedicated clean non-marking indoor shoes or grip socks required on the sprung floor.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Price & Passholder Sync Strip */}
                <div className="mt-2 bg-[#060d15] border border-[#c7a26a]/30 rounded-lg py-1.5 px-3 flex items-center justify-between">
                  <div>
                    <span className="text-[0.52rem] font-bold uppercase tracking-wider text-white/50 block">Payment Status</span>
                    <span className="font-serif text-sm sm:text-base font-bold text-emerald-400">
                      Pay at Club Desk <span className="text-[0.62rem] text-white/50 font-normal">/ Front Desk Verified</span>
                    </span>
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
                    I confirm that I understand this application is for <strong>{category === 'pickleball' ? 'weekday shared-play (6 AM – 3 PM, 12 Hours Quota)' : `${studioProgramme} at The Pavilion Studio`}</strong>.
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
                    className="h-11 border border-white/20 bg-transparent text-white/75 text-xs font-semibold uppercase tracking-[0.2em] hover:border-white/50 hover:text-white active:scale-[0.99] transition-all rounded-none"
                  >
                    ← Edit Details
                  </button>
                  <GoldButton
                    type="button"
                    onClick={() => void handleConfirmAndIssuePass()}
                    disabled={!agreedTerms || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit →'}
                  </GoldButton>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: Application Submitted (Pending Desk Verification) */}
            {/* ======================================================== */}
            {step === 'success' && memberPass && (
              <div className="animate-step-in text-center space-y-4 py-2">
                {/* Header Title with Celebration Badge */}
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow-sm">
                    ⏳ Application Submitted · Pending Desk Approval
                  </span>
                  <h2 className="font-serif text-2xl font-semibold mt-2 text-[#fbf8f1]">
                    Thank You, {memberPass.name}
                  </h2>
                  <p className="text-xs text-white/70 mt-1 max-w-sm mx-auto">
                    Your application has been received and forwarded to our Front Desk team.
                  </p>
                </div>

                {/* Status Box */}
                <div className="p-4 rounded-xl border border-[rgba(201,169,110,0.3)] bg-[#07131f] text-left space-y-2.5 max-w-md mx-auto">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Reference ID</span>
                    <span className="font-mono text-xs font-bold text-[#c7a26a] bg-[#c7a26a]/15 px-2 py-0.5 rounded border border-[#c7a26a]/30">
                      {memberPass.reference}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Selected Plan:</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">{memberPass.planTitle}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Digital Card Status:</span>
                    <span className="font-semibold text-amber-300 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded">
                      Unlocks upon Desk Approval
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 pt-1 border-t border-white/10 leading-relaxed">
                    💡 Our Front Desk team will call you at <strong>+91 {memberPass.phone}</strong>. Once approved &amp; accepted at the club desk, your Official Digital Member Card with 12-Hour Quota will be activated.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <a
                    href={whatsappUrl(
                      `Hi Pavilion Club! I have applied for membership (Ref: ${memberPass.reference}). Could you please verify and accept my pass?`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                  >
                    💬 WhatsApp Front Desk
                  </a>
                  <a
                    href={CLUB.phoneHref}
                    className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    📞 Call Desk
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      setMemberPass(null);
                      setStep('details');
                    }}
                    className="px-4 py-2 text-xs text-[#c7a26a]/80 hover:text-[#c7a26a] underline transition-colors"
                  >
                    Register Another Member
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs text-white/50 hover:text-white underline transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Application Sheet Modal for Physical Signature / Save PDF */}
      <PrintRegistrationSheet
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        data={printableData}
      />
    </div>
  );
}
