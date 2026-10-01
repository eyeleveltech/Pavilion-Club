'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo Lockup */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-navy text-gold flex items-center justify-center font-bold text-sm sm:text-base shadow-sm shrink-0">
            P
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-gold-text font-bold">The</span>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-navy uppercase">Pavilion</span>
            </div>
            <p className="hidden min-[360px]:block text-[9px] sm:text-[10px] text-ink-soft tracking-wider">
              Club · Pickleball Arena
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-3 text-xs font-semibold shrink-0">
          <Link
            href="/book"
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap text-xs font-semibold ${
              pathname.startsWith('/book')
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink hover:text-navy hover:bg-surface-2'
            }`}
          >
            <span className="hidden sm:inline">Book a Court</span>
            <span className="sm:hidden">Book</span>
          </Link>

          <Link
            href="/my-bookings"
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap text-xs font-semibold ${
              pathname.startsWith('/my-bookings')
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink hover:text-navy hover:bg-surface-2'
            }`}
          >
            My Bookings
          </Link>

          <Link
            href="/admin"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-ink-faint hover:text-ink hover:bg-surface-2 transition text-[11px]"
            title="Desk Staff Login"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
