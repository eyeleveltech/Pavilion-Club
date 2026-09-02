/**
 * Pricing — which rule applies to a slot.
 *
 * The resolved price is snapshotted onto the booking at creation and never
 * recomputed. Editing a rule next month must not rewrite what last month's
 * customer paid, or what a partner owes on it. (R5)
 *
 * See ../../../plan/05-booking-engine.md §Pricing
 */

import type { Paise } from '../money/index.js';
import type { Ymd } from '../time/index.js';

export type PriceRule = {
  id: string;
  name: string;
  /** null = every court. */
  courtId: string | null;
  /** null = every day. 0 = Sunday. */
  weekdays: readonly number[] | null;
  /** null = all day. Half-open: [fromMinutes, toMinutes). */
  fromMinutes: number | null;
  toMinutes: number | null;
  pricePaise: Paise;
  priority: number;
  validFrom: Ymd | null;
  validTo: Ymd | null;
  isActive: boolean;
  /** ISO timestamp. Final tie-break, newest first. */
  createdAt: string;
};

export type PriceContext = {
  courtId: string;
  /** 0 = Sunday, matching `court_hours.weekday`. */
  weekday: number;
  /** Minutes from midnight at which the slot starts. */
  startMinutes: number;
  /** The business date the slot belongs to. */
  date: Ymd;
};

export type ResolvedPrice = { pricePaise: Paise; ruleId: string };

/** Does every non-null scope on this rule match the context? */
function matches(rule: PriceRule, ctx: PriceContext): boolean {
  if (!rule.isActive) return false;
  if (rule.courtId !== null && rule.courtId !== ctx.courtId) return false;
  if (rule.weekdays !== null && !rule.weekdays.includes(ctx.weekday)) return false;

  if (rule.fromMinutes !== null && rule.toMinutes !== null) {
    // Half-open, like the booking ranges themselves: a rule covering
    // 18:00-22:00 applies to the 18:00 slot and not to the 22:00 one.
    if (ctx.startMinutes < rule.fromMinutes || ctx.startMinutes >= rule.toMinutes) return false;
  }

  if (rule.validFrom !== null && ctx.date < rule.validFrom) return false;
  if (rule.validTo !== null && ctx.date > rule.validTo) return false;

  return true;
}

/**
 * How specific a rule is: the number of scopes it pins down.
 *
 * Court + weekday + time = 3, and beats a court-only rule of 1 regardless of
 * priority. Specificity before priority means an owner can add a narrow
 * exception without having to reason about every existing rule's number.
 */
function specificity(rule: PriceRule): number {
  let score = 0;
  if (rule.courtId !== null) score++;
  if (rule.weekdays !== null) score++;
  if (rule.fromMinutes !== null && rule.toMinutes !== null) score++;
  return score;
}

/**
 * The price for one slot, or null if nothing matches.
 *
 * **Null is not zero.** The caller MUST refuse the booking with
 * `no_price_configured` rather than letting a court go out free — and that
 * refusal is logged to `booking_attempts`, so a missing rule surfaces on the
 * dashboard instead of quietly costing money.
 */
export function resolvePrice(
  rules: readonly PriceRule[],
  ctx: PriceContext,
): ResolvedPrice | null {
  const winner = rules
    .filter((rule) => matches(rule, ctx))
    .sort(
      (a, b) =>
        specificity(b) - specificity(a) ||
        b.priority - a.priority ||
        b.createdAt.localeCompare(a.createdAt),
    )[0];

  return winner ? { pricePaise: winner.pricePaise, ruleId: winner.id } : null;
}

/**
 * Total for a booking spanning several slots.
 *
 * Summed per slot rather than multiplied, so a booking crossing from off-peak
 * into peak is priced correctly: 18:00-20:00 over a 19:00 peak boundary costs
 * off-peak + peak, not two of either.
 *
 * Returns null if ANY slot has no price — a partly-priced booking must not be
 * sold.
 */
export function resolveRangePrice(
  rules: readonly PriceRule[],
  base: Omit<PriceContext, 'startMinutes'>,
  startMinutes: readonly number[],
): { pricePaise: Paise; ruleIds: string[] } | null {
  const parts: ResolvedPrice[] = [];
  for (const minutes of startMinutes) {
    const resolved = resolvePrice(rules, { ...base, startMinutes: minutes });
    if (!resolved) return null;
    parts.push(resolved);
  }
  return {
    pricePaise: parts.reduce((total, part) => total + part.pricePaise, 0),
    ruleIds: parts.map((part) => part.ruleId),
  };
}
