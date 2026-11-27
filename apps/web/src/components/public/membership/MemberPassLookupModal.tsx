'use client';

import React, { useEffect, useState } from 'react';
import {
  EditorialQuotaSection,
  LuxuryMetalPassCard,
} from '@/components/public/membership/MembershipCheckoutModal';
import {
  PrintRegistrationSheet,
  buildPrintableMemberData,
  type PrintableRegistrationData,
} from '@/components/public/studio/PrintRegistrationSheet';
import { whatsappUrl } from '@/lib/club';
import { toMemberPassFromLookup, useLiveMemberPass } from '@/lib/use-live-member-pass';

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
  const { query, setQuery, hasSearched, result, performSearch, reset } =
    useLiveMemberPass(isOpen ? initialQuery : '');
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void performSearch(query);
  };

  if (!isOpen) return null;

  const memberPass = result ? toMemberPassFromLookup(result) : null;
  const printableData: PrintableRegistrationData | null = result
    ? buildPrintableMemberData(result)
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
                /* CASE 1: APPROVED & ACTIVE MEMBER */
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Member · Live Sync</span>
                  </div>

                  {memberPass && (
                    <div className="mt-4">
                      <LuxuryMetalPassCard memberPass={memberPass} surface="dark" />
                    </div>
                  )}

                  <EditorialQuotaSection
                    category={result.category}
                    sessionsRemaining={result.sessionsRemaining}
                    sessionsTotal={result.sessionsTotal}
                    lastCheckIn={result.lastCheckIn}
                    onPrintDossier={() => setIsPrintSheetOpen(true)}
                    whatsappHref={whatsappUrl(
                      `Hi Pavilion Front Desk! I am checking in with my Member Pass (${result.reference}).`
                    )}
                    surface="dark"
                  />
                </div>
              ) : result.passState === 'cancelled' ||
                result.passState === 'completed' ||
                result.passState === 'expired' ||
                result.passState === 'closed' ? (
                /* CASE 2: INACTIVE / COMPLETED / EXPIRED / CANCELLED */
                <div className="rounded-xl border border-white/15 bg-[#060c14] p-5 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        result.passState === 'cancelled' ? 'text-rose-300' : 'text-amber-300'
                      }`}
                    >
                      {result.passState === 'cancelled'
                        ? '✕ Pass Removed / Cancelled'
                        : result.passState === 'completed'
                          ? '✓ Sessions Completed (0 Left)'
                          : result.passState === 'closed'
                            ? 'Application Closed'
                            : '⏳ Pass Validity Expired'}
                    </span>
                    <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                      {result.reference}
                    </span>
                  </div>

                  <p className="text-xs text-white/85 leading-relaxed">
                    <strong>{result.name}</strong> — {result.status} ({result.planTitle}).
                  </p>

                  {result.cancelReason && (
                    <p className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/20 rounded px-2.5 py-1.5">
                      Desk Note: {result.cancelReason}
                    </p>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <a
                      href="#enquire"
                      onClick={onClose}
                      className="text-xs font-semibold text-[#c7a26a] underline hover:text-[#e5c378]"
                    >
                      Renew / Re-Apply →
                    </a>
                    <a
                      href={whatsappUrl(
                        `Hi Pavilion Front Desk! Please help me check/renew my pass (${result.reference}).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-[#c7a26a] text-black text-xs font-bold uppercase tracking-wider"
                    >
                      WhatsApp Desk
                    </a>
                  </div>
                </div>
              ) : (
                /* CASE 3: PENDING FRONT DESK APPROVAL */
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
              /* CASE 4: NO RECORD FOUND */
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
