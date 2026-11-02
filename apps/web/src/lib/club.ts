/**
 * The club's contact details and site navigation, shared by every page the
 * Next app renders. The static home page (public/index.html) carries its own
 * copy of the menu and footer: change both together.
 */

export const CLUB = {
  name: 'The Pavilion Club',
  phoneDisplay: '+91 96000 55623',
  phoneHref: 'tel:+919600055623',
  whatsappNumber: '919600055623',
  email: 'hello@thepavilionclub.com',
  instagram: 'https://www.instagram.com/thepavilion.club/',
  addressLines: [
    'Plot Nos. 1 & 2, Door Nos. 191/2A2, 191/2A3, 191/2A4,',
    'Velammal School Road, JJ Nagar, TS Krishna Nagar,',
    'Mogappair East, Chennai - 600037',
  ],
  mapsUrl:
    'https://maps.google.com/?q=The+Pavilion+Club,+Velammal+School+Road,+Mogappair+East,+Chennai+-+600037',
  hours: [
    { days: 'Monday – Friday', time: '06:00 AM – 11:00 PM' },
    { days: 'Saturday – Sunday', time: '06:00 AM – 12:00 AM' },
  ],
} as const;

export function whatsappUrl(text: string): string {
  return `https://wa.me/${CLUB.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(subject: string, body: string): string {
  return `mailto:${CLUB.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export type NavLink = {
  /** Short label for the desktop bar. */
  label: string;
  /** Full label for the menu drawer, where there is room. */
  menuLabel: string;
  href: string;
};

/** Pages only: sections of the home page are reached from the home page. */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Memberships', menuLabel: 'Memberships', href: '/membership/' },
  { label: 'Academy', menuLabel: 'Pickleball Academy', href: '/academy/' },
  { label: 'Events', menuLabel: 'Tournaments & Events', href: '/events/' },
  { label: 'Franchise', menuLabel: 'Franchise', href: '/franchise/' },
  { label: 'Contact', menuLabel: 'Contact', href: '/contact/' },
];

/**
 * Links into the static home page must be plain anchors: a Next <Link> to "/"
 * fetches an RSC payload the static export does not have.
 */
export function isHomeLink(href: string): boolean {
  return href === '/' || href.startsWith('/#');
}
