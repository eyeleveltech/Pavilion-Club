'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export function PublicHeader() {
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

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Courts', href: '/#courts', isExternal: true },
    { label: 'The club', href: '/#club', isExternal: true },
    { label: 'Court-side', href: '/#day', isExternal: true },
    { label: 'Membership', href: '/#membership', isExternal: true },
    { label: 'Booking', href: '/book/', isExternal: false, active: pathname.startsWith('/book') },
    { label: 'Find us', href: '/#venue', isExternal: true },
  ];

  const isBookingPage = pathname.startsWith('/book');

  return (
    <>
      <header
        className={`editorial-nav ${isScrolled ? 'is-scrolled' : ''}`}
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
        <button
          type="button"
          className="editorial-menu__close"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        >
          Close
        </button>

        {navLinks.map((link) =>
          link.isExternal ? (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          )
        )}

        <div className="editorial-menu__foot">
          <span>Mon–Fri 06:00 AM – 11:00 PM</span>
          <span>Sat–Sun 06:00 AM – 12:00 AM</span>
          <a href="tel:+919600055623" style={{ color: 'inherit', textDecoration: 'none' }}>
            Desk +91 96000 55623
          </a>
          <span>Mogappair East, Chennai</span>
        </div>
      </div>
    </>
  );
}
