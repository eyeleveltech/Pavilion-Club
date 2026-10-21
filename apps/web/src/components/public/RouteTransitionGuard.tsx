'use client';

import { useEffect } from 'react';

/**
 * RouteTransitionGuard ensures smooth navigation between the luxury
 * static editorial homepage and Next.js App Router subpages (/book/, /my-bookings/, etc.).
 *
 * It intercepts popstate (browser back/forward) to prevent Next.js from
 * attempting client-side RSC fetching of index.txt when returning to the root homepage,
 * and ensures WhatsApp deep links seamlessly open on mobile without popup blockage.
 */
export function RouteTransitionGuard() {
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (
        p === '/' ||
        p === '' ||
        p === '/index.html' ||
        p.endsWith('/index.txt') ||
        p.endsWith('.txt')
      ) {
        window.location.replace('/');
      }
    };

    const handleWhatsAppClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest ? (target.closest('a[href*="wa.me"]') as HTMLAnchorElement | null) : null;
      if (!a) return;
      const isMobile =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (window.matchMedia && window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches);
      if (isMobile) {
        e.preventDefault();
        window.location.href = a.href;
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleWhatsAppClick, { capture: true });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleWhatsAppClick, { capture: true });
    };
  }, []);

  return null;
}
