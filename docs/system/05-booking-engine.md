---
id: 05-booking-engine
title: Booking engine
status: draft
audience: ai-agent
priority: load-before-any-availability-or-booking-work
depends_on: [02-rules, 04-data-model]
---

# 05 — Booking engine

Lives in `packages/core`. Pure TypeScript: no React, no Next.js, no database
driver. It takes data in and returns decisions. **If the core test suite is
green, the booking logic is correct.**

---

## Time and the business date

All timestamps are stored `timestamptz` (UTC) and displayed in `Asia/Kolkata`.

A **business date** is the night a booking belongs to. If the venue runs past
midnight, a 00:30 booking belongs to the night that is closing, not to tomorrow
morning. Every report keys off `business_date`.

```ts
/**
 * The business date a moment falls on.
 * Anything before business_day_start_hour (default 05:00 IST) belongs to the
 * previous calendar date.
 */
function businessDate(at: Date, startHour: number): string {  // 'YYYY-MM-DD'
  const ist = toIst(at);
  return ist.hour < startHour ? ymd(addDays(ist, -1)) : ymd(ist);
}
```

**MUST NOT** be a Postgres generated column: `AT TIME ZONE` on a `timestamptz`
is `STABLE`, not `IMMUTABLE`, so Postgres rejects it inside `GENERATED ALWAYS AS`.
The application writes it.

```
ACCEPTANCE
- 2026-09-06T00:30 IST with startHour 5 returns 2026-09-05
- 2026-09-06T05:00 IST with startHour 5 returns 2026-09-06
- a court open 06:00 to 02:00 (open=360, close=1560) produces one continuous
  sheet, and the 01:00 slot reports against the previous day
```

---

## Availability — R1 lives here

**One function.** Every surface calls it. No cache in front of it. No second
implementation.

```ts
type Slot = {
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  pricePaise: number;
  state: 'free' | 'held' | 'booked' | 'blackout' | 'closed' | 'past';
  booking?: { id: string; reference: string; channelCode: string; customerName: string | null; paid: boolean };
};

function computeAvailability(input: {
  courts: Court[];
  hours: CourtHours[];
  bookings: Booking[];     // status held | confirmed, overlapping the window
  blackouts: Blackout[];
  priceRules: PriceRule[];
  date: string;            // business date
  now: Date;
  settings: VenueSettings;
}): Slot[];
```

### Algorithm

1. For the requested business date, resolve each bookable court's `open_minutes`
   and `close_minutes` for that weekday. No row means the court is closed.
2. Generate candidate slots of `court.slot_minutes` from open to close.
   `close_minutes > 1440` continues into the next calendar day — one continuous
   sheet, not two.
3. Mark any slot overlapping a `held` or `confirmed` booking as `held` / `booked`,
   attaching the channel so the admin grid can colour it.
4. Mark any slot overlapping a `blackout` as `blackout`.
5. Mark any slot whose `endsAt <= now` as `past`.
6. Price every remaining slot via `resolvePrice()`.
7. Return the full list, including unavailable slots — the admin day grid needs
   to render them. Public callers filter to `state === 'free'`.

**MUST NOT** apply the booking window here. `booking_window_days` is a write-path
guard, not an availability concept — the desk can book beyond it.

```
ACCEPTANCE
- the admin day grid, the public /book grid, and GET /api/v1/availability
  return identical free-slot sets for the same court and date
- a cancelled booking frees its slot immediately
- an expired hold frees its slot even before the sweeper runs
```

---

## Pricing

```ts
function resolvePrice(rules: PriceRule[], ctx: {
  courtId: string; weekday: number; startMinutes: number; date: string;
}): { pricePaise: number; ruleId: string } | null;
```

1. **Filter** to active rules where every non-null scope matches:
   `court_id`, `weekdays` contains `weekday`, `startMinutes` within
   `[from_minutes, to_minutes)`, and `date` within `valid_from`/`valid_to`.
2. **Sort by specificity**, most specific first. Specificity is the count of
   non-null scope columns: court + weekday + time = 3, beats court alone = 1.
3. **Tie-break on `priority` descending**, then `created_at` descending.
4. **First rule wins.** No rule matching is a configuration error: refuse the
   booking with `no_price_configured` rather than defaulting to zero.

R5: the result is written to `bookings.amount_paise` and `price_rule_id`. Editing
a rule later MUST NOT change any existing booking.

```
ACCEPTANCE
- a court+weekday+time rule beats a court-only rule regardless of priority
- two rules of equal specificity resolve by priority, then by newest
- no matching rule returns null and the caller refuses the booking
```

---

## Multi-slot bookings

A customer may select several **consecutive** slots on one court. They become
**one booking row** spanning the whole range, not several rows.

- Selected slots MUST be contiguous on the same court, all `free`.
- `amount_paise` is the sum of the per-slot resolved prices, so a booking
  crossing from off-peak into peak is priced correctly.
- The exclusion constraint covers the whole range, so a 19:00–21:00 booking
  blocks a competing 20:00–21:00 automatically.

---

## Creating a booking — the write path

```ts
type CreateResult =
  | { ok: true; bookingId: string; reference: string }
  | { ok: false; reason: 'JUST_TAKEN' | 'CLOSED' | 'PAST' | 'NO_PRICE'
                        | 'OUTSIDE_WINDOW' | 'BLACKOUT' | 'DUPLICATE' };

async function createBooking(input: CreateBookingInput): Promise<CreateResult>;
```

