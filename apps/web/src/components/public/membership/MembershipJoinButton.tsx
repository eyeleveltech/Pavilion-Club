'use client';

import React from 'react';
import { GoldButton } from '@/components/public/site/GoldButton';

export function MembershipJoinButton({ children = 'Enquire to join', className = '' }: { children?: React.ReactNode; className?: string }) {
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window !== 'undefined') {
      // 1. Dispatch custom event for 100% reliable opening
      window.dispatchEvent(new CustomEvent('open-membership-modal'));

      // 2. Update hash
      if (window.location.hash !== '#join') {
        window.history.pushState(null, '', '#join');
      }
    }
  };

  return (
    <GoldButton onClick={handleClick} className={className}>
      {children}
    </GoldButton>
  );
}
