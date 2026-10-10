'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'COURTS', href: '/#courts' },
    { label: 'THE CLUB', href: '/#club' },
    { label: 'COURT-SIDE', href: '/#day' },
    { label: 'MEMBERSHIP', href: '/membership', active: pathname.startsWith('/membership') },
    { label: 'BOOKING', href: '/book', active: pathname.startsWith('/book') },
    { label: 'FIND US', href: '/#venue' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#283543] text-white border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        {/* Logo Lockup matching editorial header */}
        <Link
          href="/"
          className="inline-grid justify-items-center text-center leading-none text-[#F9F6ED] select-none py-1 group shrink-0"
          aria-label="The Pavilion Club, home"
        >
          <span
            style={{ fontFamily: "'Pinyon Script', cursive" }}
            className="text-[1.5rem] sm:text-[1.65rem] leading-[0.8] text-[#F9F6ED] translate-x-[14%] group-hover:text-[#C7A26A] transition-colors"
          >
            The
          </span>
          <span
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            className="text-[0.82rem] sm:text-[0.92rem] font-semibold tracking-[0.42em] indent-[0.42em] uppercase text-white group-hover:text-[#C7A26A] transition-colors"
          >
            Pavilion
          </span>
          <span
            style={{ fontFamily: "'Pinyon Script', cursive" }}
            className="text-[1.5rem] sm:text-[1.65rem] leading-[0.8] text-[#F9F6ED] translate-x-[12%] -mt-1 group-hover:text-[#C7A26A] transition-colors"
          >
            Club
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 xl:gap-8 justify-center flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[11px] xl:text-[11.5px] font-semibold tracking-[0.24em] uppercase transition-colors relative py-1 ${
                link.active
                  ? 'text-[#C7A26A] font-bold'
                  : 'text-[#D9D3C7] hover:text-white'
              }`}
            >
              {link.label}
              {link.active ? (
                <span className="absolute left-0 bottom-0 w-full h-[1.5px] bg-[#C7A26A]" />
              ) : null}
            </Link>
          ))}
        </nav>

        {/* Right CTA Button & Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/book"
            className="bg-[#C7A26A] hover:bg-[#B89358] text-[#0f1e2e] font-bold text-[11px] uppercase tracking-[0.2em] px-6 sm:px-7 py-2.5 sm:py-3 transition-all shadow-xs active:scale-[0.98] whitespace-nowrap"
          >
            BOOK A COURT
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 text-white/80 hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen ? (
        <div className="lg:hidden bg-[#1E2A38] border-t border-white/10 px-6 py-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-xs font-semibold tracking-[0.2em] uppercase py-2 transition-colors ${
                link.active ? 'text-[#C7A26A]' : 'text-[#D9D3C7] hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
