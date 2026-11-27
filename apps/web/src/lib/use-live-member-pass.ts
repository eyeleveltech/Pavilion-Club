'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ENQUIRY_UPDATE_EVENT,
  findMemberPassByQuery,
  type MemberLookupResult,
} from '@/lib/enquiry-store';
import type { MemberPass } from '@/components/public/membership/MembershipCheckoutModal';
import { fetchLiveMemberPass, passStreamUrl } from '@/lib/turfos-client';

/** Map any lookup result into the 3D Metal Card MemberPass shape. */
export function toMemberPassFromLookup(result: MemberLookupResult): MemberPass {
  return {
    reference: result.reference,
    name: result.name,
    phone: result.phone,
    email: result.email,
    category: result.category,
    planTitle: result.planTitle,
    validFrom: result.createdDisplay,
    validUntil: result.expiresAt || '30 Days from Activation',
    totalSessions: result.sessionsTotal || result.sessionsRemaining,
    amountPaise: 236000,
    paymentId: result.isApproved ? 'FRONT_DESK_VERIFIED' : 'PENDING_DESK',
  };
}

/**
 * Shared real-time digital pass state hook used across both /pass/ and the lookup modal.
 * Combines live Server-Sent Events (instant push on front-desk check-in/revoke/renew),
 * focus/visibility refreshes, and a 2.5s safety fallback poll.
 */
export function useLiveMemberPass(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery.trim());
  const [hasSearched, setHasSearched] = useState(false);
  const [result, setResult] = useState<MemberLookupResult | null>(null);
  const [justApproved, setJustApproved] = useState(false);
  const activeQueryRef = useRef(activeQuery);
  activeQueryRef.current = activeQuery;

  const applyLiveResult = useCallback((next: MemberLookupResult | null, silent: boolean) => {
    if (next) {
      setResult((prev) => {
        if (prev && !prev.isApproved && next.isApproved) {
          setJustApproved(true);
        }
        return next;
      });
      if (!silent) setHasSearched(true);
      return;
    }

    if (!silent) {
      setResult(null);
      setHasSearched(true);
    }
  }, []);

  const performSearch = useCallback(
    async (q: string, silent = false) => {
      const trimmed = q.trim();
      if (!trimmed) return;

      if (!silent) {
        setActiveQuery(trimmed);
        activeQueryRef.current = trimmed;
      }

      // 1. Live ClubOps database lookup (no-store)
      try {
        const liveRes = await fetchLiveMemberPass(trimmed);
        if (liveRes && liveRes.found) {
          applyLiveResult(liveRes as MemberLookupResult, silent);
          return;
        }
      } catch {
        // Fallback cleanly to local storage cache below
      }

      // 2. Local browser fallback when ClubOps has no matching record
      const localRes = findMemberPassByQuery(trimmed);
      applyLiveResult(localRes, silent);
    },
    [applyLiveResult],
  );

  // Run automatically when initialQuery is supplied (e.g. ?phone=...)
  useEffect(() => {
    const trimmed = initialQuery.trim();
    if (trimmed) {
      setQuery(initialQuery);
      setActiveQuery(trimmed);
      void performSearch(trimmed);
    }
  }, [initialQuery, performSearch]);

  // Real-time SSE push + visibility/focus sync + 2.5s fallback polling
  useEffect(() => {
    if (!activeQuery) return;

    const refreshSilent = () => {
      if (activeQueryRef.current) {
        void performSearch(activeQueryRef.current, true);
      }
    };

    // 1. Real-time Server-Sent Events from ClubOps API (<100ms on check-in / undo / revoke)
    let es: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      try {
        es = new EventSource(passStreamUrl(activeQuery));
        es.addEventListener('pass', (ev) => {
          try {
            const payload = JSON.parse((ev as MessageEvent<string>).data) as MemberLookupResult;
            if (payload && payload.found) {
              applyLiveResult(payload, true);
            }
          } catch {
            // Ignore malformed stream frames
          }
        });
      } catch {
        // Ignore EventSource init failures and rely on fallback polling
      }
    }

    // 2. Same-origin / focus / visibility events
    window.addEventListener(ENQUIRY_UPDATE_EVENT, refreshSilent);
    window.addEventListener('storage', refreshSilent);
    window.addEventListener('focus', refreshSilent);
    window.addEventListener('pageshow', refreshSilent);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshSilent();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('pavilion_channel');
      bc.onmessage = refreshSilent;
    } catch {
      // BroadcastChannel unsupported
    }

    // 3. Fast fallback poll (every 2.5s when tab is visible)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshSilent();
      }
    }, 2500);

    return () => {
      es?.close();
      window.removeEventListener(ENQUIRY_UPDATE_EVENT, refreshSilent);
      window.removeEventListener('storage', refreshSilent);
      window.removeEventListener('focus', refreshSilent);
      window.removeEventListener('pageshow', refreshSilent);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollInterval);
      bc?.close();
    };
  }, [activeQuery, applyLiveResult, performSearch]);

  const reset = useCallback(() => {
    setHasSearched(false);
    setResult(null);
    setActiveQuery('');
    setJustApproved(false);
  }, []);

  return {
    query,
    setQuery,
    hasSearched,
    result,
    justApproved,
    performSearch,
    reset,
  };
}
