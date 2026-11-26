'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CLUB } from '@/lib/club';
import type { MemberLookupResult } from '@/lib/enquiry-store';

export interface PrintableRegistrationData {
  reference: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  programType?: 'pickleball' | 'academy' | 'studio' | undefined;
  cohort?: string | undefined;
  day?: string | undefined;
  timeSlot?: string | undefined;
  level?: string | undefined;
  amountDisplay?: string | undefined;
  pricingLabel?: string | undefined;
  notes?: string | undefined;
  createdAt?: string | undefined;
  isPaid?: boolean | undefined;
  paymentStatusText?: string | undefined;
}

/**
 * Normalizes MemberLookupResult (Pickleball, Academy, or Studio) into an accurate
 * printable dossier payload instead of hardcoding Pickleball 12h defaults.
 */
export function buildPrintableMemberData(result: MemberLookupResult): PrintableRegistrationData {
  const titleLower = (result.planTitle || '').toLowerCase();
  const isAcademy = titleLower.includes('academy');
  const isPickleball =
    !isAcademy && (result.category === 'pickleball' || titleLower.includes('shared-play'));

  const programType: 'pickleball' | 'academy' | 'studio' = isAcademy
    ? 'academy'
    : isPickleball
      ? 'pickleball'
      : 'studio';

  const cohort = isAcademy
    ? titleLower.includes('kid')
      ? 'Kids (7–14 Years)'
      : titleLower.includes('adult')
        ? 'Adults & Teens (15+)'
        : 'Pickleball Academy'
    : isPickleball
      ? 'Pickleball Member'
      : 'Studio Member';

  const total = result.sessionsTotal || (titleLower.includes('boxing') ? 8 : 12);

  const timeSlot = isAcademy
    ? `${total} Sessions / Month · Weekday Coaching Batch`
    : isPickleball
      ? 'Mon–Fri 6:00 AM – 3:00 PM (12h Monthly Quota)'
      : `${total} Classes / Month · Scheduled Studio Batch`;

  const amountDisplay = isAcademy
    ? titleLower.includes('kid')
      ? '₹3,540 / mo (Incl. GST)'
      : titleLower.includes('adult')
        ? '₹5,310 / mo (Incl. GST)'
        : 'Official Academy Fee (Incl. GST)'
    : isPickleball
      ? '₹2,360 / mo (All-Inclusive)'
      : titleLower.includes('boxing')
        ? '₹3,000 / mo (8 Sessions)'
        : '₹2,000 / mo (Weekday Batch)';

  return {
    reference: result.reference,
    name: result.name,
    phone: result.phone,
    email: result.email,
    category: result.planTitle,
    programType,
    cohort,
    timeSlot,
    amountDisplay,
    isPaid: result.isApproved,
    paymentStatusText: result.paymentStatus || (result.isApproved ? 'Front Desk Verified & Paid' : 'Pending Front Desk Verification'),
    createdAt: result.lastCheckIn || undefined,
  };
}

interface PrintRegistrationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrintableRegistrationData | null;
}

