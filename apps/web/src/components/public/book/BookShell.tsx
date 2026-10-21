import Link from 'next/link';
import type { ReactNode } from 'react';

import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { cx } from './ui';

/**
 * The frame for the booking pages:
 * Unified luxury Midnight Navy editorial header at the top,
 * followed by a streamlined sub-navigation for booking court / viewing bookings.
 */
export function BookShell({ children, active }: { children: ReactNode; active: 'book' | 'mine' }) {
  const link = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      aria-current={on ? 'page' : undefined}
      className={cx(
        'border-b-[2px] py-2.5 text-[14px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy',
        on ? 'border-navy font-semibold text-ink' : 'border-transparent font-medium text-ink-faint hover:text-ink',
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <link rel="stylesheet" href="/assets/fonts/fonts.css" />

      <div className="flex min-h-svh flex-col bg-bg font-sans text-ink antialiased">
        <PublicHeader />

        <div className="border-b border-border bg-white/70 backdrop-blur-sm sticky top-[68px] z-20">
          <div className="mx-auto flex h-12 w-full max-w-xl items-center justify-between px-5">
            <nav aria-label="Booking Views" className="flex gap-6">
              {link('/book/', 'Book a court', active === 'book')}
              {link('/my-bookings/', 'My bookings', active === 'mine')}
            </nav>
            <span className="text-[12px] uppercase tracking-widest text-ink-faint font-medium hidden sm:inline">
              Mogappair East
            </span>
          </div>
        </div>

        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