Guards, in order. All run server-side. **The amount is never taken from the
request.**

1. `starts_at` is in the future (desk MAY back-date with `booking:backdate`).
2. Within `booking_window_days` for public and partner callers; the desk is exempt.
3. Court exists, `is_bookable`, and the range sits inside opening hours.
4. No overlapping blackout.
5. Price resolved server-side via `resolvePrice()`. R5.
6. `business_date` computed and written.
7. `reference` generated: `PC-` plus 6 chars from an unambiguous alphabet
   (no I, O, 0, 1).
8. Insert. The database enforces non-overlap. R2.

### Handling the two database errors

```ts
// 23P01 — exclusion violation. Might be a genuinely taken slot, or an expired
// hold the sweeper has not reached yet. Expire the blocker, retry once.
// 40P01 — deadlock. Two overlapping ranges of DIFFERENT lengths checking the
// constraint at the same time. This is ordinary Saturday traffic when customers
// can select consecutive slots. Treat it as contention, not failure.
for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
  try {
    return await insertBooking(tx, row);
  } catch (e) {
    if (e.code === '23P01') {
      const freed = await expireBlockingHold(tx, row.courtId, row.startsAt, row.endsAt);
      if (!freed) return { ok: false, reason: 'JUST_TAKEN' };
      continue;
    }
    if (e.code === '40P01') {
      await sleep(jitteredBackoff(attempt));   // e.g. 25ms, 60ms, 140ms, jittered
      continue;
    }
    throw e;
  }
}
return { ok: false, reason: 'JUST_TAKEN' };
```

Without the `40P01` branch, two people wanting overlapping hours on a Saturday
evening see a 500.

```
ACCEPTANCE — this test blocks merge
- 100 simultaneous requests for the same slot: exactly 1 succeeds,
  99 receive JUST_TAKEN, 0 receive an unhandled error
- 50 concurrent requests for OVERLAPPING ranges of different lengths
  (19:00-21:00 vs 20:00-21:00): no unhandled 40P01 escapes
- a request whose slot is covered only by an expired hold succeeds
```

---

## Holds and expiry

A hold **is a `bookings` row** with `status = 'held'` and `expires_at`. It is
NOT a separate table — that is the only way one exclusion constraint can cover
both holds and confirmed bookings.

```
create hold  ->  status=held, expires_at = now + hold_ttl_minutes (default 10)
pay          ->  status=confirmed, confirmed_at set, expires_at kept for history
no payment   ->  status=cancelled, cancelled_by=system_expiry
```

Two mechanisms, both required:

1. **The sweeper** — `expire_stale_holds()` every ~30s from the worker. Keeps
   the table tidy and frees slots for the availability read.
2. **The retry above** — expires the specific blocking row on `23P01`.
   Correctness comes from this, not from the sweeper's schedule.

---

## State transitions

| From | To | Trigger | Side effects |
|---|---|---|---|
| — | `held` | hold created | slot blocked |
| `held` | `confirmed` | gateway webhook (R3), desk payment, or partner confirm | payment row unless `settles_later`; confirmation message queued |
| `held` | `cancelled` | expiry, or explicit release | none |
| `confirmed` | `cancelled` | customer, desk, or partner | refund row per policy; audit row; `booking.cancelled` webhook |
| `confirmed` | `completed` | nightly job after `ends_at` | none |
| `confirmed` | `no_show` | desk marks it | kept distinct from cancelled for reporting |

Any other transition MUST be rejected. Every cancellation MUST write an
`audit_log` row naming the actor — a cancel that writes no refund, no
`cancelled_by` and no audit row is exactly the bug QA found in the neighbouring
Turf OS build.

---

## Cancellation and refunds

**The one rule everything follows from: whoever collected the money handles the
refund.** Decided with the client 2026-09-01.

| Booking from | Who may cancel | Cutoff applies | Refund |
|---|---|---|---|
| **Partner** (Turf Town) | The partner via the API, or our desk | **No** — any time | **None from us.** The partner refunds their own customer |
| **Website** | The customer in `/my-bookings`, or the desk | **Yes** | Per policy, refunded by us through the gateway |
| **Walk-in / phone** | The desk | Desk discretion | Per policy, cash or card returned at the desk |

In every case the **slot frees immediately**. Availability never waits on a
refund.

```ts
function refundQuote(booking: Booking, now: Date, s: VenueSettings): {
  refundPaise: number; reason: string;
};
```

- The quote is computed on what was **actually paid to us** — `SUM(payments)` —
  never on `amount_paise`.
- A partner booking has no payments row, so the quote is **zero by
  construction**. No special case, no channel check. This falls straight out of
  the money model in `09-money-settlement.md`.
- Direct booking, more than `cancellation_cutoff_hours` before `starts_at`:
  refund `cancellation_refund_pct` of what was paid.
- Direct booking, inside the cutoff: no refund.
- The quote MUST be shown before the user confirms, and stored on the refund row.

### Why the partner gets no cutoff

Pavilion Club absorbs the late-cancellation loss on partner bookings — a client
decision, made knowingly. The exposure is roughly 2–4 peak slots a month at
~40 partner bookings, order ₹30k–₹60k a year (`15-open-questions.md` Q5).

If that later proves too expensive, the fix is a `WHERE` clause: `cancelled_at`
and `cancelled_by` are already stored, so late-cancelled partner bookings can be
kept on the invoice without any schema change.

`OPEN` — the cutoff hours and refund percentage for direct bookings are defaults
pending `15-open-questions.md` Q17.
