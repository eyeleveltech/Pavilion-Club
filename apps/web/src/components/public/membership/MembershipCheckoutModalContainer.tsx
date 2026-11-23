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

        // If inline #enquire form is on the page and hash is #join or #enquire, scroll down to it
        const formEl = document.getElementById('enquire');
        if (formEl && (hash === '#join' || hash === '#enquire' || hash === '#studio-enquiry')) {
          formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        if (params.get('pass') === 'preview' || hash === '#pass') {
          setIsOpen(true);
        }
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);

    // 2. Direct event listener for MembershipJoinButton
    const handleDirectOpen = () => {
      const formEl = document.getElementById('enquire');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          const nameInput = document.querySelector<HTMLInputElement>('#enquire input[name="name"]');
          nameInput?.focus();
        }, 400);
        return;
      }
      setIsOpen(true);
    };
    window.addEventListener('open-membership-modal', handleDirectOpen);

    // 3. Intercept click on any link pointing to #join or #studio-enquiry
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a[href="#join"], a[href="#studio-enquiry"], a[href="#enquire"]');
      if (target) {
        const formEl = document.getElementById('enquire');
        if (formEl) {
          e.preventDefault();
          formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            const nameInput = document.querySelector<HTMLInputElement>('#enquire input[name="name"]');
            nameInput?.focus();
          }, 400);
          return;
        }
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('open-membership-modal', handleDirectOpen);
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

