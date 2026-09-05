---
id: 01-decisions
title: Decisions taken and open
status: draft
---

# 01 — Decisions

Locked decisions. The rest of the specification follows from these. Reopening
one is a conversation with the client, not a refactor.

## D1 — Standalone build

Pavilion Club is a **new single-tenant codebase**, not a tenant on the existing
Turf OS multi-tenant platform in the adjacent folder.

- **Consequence:** no `tenant_id` column anywhere. Venue-wide settings live in a
  single-row `venue_settings` table.
- **Consequence:** Turf OS code is NOT imported, but its engineering rules are
  carried across deliberately — see `02-rules.md`.
- **Would reopen if:** a second venue is added. That is a real re-architecture,
  not a config change.

## D2 — The partner calls us

An outside booking platform reads live availability from **our** API and pushes
us confirmations. We do not poll theirs.

- **Consequence:** we remain the single source of truth for availability, so
  overselling is structurally impossible.
- **Consequence:** we build and document a public REST API. See `08-partner-api.md`.
- **Would reopen if:** the partner cannot call an external API at checkout. The
  fallback is exclusive slot allocation — see `08-partner-api.md` §Fallback.

## D3 — Partner money is a receivable

A booking sold by a partner is recorded as **confirmed but not paid to us**
until someone marks it settled.

- **Consequence:** a partner booking creates NO `payments` row at booking time.
  `collected` therefore always equals the sum of payments.
- **Consequence:** `booked value` and `collected` are separate figures on every
  screen that shows money.
- This model is correct whichever way the partner's payout works. If they remit
  instantly, a booking moves to settled the same day.
- **Status: partially open.** How the partner actually handles payment is
  unknown. See `15-open-questions.md` Q2.

## D4 — Rebuild the website with booking built in

One codebase for the marketing site and the booking flow. No embed widget, no
second system to keep in sync.

## D5 — The partner is Turf Town, and the design stays generic

**Confirmed 2026-09-01:** the partner is **Turf Town**
(turftown.in, M/s. Turf Town Technologies Private Limited, Chennai). A
marketplace — they list Pavilion Club, their users book, they collect the money.
There is only one partner platform. "Townscript" in the transcript was a
mishearing.

The generic **channel** design stays anyway, because it costs nothing:

- Any outside platform plugs in identically, with its own API key, colour,
  commission rate, and line in the revenue report.
- Rule R6 — no per-partner code branch, ever.
- Adding a second marketplace later is a `channels` row plus an API key, and
  nothing else.

**Two live risks specific to Turf Town**, both from their published terms:

- Their ToS §II.3 charges the *user* a service fee that varies by demand,
  weather and season. **The amount they collect is not our slot price.**
  Settlement gross is always `SUM(bookings.amount_paise)` — ours.
- Their ToS §IX.1 disclaims all responsibility for the venue transaction. A
  double booking lands on Pavilion Club, not on them. This makes
  hold-before-payment a commercial requirement, not a technical preference.

See `15-open-questions.md` Q1–Q11.

## D5a — Their integration spec may govern

`OPEN, BLOCKING for Phase 3.` The client states Turf Town has an existing API
that other venue-management platforms already integrate with. If so, we build to
**their** contract and `08-partner-api.md` becomes our internal design rather
than the published interface.

No public documentation of it exists — searched 2026-09-01. It must come from
Turf Town directly, along with the venue agreement.

This does not change the engine. Availability, holds, the exclusion constraint
and the concurrency guarantees are identical whichever contract sits in front of
them. Only the request and response shapes move. **Unless** their model requires
us to push availability to them and receive bookings asynchronously — that
breaks R1, and needs a design conversation before any code.

## D7 — Badminton only

Confirmed 2026-09-01. Every court is a badminton court. There is no other sport
at this venue.

- **No `sport` column on `courts`**, and no multi-sport logic anywhere. Courts
  differ only by name, hours and price.
- **No buffer time between bookings.** Four players walk off, four walk on — a
  minute. With 60-minute slots, a buffer would cost a full sellable hour to save
  ten minutes. Gaps, when needed, come from split opening hours (a daily break)
  or a blackout (a one-off).
- If a second sport is ever added, revisit this. It is a real change, not a
  config flag.

## D6 — Build order is admin first

Phase 1 delivers the admin console before the public website.

- **Rationale:** after Phase 1 the desk can run the entire venue with no website
  and no partner integration. That is a shippable milestone in week 4 and it
  de-risks everything after it.
- Full breakdown in `14-build-phases.md`.
