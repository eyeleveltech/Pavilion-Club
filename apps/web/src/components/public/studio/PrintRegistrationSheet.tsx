'use client';

import React from 'react';
import { CLUB } from '@/lib/club';

export interface PrintableRegistrationData {
  reference: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  cohort?: string | undefined;
  day?: string | undefined;
  timeSlot?: string | undefined;
  level?: string | undefined;
  amountDisplay?: string | undefined;
  pricingLabel?: string | undefined;
  notes?: string | undefined;
  createdAt?: string | undefined;
}

interface PrintRegistrationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrintableRegistrationData | null;
}

export function PrintRegistrationSheet({ isOpen, onClose, data }: PrintRegistrationSheetProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const isPickleball =
    data.category.toLowerCase().includes('pickleball') ||
    data.category.toLowerCase().includes('shared-play');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:z-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-application-sheet, #printable-application-sheet * {
            visibility: visible;
          }
          #printable-application-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden print:rounded-none print:shadow-none print:max-w-none">
        {/* Screen-only Action Toolbar */}
        <div className="no-print bg-[#0B192C] text-white px-6 py-4 flex items-center justify-between border-b border-[#C9A96E]/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A96E]">
              Printable Membership Registration Sheet
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-[#C9A96E] hover:bg-[#E5C378] text-[#0B192C] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
            >
              <span>🖨️ Print Form / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white text-sm px-2 py-1"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Sheet (A4 Styled Document) */}
        <div
          id="printable-application-sheet"
          className="p-8 sm:p-10 font-sans text-slate-900 bg-white"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-slate-500">
                The Pavilion Club · Mogappair East
              </p>
              <h1 className="text-2xl font-serif font-black tracking-tight text-slate-900 mt-0.5">
                {isPickleball ? 'PICKLEBALL MEMBERSHIP DOSSIER' : 'PAVILION STUDIO, MOGAPPAIR · ADMISSION FORM'}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {isPickleball ? 'Official Shared-Play Membership · 12 Hours Monthly Quota' : 'Official Programme Registration & Physical Onboarding Slip'}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs font-bold text-slate-800">
                REF: {data.reference}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Section 1: Member Particulars */}
          <div className="mb-6">
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
                <span className="font-mono font-bold text-slate-900 text-sm">+91 {data.phone}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Email Address</span>
                <span className="font-medium text-slate-800">{data.email || '—'}</span>
              </div>
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Emergency Contact Phone</span>
                <span className="text-slate-400 italic font-mono">_________________________</span>
              </div>
            </div>
          </div>

          {/* Section 2: Selected Programme & Pricing */}
          <div className="mb-6">
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
                  {isPickleball ? 'Mon–Fri 6:00 AM – 3:00 PM (12 Hours Monthly Quota)' : `${data.day ? `${data.day} · ` : ''}${data.timeSlot || data.pricingLabel || 'Official Batch'}`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Target Cohort / Allowance</span>
                <span className="font-semibold text-slate-800">
                  {isPickleball ? 'Max 1 hr daily allowance' : `${data.cohort || 'Adults (18+)'} ${data.level ? `· ${data.level}` : ''}`}
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

          {/* Attendance Tracking Stamp Grid for Physical Desk Records (12 Hours) */}
          {isPickleball && (
            <div className="mb-6">
              <h2 className="text-xs uppercase font-black tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-2 border-l-4 border-slate-900">
                3. Front Desk 12-Hour Attendance Stamp Grid
              </h2>
              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="border border-slate-300 rounded p-1.5 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-600 uppercase block">Hour {i + 1}</span>
                    <div className="h-5 border-b border-slate-200 my-1"></div>
                    <span className="text-[8px] text-slate-400 block font-mono">Date / Sign</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Safety & Member Undertaking */}
          <div className="mb-6">
            <h2 className="text-xs uppercase font-black tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-2 border-l-4 border-slate-900">
              {isPickleball ? '4. Member Undertaking & Court Rules' : '3. Member Declaration & Studio Rules'}
            </h2>
            <p className="text-[10px] text-slate-600 leading-relaxed text-justify">
              {isPickleball
                ? 'I confirm that this shared-play membership is strictly valid for weekday mornings and afternoons (Mon–Fri 6:00 AM – 3:00 PM). Play is on a shared court rotation basis (up to 6 players per court). The monthly 12-hour quota allows up to 1 hour daily play. Dedicated non-marking court shoes are required.'
                : 'I hereby declare that I am physically fit to participate in studio fitness/dance/movement sessions. I agree to abide by the rules and code of conduct of The Pavilion Club. Packages are non-transferable and non-refundable once activated. Clean non-marking shoes or barefoot protocol as prescribed by the instructor must be followed on the studio floor.'}
            </p>
          </div>

          {/* Section 4: Signature Blocks */}
          <div className="grid grid-cols-2 gap-8 pt-4 pb-6 border-t border-b border-slate-200 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-10">Member / Guardian Signature</p>
              <div className="border-t border-slate-400 pt-1.5 flex justify-between text-[11px] text-slate-600">
                <span>Sign: _______________________</span>
                <span>Date: ____________</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-10">Authorized Club Front Desk Sign</p>
              <div className="border-t border-slate-400 pt-1.5 flex justify-between text-[11px] text-slate-600">
                <span>Sign: _______________________</span>
                <span>Date: ____________</span>
              </div>
            </div>
          </div>

          {/* Section 5: Front Desk Manual QR Payment Collection Slip */}
          <div className="mt-5 p-3.5 bg-slate-100 rounded-lg border border-slate-300 text-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                For Office &amp; Front Desk Use Only (Spot Payment Reconciliation)
              </span>
              <span className="text-[10px] font-mono text-slate-500">Form #{data.reference}</span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-[11px]">
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

          {/* Footer */}
          <div className="mt-5 text-center text-[10px] text-slate-400">
            The Pavilion Club · Mogappair East, Chennai · Desk: +91 9884373336 / +91 96000 55623 · www.thepavilionclub.com
          </div>
        </div>
      </div>
    </div>
  );
}
