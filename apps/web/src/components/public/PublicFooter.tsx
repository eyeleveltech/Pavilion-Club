import Link from 'next/link';

export function PublicFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`footer ${className}`}>
      <div className="footer__top">
        <div>
          <a className="brand" href="/" aria-label="The Pavilion Club">
            <span className="brand__the">The</span>
            <span className="brand__name">Pavilion</span>
            <span className="brand__club">Club</span>
          </a>
          <p className="footer__tag">
            Three pickleball courts in Mogappair East, run the way a club should be.
          </p>
        </div>
        <div>
          <h4>The club</h4>
          <ul>
            <li><a href="/#courts">Courts</a></li>
            <li><a href="/#club">The club</a></li>
            <li><a href="/#day">Court-side</a></li>
            <li><Link href="/book/">Booking</Link></li>
          </ul>
        </div>
        <div>
          <h4>Your bookings</h4>
          <ul>
            <li><Link href="/my-bookings/">My bookings</Link></li>
            <li><Link href="/cancellation/">Cancellation</Link></li>
            <li><Link href="/privacy/">Privacy</Link></li>
            <li><Link href="/terms/">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li><a href="tel:+919600055623">+91 96000 55623</a></li>
            <li><a href="mailto:hello@thepavilionclub.com">hello@thepavilionclub.com</a></li>
            <li><a href="https://wa.me/919600055623" target="_blank" rel="noopener">WhatsApp the desk</a></li>
            <li><a href="https://www.instagram.com/thepavilion.club/" target="_blank" rel="noopener">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© 2026 The Pavilion Club · Chennai</span>
        <span>Architecture and renders by Feel and Bari</span>
      </div>
      <div className="footer__ghost" aria-hidden="true">Pavilion</div>
    </footer>
  );
}
