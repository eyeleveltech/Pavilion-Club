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

    const handleTelClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest ? (target.closest('a[href^="tel:"]') as HTMLAnchorElement | null) : null;
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const phone = href.replace(/^tel:/, '').trim() || '+91 96000 55623';
      const isMobile =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (window.matchMedia && window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches);
      if (!isMobile) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(phone).catch(() => {});
        }
        let t = document.getElementById('desk-toast');
        if (!t) {
          t = document.createElement('div');
          t.id = 'desk-toast';
          t.style.cssText =
            'position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);background:#0f1d2c;color:#c9a96e;padding:12px 22px;border-radius:999px;border:1px solid rgba(201,169,110,0.4);font-family:Montserrat,sans-serif;font-size:13px;letter-spacing:0.04em;box-shadow:0 12px 32px rgba(0,0,0,0.5);z-index:999999;opacity:0;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);pointer-events:none;display:flex;align-items:center;gap:10px;text-align:center;';
          document.body.appendChild(t);
        }
        t.innerHTML =
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Desk phone <strong>' +
          phone +
          '</strong> copied to clipboard!</span>';
        requestAnimationFrame(() => {
          if (t) {
            t.style.opacity = '1';
            t.style.transform = 'translateX(-50%) translateY(0)';
          }
        });
        const timerId = (t as any)._timer;
        if (timerId) clearTimeout(timerId);
        (t as any)._timer = setTimeout(() => {
          if (t) {
            t.style.opacity = '0';
            t.style.transform = 'translateX(-50%) translateY(20px)';
          }
        }, 3500);
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleWhatsAppClick, { capture: true });
    document.addEventListener('click', handleTelClick, { capture: true });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleWhatsAppClick, { capture: true });
      document.removeEventListener('click', handleTelClick, { capture: true });
    };
  }, []);

  return null;
}