export function PrintRegistrationSheet({ isOpen, onClose, data }: PrintRegistrationSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const parsedDate = data.createdAt ? new Date(data.createdAt) : new Date();
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const formattedDate = safeDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const catLower = data.category.toLowerCase();
  const isAcademy = data.programType === 'academy' || catLower.includes('academy');
  const isPickleball =
    !isAcademy &&
    (data.programType === 'pickleball' ||
      catLower.includes('pickleball') ||
      catLower.includes('shared-play'));

  const rawDigits = data.phone.replace(/\D/g, '');
  const formattedPhone =
    rawDigits.length >= 10 ? `+91 ${rawDigits.slice(-10)}` : data.phone;

  const documentTitle = isAcademy
    ? 'PICKLEBALL ACADEMY · ADMISSION DOSSIER'
    : isPickleball
      ? 'PICKLEBALL MEMBERSHIP DOSSIER'
      : 'PAVILION STUDIO, MOGAPPAIR · ADMISSION FORM';

  const documentSubtitle = isAcademy
    ? 'Official Coaching Programme Registration & Attendance Record'
    : isPickleball
      ? 'Official Shared-Play Membership · 12 Hours Monthly Quota'
      : 'Official Programme Registration & Physical Onboarding Slip';

  return createPortal(
    <div
      id="pavilion-print-portal"
      role="dialog"
      aria-modal="true"
      aria-label="Printable Membership Dossier"
      data-lenis-prevent="true"
      className="fixed inset-0 z-[250] overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 print:block print:static print:inset-auto print:overflow-visible print:p-0 print:bg-white print:z-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media print {
          body > *:not(#pavilion-print-portal) {
            display: none !important;
          }
          #pavilion-print-portal {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          #printable-application-sheet, #printable-application-sheet * {
            visibility: visible !important;
          }
          #printable-application-sheet {
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 6mm 8mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Main Container (my-auto keeps short screens centered while preventing top toolbar clipping) */}
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden print:overflow-visible print:rounded-none print:shadow-none print:max-w-none my-auto"
      >
        {/* Screen-only Action Toolbar */}
        <div className="no-print bg-[#0B192C] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#C9A96E]/30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C9A96E] shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#C9A96E] truncate">
              Printable Membership Dossier
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-2 rounded-lg bg-[#C9A96E] hover:bg-[#E5C378] text-[#0B192C] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect width="12" height="8" x="6" y="14" />
              </svg>
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/75 hover:text-white text-xs sm:text-sm px-2.5 py-1.5 rounded border border-white/15 hover:border-white/35 transition-colors cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Sheet (A4 Styled Document) */}
        <div
          id="printable-application-sheet"
          className="p-6 sm:p-9 font-sans text-slate-900 bg-white"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5 flex flex-wrap justify-between items-start gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-slate-500">
                {CLUB.name} · Mogappair East
              </p>
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-slate-900 mt-0.5">
                {documentTitle}
              </h1>
              <p className="text-xs text-slate-600 mt-1">{documentSubtitle}</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs font-bold text-slate-800">
                REF: {data.reference}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Section 1: Member Particulars */}
          <div className="mb-5">
            <h2 className="text-xs uppercase font-black tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-3 border-l-4 border-slate-900">
              1. Applicant Particulars
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Full Name</span>
                <span className="font-bold text-slate-900 text-sm">{data.name}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Mobile Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{formattedPhone}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Email Address</span>
                <span className="font-medium text-slate-800 break-all">{data.email || '—'}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Emergency Contact Phone</span>
                <span className="text-slate-400 italic font-mono">_________________________</span>
              </div>
            </div>
          </div>

          {/* Section 2: Selected Programme & Pricing */}
          <div className="mb-5">
            <h2 className="text-xs uppercase font-black tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-3 border-l-4 border-slate-900">
              2. Programme &amp; Batch Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Selected Programme</span>
                <span className="font-bold text-slate-900">{data.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Batch &amp; Schedule</span>
                <span className="font-semibold text-slate-800">
                  {data.timeSlot
                    ? `${data.day ? `${data.day} · ` : ''}${data.timeSlot}`
                    : isPickleball
                      ? 'Mon–Fri 6:00 AM – 3:00 PM (12 Hours Monthly Quota)'
                      : `${data.day ? `${data.day} · ` : ''}${data.pricingLabel || 'Official Batch'}`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Target Cohort / Allowance</span>
                <span className="font-semibold text-slate-800">
                  {isPickleball
                    ? 'Max 1 hr daily allowance'
                    : `${data.cohort || 'Adults (18+)'} ${data.level ? `· ${data.level}` : ''}`}
                </span>
              </div>
              {data.amountDisplay && (
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-semibold text-xs">Agreed Fee (+ GST):</span>
                  <span className="font-mono font-bold text-base text-slate-900">{data.amountDisplay}</span>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Tracking Stamp Grid for Physical Desk Records */}
          {(isPickleball || isAcademy) && (
            <div className="mb-5">
              <h2 className="text-xs uppercase font-black tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-2 border-l-4 border-slate-900">
                3. Front Desk {isAcademy ? '12-Session Coaching' : '12-Hour'} Attendance Stamp Grid
              </h2>
              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="border border-slate-300 rounded p-1.5 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-600 uppercase block">
                      {isAcademy ? `Session ${i + 1}` : `Hour ${i + 1}`}
                    </span>
                    <div className="h-5 border-b border-slate-200 my-1" />
                    <span className="text-[8px] text-slate-400 block font-mono">Date / Sign</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3/4: Safety & Member Undertaking */}
          <div className="mb-5">
            <h2 className="text-xs uppercase font-black tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-2 border-l-4 border-slate-900">
              {isPickleball || isAcademy ? '4. Member Undertaking & Court Rules' : '3. Member Declaration & Studio Rules'}
            </h2>
            <p className="text-[10px] text-slate-600 leading-relaxed text-justify">
              {isAcademy
                ? 'I confirm enrollment in the assigned Pavilion Pickleball Academy cohort batch (no mixing between Kids & Adults sessions). 12 coaching sessions are valid monthly (max 1 hour per session). Demo paddles and tournament balls are provided during sessions; non-marking court shoes are mandatory.'
                : isPickleball
                  ? 'I confirm that this shared-play membership is strictly valid for weekday mornings and afternoons (Mon–Fri 6:00 AM – 3:00 PM). Play is on a shared court rotation basis (up to 6 players per court). The monthly 12-hour quota allows up to 1 hour daily play. Dedicated non-marking court shoes are required.'
                  : 'I hereby declare that I am physically fit to participate in studio fitness/dance/movement sessions. I agree to abide by the rules and code of conduct of The Pavilion Club. Packages are non-transferable and non-refundable once activated. Clean non-marking shoes or barefoot protocol as prescribed by the instructor must be followed on the studio floor.'}
            </p>
          </div>

          {/* Signature Blocks */}
          <div className="grid grid-cols-2 gap-8 pt-4 pb-5 border-t border-b border-slate-200 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-9">Member / Guardian Signature</p>
              <div className="border-t border-slate-400 pt-1.5 flex justify-between text-[11px] text-slate-600">
                <span>Sign: _______________________</span>
                <span>Date: ____________</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-9">Authorized Club Front Desk Sign</p>
              <div className="border-t border-slate-400 pt-1.5 flex justify-between text-[11px] text-slate-600">
                <span>Sign: _______________________</span>
                <span>Date: ____________</span>
              </div>
            </div>
          </div>

          {/* Payment Verification / Office Slip */}
          {data.isPaid ? (
            <div className="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-300 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-900 block">
                  Front Desk Status: Verified &amp; Active Pass
                </span>
                <span className="text-[11px] text-slate-600">
                  {data.paymentStatusText || 'Front Desk Verified & Paid'} · Form #{data.reference}
                </span>
              </div>
              <span className="px-3 py-1 rounded bg-slate-900 text-[#E0AD5C] font-mono text-[10px] font-bold uppercase tracking-wider">
                PAID · VERIFIED
              </span>
            </div>
          ) : (
            <div className="mt-4 p-3.5 bg-slate-100 rounded-lg border border-slate-300 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                  For Office &amp; Front Desk Use Only (Spot Payment Reconciliation)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Form #{data.reference}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">Payment Mode</span>
                  <span className="font-semibold text-slate-800">[ ] UPI QR  [ ] Card  [ ] Cash</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">Amount Collected</span>
                  <span className="text-slate-700 font-mono">₹_______________</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">UPI / Txn Reference</span>
                  <span className="text-slate-700 font-mono">_________________</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">Desk Officer Name</span>
                  <span className="text-slate-700">_________________</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 text-center text-[10px] text-slate-500">
            {CLUB.name} · Mogappair East, Chennai · Desk: {CLUB.phoneDisplay} · Studio: {CLUB.studioPhoneDisplay} · www.thepavilionclub.com
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
