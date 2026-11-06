'use client';

import { useState, useEffect } from 'react';
import { MembershipCheckoutModal } from './MembershipCheckoutModal';

export function MembershipCheckoutModalContainer() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check URL hash on load or hashchange
    const checkHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);
        if (hash === '#join' || hash === '#pass' || params.get('join') === 'true' || params.get('join') === '1' || params.get('pass') === 'preview') {
          setIsOpen(true);
        }
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);

    // 2. Intercept click on any link pointing to #join
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a[href="#join"]');
      if (target) {
        e.preventDefault();
        setIsOpen(true);
        if (window.location.hash !== '#join') {
          window.history.pushState(null, '', '#join');
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <MembershipCheckoutModal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        if (typeof window !== 'undefined' && window.location.hash === '#join') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }}
    />
  );
}

