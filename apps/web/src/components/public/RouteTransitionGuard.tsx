'use client';

import { useEffect } from 'react';

/**
 * RouteTransitionGuard ensures smooth navigation between the luxury
 * static editorial homepage and Next.js App Router subpages (/book/, /my-bookings/, etc.).
 *
 * It intercepts popstate (browser back/forward) to prevent Next.js from
 * attempting client-side RSC fetching of index.txt when returning to the root homepage.
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

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return null;
}
