---
id: 02-rules
title: The six rules
status: locked
audience: ai-agent
priority: always-load
---

# 02 — The six rules

Non-negotiable. Each exists because breaking it produces a specific, expensive
failure — usually on a Saturday evening when the courts are full. **Violating one
is a bug even if every test passes.** Changing one needs a conversation, not a
commit.

---

## R1 — Availability is computed in exactly one place

**Rule.** One function, `computeAvailability()`, decides what is free. The
website, the admin console, and the partner API all call it. There MUST NOT be
a second implementation, a cache in front of it, or a materialised availability
table.

**Failure it prevents.** Two implementations always drift. The drift is
discovered by a customer standing on a court someone else booked.

**Enforcement.** Any query that reads `bookings` to decide bookability outside
`packages/core/availability` is a review rejection.

```
ACCEPTANCE
- grep for direct availability queries outside the availability module returns nothing
- the admin day grid, the public /book grid, and GET /api/v1/availability
  return identical free-slot sets for the same court and date
```

---

## R2 — Double booking is prevented by the database, not the code

**Rule.** A Postgres exclusion constraint physically rejects an overlapping
booking on the same court. Application logic MAY have a race condition and the
guarantee MUST still hold.

**Failure it prevents.** SELECT-then-INSERT has a window. Under real Saturday
load, that window is hit.

**Enforcement.** The constraint in `04-data-model.md` §bookings. Never dropped,
never made `DEFERRABLE`, never worked around with advisory locks.

```
ACCEPTANCE
- 100 simultaneous booking requests for the same slot: exactly 1 succeeds,
  99 receive a clean `slot_taken`, 0 receive a 500
- this test runs on every commit and blocks merge
```

---

## R3 — A booking is confirmed by the payment webhook, never by the browser

**Rule.** Only the gateway's server-to-server webhook flips a booking to
`confirmed`. The browser redirect polls; it does not confirm. Webhook handling
MUST be idempotent on the gateway's event id.

**Failure it prevents.** A customer on a weak mobile network pays and loses the
slot because the redirect never landed.

```
ACCEPTANCE
- a real gateway test payment confirms exactly one booking via webhook
- delivering that same webhook a second time changes nothing
- killing the browser after payment still results in a confirmed booking
```

---

## R4 — Money is integer paise

**Rule.** All money is `integer` paise. Column names end `_paise`. No floats, no
`numeric`, no rupee values in the database, no currency formatting below the UI
layer.

**Failure it prevents.** Floating-point drift in totals, and reports that do not
reconcile to the bank.

```
ACCEPTANCE
- no column of type real/double/numeric holds money
- ₹1,200 round-trips as 120000
```

---

## R5 — Prices are snapshotted onto the booking, and recomputed server-side

**Rule.** The server recomputes the price from `price_rules` at creation time
and writes the result to `bookings.amount_paise`. A price arriving in a request
body MUST be ignored. Editing a price rule MUST NOT change any existing booking.

**Failure it prevents.** Two real ones. (a) A booking held for ₹1 because the
price came from a hidden form field — this happened in the neighbouring Turf OS
build and was found by QA, not by tests. (b) Changing the weekend rate silently
rewriting what last month's customer paid, and what a partner owes on it.

**Exception.** A desk price override is allowed, but MUST require a reason and
MUST write an `audit_log` row.

```
ACCEPTANCE
- posting amount_paise in a booking request body has no effect on what is stored
- editing a price rule leaves every existing booking's amount unchanged
- an override without a reason is rejected
```

---

## R6 — A channel is data, never a branch

**Rule.** Website, walk-in, phone, admin, and each partner platform are rows in
`channels`. There MUST NOT be a partner name in a conditional anywhere in the
codebase.

**Failure it prevents.** Onboarding the second platform becoming a rewrite.

```
ACCEPTANCE
- grep for partner brand names in source returns only seed data and documentation
- a new partner is onboarded with one channels row + one api_keys row, no deploy
```
