'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { CLUB, NAV_LINKS, isHomeLink } from '@/lib/club';

/**
 * `overlay` lets the bar sit transparent over a full-bleed hero, as on the
 * home page, until the page scrolls.
 */
export function PublicHeader({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor scroll for header styling with hysteresis to eliminate threshold jitter
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          setIsScrolled((prev) => (prev ? y > 15 : y > 40));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open. Pages with smooth
  // scrolling (SiteMotion) scroll by wheel through Lenis, so pause it too.
  useEffect(() => {
    const lenis = (window as { lenis?: { stop(): void; start(): void } | null }).lenis;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      lenis?.stop();
    } else {
      document.body.style.overflow = '';
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = NAV_LINKS.map((link) => ({
    ...link,
    isExternal: isHomeLink(link.href),
    active: !isHomeLink(link.href) && pathname.startsWith(link.href.slice(0, -1)),
  }));

  const isBookingPage = pathname.startsWith('/book');

  return (
    <>
      <header
        className={`editorial-nav ${isScrolled ? 'is-scrolled' : overlay ? 'is-overlay' : ''}`}
        id="nav"
      >
        {/* Brand Lockup matching editorial homepage - native anchor to root to avoid RSC fetch */}
        <a href="/" className="editorial-brand" aria-label="The Pavilion Club, home" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/pavilion_logo_reversed.png"
            alt="The Pavilion Club"
            width={160}
            height={102}
            className="editorial-brand__logo"
            style={{ height: '48px', width: 'auto', display: 'block', objectFit: 'contain' }}
          />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="editorial-nav__links" aria-label="Primary">
          {navLinks.map((link) =>
            link.isExternal ? (
              <a
                key={link.label}
                href={link.href}
                className={link.active ? 'is-active' : ''}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={link.active ? 'is-active' : ''}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Right CTA Button & Mobile Menu Toggle */}
        <div className="editorial-nav__right">
          <Link
            href={isBookingPage ? '/my-bookings/' : '/book/'}
            className="editorial-btn"
          >
            {isBookingPage ? 'My Bookings' : 'Book a court'}
          </Link>
          <button
            type="button"
            className="editorial-nav__menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="editorial-menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            Menu
          </button>
        </div>
      </header>

      {/* Full-screen Luxury Editorial Drawer matching homepage */}
      <div
        className={`editorial-menu ${mobileMenuOpen ? 'is-open' : ''}`}
        id="editorial-menu"
        aria-hidden={!mobileMenuOpen}
      >
        <div className="editorial-menu__head">
          <a
            href="/"
            className="editorial-brand"
            aria-label="The Pavilion Club, home"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <img
              src="/pavilion_logo_reversed.png"
              alt="The Pavilion Club"
              width={160}
              height={75}
              className="editorial-brand__logo"
              style={{ height: '48px', width: 'auto', display: 'block', objectFit: 'contain' }}
            />
          </a>
          <button
            type="button"
            className="editorial-menu__close"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            Close
          </button>
        </div>

        {navLinks.map((link) =>
          link.isExternal ? (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.menuLabel}
            </a>
          ) : (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.menuLabel}
            </Link>
          )
        )}
        <Link href={isBookingPage ? '/my-bookings/' : '/book/'} onClick={() => setMobileMenuOpen(false)}>
          {isBookingPage ? 'My bookings' : 'Book a court'}
        </Link>

        <div className="editorial-menu__foot">
          <span>Mon–Fri 06:00 AM–11:00 PM · Sat–Sun 06:00 AM–12:00 AM</span>
          <a href={CLUB.phoneHref} style={{ color: 'inherit', textDecoration: 'none' }}>
            {CLUB.phoneDisplay}
          </a>
        </div>
      </div>
    </>
  );
}
