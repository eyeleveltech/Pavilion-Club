'use client';

import React from 'react';
import { GoldButton } from '@/components/public/site/GoldButton';

export interface MembershipJoinButtonProps {
  children?: React.ReactNode;
  className?: string;
  category?: 'pickleball' | 'studio';
}

export function MembershipJoinButton({
  children = 'Enquire to join',
  className = '',
  category = 'pickleball',
}: MembershipJoinButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window !== 'undefined') {
      const formEl = document.getElementById('enquire');
      if (formEl) {
        // Switch category if requested
        if (category) {
          const catSelect = document.querySelector<HTMLSelectElement>('#enquire select[name="category"]');
          if (catSelect && catSelect.value !== category) {
            catSelect.value = category;
            catSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        // Smoothly scroll down to the form above the footer
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (window.location.hash !== '#enquire') {
          window.history.pushState(null, '', '#enquire');
        }

        // Focus the name input
        setTimeout(() => {
          const nameInput = document.querySelector<HTMLInputElement>('#enquire input[name="name"]');
          nameInput?.focus();
        }, 400);

        return;
      }

      // If on another page, navigate directly to /membership/#enquire
      window.location.href = '/membership/#enquire';
    }
  };

  return (
    <GoldButton onClick={handleClick} className={className}>
      {children}
    </GoldButton>
  );
}
