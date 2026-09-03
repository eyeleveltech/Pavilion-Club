'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, User, ShieldCheck } from 'lucide-react';

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo Lockup */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-navy text-gold flex items-center justify-center font-bold text-base shadow-sm">
            P
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs uppercase tracking-widest text-gold font-bold">The</span>
              <span className="text-sm font-bold tracking-wider text-navy uppercase">Pavilion</span>
            </div>
            <p className="text-[10px] text-ink-soft tracking-wider">Club · Sports Arena</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
          <Link
            href="/book"
            className={`px-3 py-1.5 rounded transition ${
              pathname.startsWith('/book')
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink hover:text-navy hover:bg-surface-2'
            }`}
          >
            Book a Court
          </Link>

          <Link
            href="/my-bookings"
            className={`px-3 py-1.5 rounded transition ${
              pathname.startsWith('/my-bookings')
                ? 'bg-navy text-white shadow-xs'
                : 'text-ink hover:text-navy hover:bg-surface-2'
            }`}
          >
            My Bookings
          </Link>

          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border text-ink-faint hover:text-ink hover:bg-surface-2 transition text-[11px]"
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
