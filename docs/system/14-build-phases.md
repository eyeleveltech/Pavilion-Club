---
id: 14-build-phases
title: Build phases
status: draft
audience: ai-agent, client
---

# 14 — Build phases

Estimates assume **one full-time developer**. Two working in parallel from
Phase 2 compresses this to roughly six weeks. Everything below is the client's
Phase 1 — membership is not in it.

Decision D6: admin console before public website. After Phase 1 the desk can run
the entire venue with no website and no partner integration.

---

## Phase 0 — Foundations and the availability engine
**Week 1. Gate: the concurrency test passes.**

- [ ] Repository, TypeScript strict, test runner, CI pipeline
- [ ] `db/migrations/0001` … `0005` from `04-data-model.md`
- [ ] Migration runner, Docker Compose for local Postgres
- [ ] `core/time` — IST, business date, cross-midnight
- [ ] `core/pricing` — rule resolution by specificity then priority
- [ ] `core/availability` — the slot engine (R1)
- [ ] `core/booking` — state machine, write-path guards, the 23P01 and 40P01 retries
- [ ] `db/repositories` — bookings, courts, customers, channels
- [ ] Seed data: channels, courts, price rules

```
GATE
- 100 simultaneous bookings on one slot: exactly one wins, no unhandled errors
- 50 concurrent overlapping ranges of different lengths: no 40P01 escapes
- both tests run in CI and block merge
```

**Start in parallel, because they run on someone else's clock:** WhatsApp
template submission, Razorpay account, domain, VPS.

---

## Phase 1 — Admin console
**Weeks 2–4. Milestone: the desk can run the venue.**

- [ ] Staff login, sessions, roles, `requirePermission()`
- [ ] Audit log writing on every mutating action
- [ ] Settings: courts, opening hours, price rules with a live preview
- [ ] Settings: staff, with confirmed reversible deactivation
- [ ] **Book a slot** — walk-in screen, cash and card, server-recomputed price
- [ ] **Calendar** — month view with per-date counts
- [ ] **Calendar** — day grid, channel-coloured, paid vs unpaid, slot detail panel
- [ ] Cancel with refund quote, reschedule, mark no-show
- [ ] Blackouts
- [ ] **Dashboard** — every tile in `06-admin-console.md` §1
- [ ] Daily close, cash handover with the empty declaration field

```
GATE
- the permission matrix test passes in CI
- a full day can be booked, paid, cancelled and closed with no SQL run by hand
```

---

## Phase 2 — Public site and online payment
**Weeks 5–6. Gate: a real test payment confirms exactly one booking.**

- [ ] Marketing pages, design, content, photographs
- [ ] `/book` — date picker, slot grid, multi-slot selection
- [ ] Hold creation with countdown
- [ ] Phone OTP — **mandatory**, not optional, in `pay_at_venue` mode
- [ ] `pay_at_venue` flow: confirm unpaid, cap unpaid bookings per phone, no-show marker
- [ ] Confirmation page with polling
- [ ] Razorpay order creation — **deferred (Q20), built behind the mode switch**
- [ ] Webhook handler: signature verification, store-then-process, idempotent — deferred with it
- [ ] `/my-bookings` — list, cancel with refund quote
- [ ] Message outbox and the five customer templates
- [ ] Terms, privacy, cancellation policy pages — contents specified in
      `07-public-site.md` §Legal pages. Drafted by us, **reviewed by a lawyer
      before go-live**. Razorpay will not approve the account without them, and
      the privacy policy must cover data received from Turf Town

```
GATE
- a real gateway test payment confirms exactly one booking via webhook
- delivering the same webhook twice changes nothing
- closing the browser after payment still yields a confirmed booking
- a real WhatsApp confirmation arrives on a phone
```

---

## Phase 3 — Partner API and reporting
**Weeks 7–8. Gate: the partner books end to end against sandbox keys.**

- [ ] API key issue, hash, revoke; scopes; shared-counter rate limiting
- [ ] `GET /availability`, `POST /holds`, `POST /bookings`, `GET /bookings/{id}`, cancel
- [ ] Stable error codes, CORS, published API documentation for the partner
- [ ] Outbound webhook queue with signing and retry
- [ ] Settings → Partners screen
- [ ] Source-wise report
- [ ] Excel export, both sheets
- [ ] Settlement lifecycle: create, invoice, mark settled, write off
- [ ] Occupancy report

```
GATE
- the partner completes a booking end to end on sandbox keys
- it appears in the source-wise report attributed to them
- the Excel export sums correctly and opens cleanly in Excel
- a key cannot read another channel's bookings
```

**Risk:** this phase waits on the partner's calendar, not ours. Get their API
documentation and a sandbox key **during Phase 1**, so Phase 3 is building
rather than waiting.

---

## Phase 4 — Go-live hardening
**Week 9.**

- [ ] VPS provisioned, domain, TLS, Caddy
- [ ] Backups running, **restore rehearsal completed on a clean box**
- [ ] Sentry, uptime monitoring, alerting to a phone
- [ ] Secrets moved out of the repository, rotation plan written
- [ ] WhatsApp templates approved and live, SMS fallback proven
- [ ] Reconciliation job running clean
- [ ] Staff training, and one week running in parallel with whatever they use today
- [ ] The full checklist in `13-ops-security.md` ticked

---

## Out of scope

Named here so they are visible decisions rather than forgotten ones.

| Item | When | Note |
|---|---|---|
| **Membership** | Phase 2 (client's own numbering) | *"Membership they want to take. That and all we will add it in a later stage."* Design `customers` with it in mind; build none of it now. |
| Coaching, academies | Later | Different booking shape entirely |
| Tournaments and events | Later | |
| Prepaid packs and wallets | Later | Natural companion to membership |
| Mobile app | Later | The site works on a phone |
| Multi-venue | Not planned | Single-tenant by decision D1 |
| Dynamic pricing | Later | Cheaper once the engine is proven |
| Waiting list | Later | |
| Recurring or standing slots | Later | Common request from regular groups; revisit after go-live |
