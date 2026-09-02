/**
 * Booking references — what a customer quotes at the gate.
 *
 * Read aloud over a phone in a noisy venue, so the alphabet excludes every
 * character that gets misheard or mistyped: no 0/O, no 1/I/L. 31 usable
 * characters over 6 positions is ~887 million combinations, which for a venue
 * doing a few thousand bookings a year makes a collision vanishingly rare —
 * and the unique index catches it anyway.
 */

/** 31 characters. Deliberately missing 0, O, 1, I and L. */
export const REFERENCE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const REFERENCE_PREFIX = 'PC';
const LENGTH = 6;

/**
 * `PC-8FK2QD`.
 *
 * `rng` is injectable so tests can be deterministic. Production uses
 * `Math.random`; the value is not a secret — it identifies a booking, it does
 * not authorise anything.
 */
export function generateReference(rng: () => number = Math.random): string {
  let body = '';
  for (let i = 0; i < LENGTH; i++) {
    body += REFERENCE_ALPHABET[Math.floor(rng() * REFERENCE_ALPHABET.length)];
  }
  return `${REFERENCE_PREFIX}-${body}`;
}

const PATTERN = new RegExp(`^${REFERENCE_PREFIX}-[${REFERENCE_ALPHABET}]{${LENGTH}}$`);

export function isReference(value: unknown): value is string {
  return typeof value === 'string' && PATTERN.test(value);
}

/**
 * Tidy a reference a person typed into the desk search box.
 *
 * Upper-cases, strips spaces and dashes, and restores a missing prefix — so
 * `8fk2qd`, `PC 8FK2QD` and `pc-8fk2qd` all find the same booking.
 *
 * It deliberately does NOT try to repair look-alike characters. Both sides of
 * every confusable pair are absent from the alphabet — 0 and O, 1 and I and L —
 * so there is nothing to map them onto, and guessing could resolve a typo into
 * a different real booking. Failing to find is better than finding the wrong
 * one. Forgiveness belongs in the search query, not here.
 */
export function normaliseReference(input: string): string {
  const body = input.toUpperCase().replace(/[\s-]/g, '').replace(/^PC/, '');
  return `${REFERENCE_PREFIX}-${body}`;
}
