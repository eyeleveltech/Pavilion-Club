'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  findMemberPassByQuery,
  type MemberLookupResult,
  ENQUIRY_UPDATE_EVENT,
} from '@/lib/enquiry-store';
import {
  LuxuryMetalPassCard,
  EditorialQuotaSection,
  type MemberPass,
} from '@/components/public/membership/MembershipCheckoutModal';
import {
  PrintRegistrationSheet,
  buildPrintableMemberData,
  type PrintableRegistrationData,
} from '@/components/public/studio/PrintRegistrationSheet';
import { CLUB, whatsappUrl } from '@/lib/club';
import { fetchLiveMemberPass } from '@/lib/turfos-client';

function PassContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('phone') || searchParams.get('ref') || '';
  const [query, setQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(false);
  const [result, setResult] = useState<MemberLookupResult | null>(null);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [justApproved, setJustApproved] = useState(false);
  const currentQueryRef = useRef(query);
  currentQueryRef.current = query;
  const resultRef = useRef(result);
  resultRef.current = result;

  const performSearch = useCallback(async (q: string, silent = false) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    // 1. Live ClubOps Database lookup
    try {
      const liveRes = await fetchLiveMemberPass(trimmed);
      if (liveRes && liveRes.found) {
        setResult((prev) => {
          if (prev && !prev.isApproved && liveRes.isApproved) {
            setJustApproved(true);
          }
          return liveRes as MemberLookupResult;
        });
        if (!silent) setHasSearched(true);
        return;
      }
    } catch {
      // Ignore network errors and fallback
    }

    // 2. Local fallback
    const res = findMemberPassByQuery(trimmed);
    if (res) {
      setResult((prev) => {
        if (prev && !prev.isApproved && res.isApproved) {
          setJustApproved(true);
        }
        return res;
      });
      if (!silent) setHasSearched(true);
      return;
    }

    if (!silent) {
      setResult(null);
      setHasSearched(true);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  // Real-Time Instant Auto-Sync (No Page Refresh Needed)
  useEffect(() => {
    const activeQ = currentQueryRef.current;
    if (!activeQ) return;

    // Handler for local events
    const handleInstantUpdate = () => {
      performSearch(currentQueryRef.current, true);
    };

    window.addEventListener(ENQUIRY_UPDATE_EVENT, handleInstantUpdate);
    window.addEventListener('storage', handleInstantUpdate);

    // Cross-tab broadcast channel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('pavilion_channel');
      bc.onmessage = () => {
        performSearch(currentQueryRef.current, true);
      };
    } catch {
      // BroadcastChannel unsupported
    }

    // Window focus / visibility change re-check
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        performSearch(currentQueryRef.current, true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // Fast polling: every 2.5s while pending, every 8s when active (to detect check-in deduction live)
    const pollInterval = setInterval(() => {
      performSearch(currentQueryRef.current, true);
    }, result?.isApproved ? 8000 : 2500);

    return () => {
      window.removeEventListener(ENQUIRY_UPDATE_EVENT, handleInstantUpdate);
      window.removeEventListener('storage', handleInstantUpdate);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      clearInterval(pollInterval);
      if (bc) bc.close();
    };
  }, [result?.isApproved, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

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
    ? buildPrintableMemberData(result)
    : null;

  return (
    <div className="w-full min-h-[calc(100vh-68px-340px)] py-16 sm:py-24 px-4 sm:px-6 flex flex-col items-center justify-start">
      <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
        {/* Search Header */}
        <div className="text-center space-y-3 mb-8 w-full">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c7a26a]/15 border border-[#c7a26a]/30 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#c7a26a]">
            🪪 Member Pass Retrieval
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
            View Your Digital Pass
          </h1>
          <p className="text-sm text-ink-soft max-w-md mx-auto">
            Enter your 10-digit mobile number or Reference Code to retrieve your official digital member pass and view remaining play hours.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="w-full max-w-md mx-auto mb-10 flex gap-2 items-center">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 9600055623 or PAV-MEM-..."
            className="flex-1 rounded-none border-b-2 border-navy bg-transparent px-3 py-3 text-sm text-navy placeholder:text-ink-faint focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-[#0B192C] hover:bg-navy px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#C9A96E] transition-all shrink-0 cursor-pointer shadow-sm hover:shadow-md"
          >
            Search →
          </button>
        </form>

        {/* Results */}
        {hasSearched && (
          <div className="w-full max-w-lg mx-auto animate-step-in">
          {result ? (
            result.isApproved ? (
              /* Approved & Active Member */
              <div className="text-center">
                {justApproved && (
                  <div className="rounded-xl border border-emerald-400 bg-emerald-500/15 p-4 text-center text-xs sm:text-sm font-bold text-emerald-950 shadow-md animate-bounce mb-4 flex items-center justify-center gap-2">
                    <span className="text-base">🎉</span>
                    <span>Application Accepted! Your 3D Digital Member Pass is now active.</span>
                  </div>
                )}

                <span className="inline-flex items-center gap-2 rounded-full bg-[#F3EEE1] border border-[#CFC7B2] px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#0F1E2E]">
                  <span className="w-2 h-2 rounded-full bg-[#2E6F4E] animate-pulse" />
                  <span>Approved &amp; Active Member</span>
                </span>

                {memberPass && (
                  <div className="mt-4">
                    <LuxuryMetalPassCard memberPass={memberPass} surface="ivory" />
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
                  surface="ivory"
                />
              </div>
            ) : (
              /* Pending Desk Verification */
              <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-6 sm:p-8 text-left space-y-4 max-w-lg mx-auto shadow-sm">
                <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                    ⏳ Application Under Review
                  </span>
                  <span className="font-mono text-xs font-bold text-navy bg-white px-2 py-0.5 rounded border border-amber-200">
                    {result.reference}
                  </span>
                </div>

                {/* Instant Real-Time Auto Sync Indicator */}
                <div className="flex items-center justify-between text-[11px] text-amber-900 bg-amber-100/90 px-3.5 py-2 rounded-xl border border-amber-300 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                    </span>
                    <span className="font-semibold text-emerald-950">Live Auto-Sync Active</span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-medium">Updates automatically upon desk approval</span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-navy">
                  Application Received, {result.name}
                </h3>

                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Your application for <strong>{result.planTitle}</strong> is currently waiting for front desk approval.
                </p>

                <div className="rounded-xl bg-white p-4 text-xs text-ink-soft space-y-2 border border-amber-200/80">
                  <div className="font-bold text-navy text-[11px] uppercase tracking-wider">
                    How do I get my Digital Card?
                  </div>
                  <p className="leading-relaxed">
                    Our Front Desk team will review your application and contact you at <strong>+91 {result.phone}</strong>. As soon as staff accepts your application at the club desk, your Official 3D Digital Member Card with 12-Hour Quota will become active right here!
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <a
                    href={whatsappUrl(
                      `Hi Pavilion Club! I have applied with reference ${result.reference}. Could you please check my membership approval status?`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <span>💬 Ping Desk on WhatsApp</span>
                  </a>
                </div>
              </div>
            )
          ) : (
            /* Not Found */
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3 max-w-md mx-auto shadow-sm">
              <p className="text-sm font-semibold text-rose-600">
                No membership application found for &quot;{query}&quot;
              </p>
              <p className="text-xs text-ink-soft">
                Please verify that you entered the same 10-digit mobile number or Reference ID used during registration.
              </p>
              <div className="pt-3">
                <a
                  href="/membership/#enquire"
                  className="inline-block text-xs font-bold uppercase tracking-wider text-navy underline hover:text-gold"
                >
                  Apply for Membership →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Sheet */}
      <PrintRegistrationSheet
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        data={printableData}
      />
      </div>
    </div>
  );
}

export function PassClientView() {
  return (
    <Suspense fallback={<div className="site-wrap py-24 text-center text-xs text-ink-soft">Loading pass retrieval...</div>}>
      <PassContent />
    </Suspense>
  );
}
