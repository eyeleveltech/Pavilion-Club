'use client';

import React, { useState, useEffect } from 'react';
import {
  findMemberPassByQuery,
  type MemberLookupResult,
} from '@/lib/enquiry-store';
import {
  LuxuryMetalPassCard,
  type MemberPass,
} from '@/components/public/membership/MembershipCheckoutModal';
import {
  PrintRegistrationSheet,
  type PrintableRegistrationData,
} from '@/components/public/studio/PrintRegistrationSheet';
import { CLUB, whatsappUrl } from '@/lib/club';

export interface MemberPassLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function MemberPassLookupModal({
  isOpen,
  onClose,
  initialQuery = '',
}: MemberPassLookupModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(false);
  const [result, setResult] = useState<MemberLookupResult | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (!isOpen) {
      setHasSearched(false);
      setResult(null);
    }
  }, [isOpen]);

  const performSearch = (q: string) => {
    const res = findMemberPassByQuery(q);
    setResult(res);
    setHasSearched(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  if (!isOpen) return null;

  // Convert lookup result into MemberPass structure for 3D card render
  const memberPass: MemberPass | null = result
    ? {
        reference: result.reference,
        name: result.name,
        phone: result.phone,
        email: result.email,
        category: result.category,
        planTitle: result.planTitle,
        validFrom: result.createdDisplay,
        validUntil: '30 Days from Activation',
        totalSessions: result.sessionsRemaining,
        amountPaise: 236000,
        paymentId: result.isApproved ? 'FRONT_DESK_VERIFIED' : 'PENDING_DESK',
      }
    : null;

  const printableData: PrintableRegistrationData | null = result
    ? {
        reference: result.reference,
        name: result.name,
        phone: result.phone,
        email: result.email,
        category: result.planTitle,
        cohort: result.category === 'pickleball' ? 'Pickleball Member' : 'Studio Member',
        timeSlot: 'Mon–Fri 6:00 AM – 3:00 PM (12h Monthly Quota)',
        amountDisplay: '₹2,360 / mo (All-Inclusive)',
        createdAt: new Date().toISOString(),
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-step-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0b1724] border border-[#c7a26a]/40 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c7a26a]/15 border border-[#c7a26a]/30 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#c7a26a]">
            🪪 Member Pass Retrieval
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2">
            View Your Digital Pass
          </h3>
          <p className="text-xs text-white/60 max-w-sm mx-auto mt-1 leading-relaxed">
            Enter your 10-digit mobile number or application reference code to look up your active member pass &amp; remaining hours.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 9600055623 or PAV-MEM-..."
            className="flex-1 rounded-lg border border-white/20 bg-[#060c14] px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-[#c7a26a] focus:outline-none transition-all"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#c7a26a] hover:bg-[#d9b882] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-all active:scale-95 shrink-0"
          >
            Search Pass →
          </button>
        </form>

        {/* Search Results Display */}
        {hasSearched && (
          <div className="animate-step-in pt-2">
            {result ? (
              result.isApproved ? (
                /* ======================================================== */
                /* CASE 1: APPROVED & ACTIVE MEMBER                         */
                /* ======================================================== */
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Member · Card Issued</span>
                  </div>

                  {/* 3D Titanium Metal Pass Card */}
                  {memberPass && (
                    <div className="my-2">
                      <LuxuryMetalPassCard memberPass={memberPass} />
                    </div>
                  )}

                  {/* Live Quota Meter */}
                  <div className="rounded-xl border border-white/10 bg-[#060c14] p-4 text-left space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                        Live Monthly Quota
                      </span>
                      <span className="font-mono text-xs font-bold text-[#c7a26a]">
                        {result.sessionsRemaining} / {result.sessionsTotal} Hours Left
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-[#c7a26a] transition-all duration-500"
                        style={{
                          width: `${(result.sessionsRemaining / result.sessionsTotal) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-white/50 pt-1">
                      <span>Daily allowance: Up to 1 hr/day</span>
                      <span>
                        {result.lastCheckIn
                          ? `Last check-in: ${new Date(result.lastCheckIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                          : 'No sessions used yet this month'}
                      </span>
                    </div>
                  </div>

                  {/* Action Suite */}
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPrintSheetOpen(true)}
                      className="px-4 py-2 rounded-lg bg-[#c7a26a] hover:bg-[#d9b882] text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span>🖨️ Print / Save Pass</span>
                    </button>

                    <a
                      href={whatsappUrl(
                        `Hi Pavilion Front Desk! I am checking in with my Member Pass (${result.reference}).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <span>💬 WhatsApp Desk</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* ======================================================== */
                /* CASE 2: PENDING FRONT DESK APPROVAL                      */
                /* ======================================================== */
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-5 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                      ⏳ Application Under Review
                    </span>
                    <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                      {result.reference}
                    </span>
                  </div>

                  <p className="text-xs text-white/90 leading-relaxed">
                    Hello <strong>{result.name}</strong>, your application for{' '}
                    <strong>{result.planTitle}</strong> has been received and is waiting for front desk approval.
                  </p>

                  <div className="rounded-lg bg-black/40 p-3 text-[11px] text-amber-200/90 leading-relaxed border border-amber-500/20">
                    💡 <strong>When will your card appear?</strong> As soon as the Front Desk team reviews and accepts your application at the club desk, your Official 3D Digital Member Card will become active here!
                  </div>

                  <div className="pt-2 flex justify-end">
                    <a
                      href={whatsappUrl(
                        `Hi Pavilion Club! I have applied with reference ${result.reference}. Could you please check my membership approval status?`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                      <span>💬 Ping Front Desk on WhatsApp</span>
                    </a>
                  </div>
                </div>
              )
            ) : (
              /* ======================================================== */
              /* CASE 3: NO RECORD FOUND                                  */
              /* ======================================================== */
              <div className="rounded-xl border border-white/10 bg-[#060c14] p-5 text-center space-y-2.5">
                <p className="text-xs font-semibold text-rose-300">
                  No membership application found for &quot;{query}&quot;
                </p>
                <p className="text-[11px] text-white/50 max-w-sm mx-auto">
                  Please verify that you entered the same 10-digit mobile number or Reference ID used during registration.
                </p>
                <div className="pt-2">
                  <a
                    href="#enquire"
                    onClick={onClose}
                    className="inline-block text-xs font-semibold text-[#c7a26a] underline hover:text-[#e5c378]"
                  >
                    Apply for New Membership →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Printable Sheet Modal for Physical Signature */}
      <PrintRegistrationSheet
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        data={printableData}
      />
    </div>
  );
}
