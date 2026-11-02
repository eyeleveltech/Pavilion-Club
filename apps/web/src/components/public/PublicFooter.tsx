import Link from 'next/link';

export function PublicFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`footer ${className}`}>
      <div className="footer__top">
        <div>
          <a className="brand" href="/" aria-label="The Pavilion Club" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src="/pavilion_logo_reversed.png"
              alt="The Pavilion Club"
              width={160}
              height={75}
              className="footer-brand__logo"
              style={{ height: '56px', width: 'auto', display: 'block', objectFit: 'contain' }}
            />
          </a>
          <p className="footer__tag">
            Your everyday getaway. Pickleball, studio, events and food in Mogappair East, Chennai.
          </p>
        </div>
        <div>
          <h4>The club</h4>
          <ul>
            <li><Link href="/membership/">Memberships</Link></li>
            <li><Link href="/academy/">Pickleball Academy</Link></li>
            <li><Link href="/events/">Tournaments &amp; Events</Link></li>
            <li><a href="/#spaces">Our Spaces</a></li>
            <li><a href="/#cafe">Café &amp; Food</a></li>
            <li><Link href="/franchise/">Franchise</Link></li>
            <li><Link href="/about/">About</Link></li>
          </ul>
        </div>
        <div>
          <h4>Players</h4>
          <ul>
            <li><Link href="/book/">Book a court</Link></li>
            <li><Link href="/my-bookings/">My bookings</Link></li>
            <li><Link href="/rules/">Court rules</Link></li>
            <li><Link href="/faq/">FAQs</Link></li>
            <li><Link href="/cancellation/">Cancellation &amp; refunds</Link></li>
            <li><Link href="/privacy/">Privacy</Link></li>
            <li><Link href="/terms/">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul className="footer__contact-list">
            <li>
              <a href="tel:+919600055623" className="footer__contact-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }} title="+91 96000 55623">
                <svg width="16" height="16" style={{ marginRight: '0.75rem', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>Call the desk</span>
              </a>
            </li>
            <li>
              <a href="mailto:hello@thepavilionclub.com" className="footer__contact-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }} title="hello@thepavilionclub.com">
                <svg width="16" height="16" style={{ marginRight: '0.75rem', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <span>Email us</span>
              </a>
            </li>
            <li>
              <a href="https://wa.me/919600055623?text=Hi%20Pavilion%20Club!" target="_blank" rel="noopener noreferrer" className="footer__contact-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }} title="WhatsApp the desk">
                <svg width="16" height="16" style={{ marginRight: '0.75rem', flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 18.06c-1.49 0-2.95-.4-4.22-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.13 8.13 0 0 1-1.25-4.28c0-4.5 3.66-8.15 8.16-8.15 2.18 0 4.22.85 5.76 2.39a8.09 8.09 0 0 1 2.39 5.76c0 4.49-3.66 8.15-8.15 8.15zm4.47-6.1c-.24-.12-1.44-.71-1.66-.79-.23-.08-.39-.12-.56.12-.17.25-.64.79-.79.96-.14.16-.29.18-.54.06-.24-.12-1.02-.38-1.95-1.21-.72-.65-1.21-1.45-1.36-1.69-.14-.25-.02-.38.1-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.02 2.6.13.16 1.77 2.71 4.3 3.8.6.26 1.07.42 1.44.53.61.2 1.16.17 1.6.1.49-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.21-.17-.46-.29z"/></svg>
                <span>WhatsApp</span>
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/thepavilion.club/" target="_blank" rel="noopener" className="footer__contact-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }} title="Instagram">
                <svg width="16" height="16" style={{ marginRight: '0.75rem', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                <span>Instagram</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© 2026 The Pavilion Club · Chennai</span>
        <span>Architecture and renders by Feel and Bari</span>
      </div>
      <FooterGhost />
    </footer>
  );
}

/**
 * The outlined PAVILION wordmark. Montserrat builds its heavy letters from
 * overlapping shapes, so a plain text stroke draws the joins inside P, A and N.
 * Here the stroke is masked by the filled word, leaving only the outer edge.
 * The same markup is in public/index.html.
 */
function FooterGhost() {
  const word = { x: 600, y: 170, textAnchor: 'middle', textLength: 1180, lengthAdjust: 'spacing' } as const;
  return (
    <svg className="footer__ghost" viewBox="0 0 1200 176" aria-hidden="true" focusable="false">
      <defs>
        <mask id="footer-ghost-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="176">
          <rect width="1200" height="176" fill="#fff" />
          <text {...word} fill="#000">
            PAVILION
          </text>
        </mask>
      </defs>
      <text {...word} className="footer__ghost-line" mask="url(#footer-ghost-cut)">
        PAVILION
      </text>
    </svg>
  );
}
