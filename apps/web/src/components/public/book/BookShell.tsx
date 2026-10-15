import Link from 'next/link';
import type { ReactNode } from 'react';

import { cx } from './ui';

/**
 * The frame for the booking pages: a quiet light header and footer.
 *
 * People arrive here to do one job, so the frame offers two places to go and
 * stays out of the way. fonts.css is linked here because the wordmark and the
 * page headings use the logo's serif and script faces.
 */
export function BookShell({ children, active }: { children: ReactNode; active: 'book' | 'mine' }) {
  const link = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      aria-current={on ? 'page' : undefined}
      className={cx(
        'border-b-[1.5px] py-2 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy',
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
        <header className="border-b border-border">
          <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-5">
            <Link href="/" aria-label="The Pavilion Club, home" className="inline-grid justify-items-center text-[10.5px] leading-none text-ink">
              <span className="translate-x-[14%] font-script text-[1.55em] -mb-[.12em]">The</span>
              <span className="pl-[.4em] font-serif font-semibold uppercase tracking-[.4em]">Pavilion</span>
              <span className="-mt-[.22em] translate-x-[12%] font-script text-[1.55em]">Club</span>
            </Link>
            <nav aria-label="Main" className="flex gap-6">
              {link('/book', 'Book a court', active === 'book')}
              {link('/my-bookings', 'My bookings', active === 'mine')}
            </nav>
          </div>
        </header>

        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>

        <footer className="border-t border-border py-6 text-[13px] text-ink-faint">
          <div className="mx-auto flex w-full max-w-xl flex-wrap justify-between gap-x-5 gap-y-2 px-5">
            <span>© 2026 The Pavilion Club · Chennai</span>
            <nav aria-label="Help" className="flex flex-wrap gap-4">
              <Link className="hover:text-ink" href="/cancellation">Cancellation</Link>
              <Link className="hover:text-ink" href="/terms">Terms</Link>
              <Link className="hover:text-ink" href="/contact">Contact</Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
