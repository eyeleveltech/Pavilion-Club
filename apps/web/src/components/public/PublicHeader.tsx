'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isBookingPage = pathname.startsWith('/book');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
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
    { label: 'Courts', href: '/#courts' },
    { label: 'The club', href: '/#club' },
    { label: 'Court-side', href: '/#day' },
    { label: 'Membership', href: '/membership/', active: pathname.startsWith('/membership') },
    { label: 'Booking', href: '/book/', active: pathname.startsWith('/book') },
    { label: 'Find us', href: '/#venue' },
  ];

  return (
    <>
      <header
        className={`editorial-nav ${isScrolled ? 'is-scrolled' : ''}`}
        id="nav"
      >
        {/* Brand Lockup matching editorial homepage */}
        <Link href="/" className="editorial-brand" aria-label="The Pavilion Club, home">
          <span className="editorial-brand__the">The</span>
          <span className="editorial-brand__name">Pavilion</span>
          <span className="editorial-brand__club">Club</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="editorial-nav__links" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={link.active ? 'is-active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right CTA Button & Mobile Menu Toggle */}
        <div className="editorial-nav__right">
          <Link
            href={isBookingPage ? '/my-bookings' : '/book/'}
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
      >
        <button
          type="button"
          className="editorial-menu__close"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          Close &times;
        </button>

        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={() => setMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        <div className="editorial-menu__foot">
          <span>Mon–Fri 06:00–23:00 · Sat–Sun 06:00–00:00</span>
          <a href="tel:+919600055623" style={{ color: 'inherit', textDecoration: 'none' }}>
            +91 96000 55623
          </a>
        </div>
      </div>
    </>
  );
}
