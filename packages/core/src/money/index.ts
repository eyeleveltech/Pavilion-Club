/**
 * Money — integer paise, always. (R4)
 *
 * No floats, no `numeric`, no rupee values below the UI boundary. ₹1,200 is
 * 120000. Formatting happens once, at the edge, and never in a repository or a
 * report query.
 *
 * See ../../../plan/02-rules.md R4
 */

/** Integer paise. 100 paise = ₹1. */
export type Paise = number;

const inr = (minimumFractionDigits: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  });

const whole = inr(0);
const withPaise = inr(2);

/**
 * `120000` → `"₹1,200"`, `120050` → `"₹1,200.50"`.
 *
 * Uses `en-IN` grouping, so large amounts read the way an Indian owner expects:
 * `"₹1,20,000"`, not `"₹120,000"`.
 */
export function formatPaise(paise: Paise): string {
  const fmt = paise % 100 === 0 ? whole : withPaise;
  return fmt.format(paise / 100);
}

/** `120000` → `"1,200"`. For table cells that carry the symbol in the header. */
export function formatPaiseBare(paise: Paise): string {
  return formatPaise(paise).replace('₹', '').trim();
}

/**
 * Rupees in, paise out, without float error.
 *
 * `12.30 * 100` is `1229.9999999999998` in IEEE 754, so the fractional part is
 * parsed as digits rather than multiplied. Accepts `"₹1,200.50"` as typed.
 */
export function rupeesToPaise(input: string | number): Paise {
  const raw = typeof input === 'number' ? input.toFixed(2) : input;
  const cleaned = raw.trim().replace(/[₹,\s]/g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(`Not an amount: ${input}`);
  }
  const negative = cleaned.startsWith('-');
  const [rupees = '0', fraction = ''] = cleaned.replace('-', '').split('.');
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
  return negative ? -paise : paise;
}

/** Sum, tolerating an empty list. */
export function sumPaise(amounts: readonly Paise[]): Paise {
  return amounts.reduce((total, amount) => total + amount, 0);
}

/**
 * A share of an amount, in basis points. 1500 bps = 15%.
 *
 * Rounds half away from zero, which is what an invoice reader expects. Used for
 * partner commission — see ../../../plan/09-money-settlement.md
 */
export function applyBps(paise: Paise, bps: number): Paise {
  return Math.round((paise * bps) / 10_000);
}

/** Is this a storable money value — a non-negative safe integer? */
export function isPaise(value: unknown): value is Paise {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
