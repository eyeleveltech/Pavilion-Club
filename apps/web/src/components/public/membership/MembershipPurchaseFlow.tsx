'use client';

import { useState, useEffect } from 'react';
import { MembershipCheckoutModal } from './MembershipCheckoutModal';

export function MembershipPurchaseFlow() {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open modal on #join hash or query param or custom trigger
  useEffect(() => {
    const checkTrigger = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);
        if (hash === '#join' || params.get('join') === 'true' || params.get('join') === '1') {
          setIsOpen(true);
        }
      }
    };

    checkTrigger();

    const handleHashChange = () => {
      if (window.location.hash === '#join') {
        setIsOpen(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-lg bg-[#c7a26a] text-[#0f1e2e] font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-[#d8b57d] active:scale-[0.99] transition-all shadow-lg shadow-[#c7a26a]/20 cursor-pointer"
      >
        <span>Join online — ₹2,360 / mo</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <MembershipCheckoutModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
