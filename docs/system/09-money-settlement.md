---
id: 09-money-settlement
title: Money and settlement
status: draft
audience: ai-agent, client
depends_on: [04-data-model]
---

# 09 — Money and settlement

R4: everything here is **integer paise**.

## The four ways money reaches Pavilion Club

| Method | `payment_method` | Arrives | Payment row written |
|---|---|---|---|
| Online | `gateway` | Gateway settles to bank T+2 | On webhook confirmation (R3) |
| Cash at the desk | `cash` | Immediately, into the till | When the desk records it |
| Card at the desk | `card` | Through their own machine | When the desk records it |
| Partner platform | `partner` | **Later, on invoice** | **Only at settlement** |

Card means the venue's own card machine. We record the mode; we do not process
the card and hold no card data.

## The rule that keeps the numbers honest

> **`collected` is always `SUM(payments.amount_paise)`. A booking with no
> payments row has not been paid.**

This is why a partner booking writes no payment row at booking time. If partner
bookings counted as collected, the daily cash figure would never match the bank,
and nobody would trust any number in the system.

Every screen showing money therefore shows **two different figures** and labels
them clearly:

- **Booked value** — `SUM(bookings.amount_paise)`. What was sold.
- **Collected** — `SUM(payments.amount_paise)`. What arrived.

`Outstanding = booked value − collected`, split into *customer owes* (unpaid
desk bookings) and *partner owes* (receivables).

## Partner settlement lifecycle (decision D3)

```
partner books   ->  PENDING      booking confirmed, settlement_id NULL, no payment row
month ends      ->  INVOICED     settlements row created, bookings stamped with settlement_id,
                                 Excel exported and sent to the partner
partner pays    ->  SETTLED      settled_at + settled_amount_paise recorded,
                                 one payments row per booking, method = 'partner'
never pays      ->  WRITTEN_OFF  requires owner role and a reason
```

### Commission is not our arithmetic

**Out of scope: calculating the partner's commission.** How Turf Town works out
their cut is their business. We do not model tiers, caps, per-slot rates, or
their customer-facing service fee.

What we do is state, with evidence, **what was sold through them and what it was
worth at our prices**. That is what the client asked for and it is enough to
invoice on.

`channels.commission_bps` is one optional number, used only to show an expected
figure so an underpayment is visible. Left at 0, the settlement shows gross —
still a complete invoice.

### Creating a settlement

```sql
-- Every unsettled partner booking in the period.
SELECT b.id, b.reference, b.amount_paise
  FROM bookings b
  JOIN channels c ON c.id = b.channel_id
 WHERE c.settles_later = true
   AND c.id = $1
   AND b.business_date BETWEEN $2 AND $3
   AND b.status IN ('confirmed','completed','no_show')
   AND b.settlement_id IS NULL;
```

- `gross_paise` = sum of `amount_paise` — **our** slot price, never the amount
  the partner collected from their customer (which includes their own fee).
- `commission_paise` = `gross_paise × commission_bps / 10000`, computed **once,
  when the settlement is created**, and frozen on the settlement row.
- `net_paise = gross_paise − commission_paise` — what we expect to receive.
- Changing the rate later never rewrites an existing settlement, because the
  numbers were frozen at creation. If a rate changes mid-period, create two
  settlements — the period fields already allow it.
- Stamping `settlement_id` onto the bookings makes it immutable.
- Cancelled bookings are excluded. No-shows are **included**: the court was held,
  the customer did not come, and the partner still took the money.
- Stamping `settlement_id` onto the bookings makes the settlement immutable —
  a later booking in the same period joins the next settlement, not this one.

### Marking settled

Records `settled_at` and `settled_amount_paise`, and writes one `payments` row
per booking with `method = 'partner'` and `received_on` = the settlement date.
From that moment those bookings count as collected — on the date the money
actually arrived, not the date of the game.

If `settled_amount_paise` differs from `net_paise`, the variance is shown and a
note is required.

## Refunds

- A refund is a row in `refunds`, written **in the same transaction as the
  cancellation**. A cancel that writes no refund is a bug — this exact defect
  shipped in Turf OS and buried paid bookings with no record.
- Amount comes from `refundQuote()` (see `05-booking-engine.md`), computed on
  what was **actually paid**, never on `amount_paise`.
- Gateway refunds are queued and drained by the worker; `status` moves
  `pending → sent`. Cash and card refunds are marked `sent` by the desk when
  handed over.
- A partner booking we were never paid for produces a **zero** refund from us.
  The partner refunds their own customer.

## Cash handover

At the end of a shift the system computes what it expects:

```sql
SELECT COALESCE(SUM(amount_paise), 0)
  FROM payments
 WHERE method = 'cash' AND received_on = $1 AND received_by = $2;
```

The staff member declares what is in the till. **The declared field starts
empty.** Variance is stored; a non-zero variance requires a note. Attribution is
by `received_by` — who physically took the money — not by who created the
booking. The owner who answered the phone at noon must not be expected to hand
over cash the evening shift collected.

```
ACCEPTANCE
- a partner booking creates zero payments rows until its settlement is marked settled
- marking a settlement settled moves those bookings into "collected" on the settlement date
- gross - commission = net for every settlement
- a booking already stamped with a settlement_id cannot join a second settlement
- cancelling a paid booking writes a refund row in the same transaction
- the cash declaration field renders empty, never pre-filled
```
