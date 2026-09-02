# Pavilion Club — Implementation Plan

The working checklist. Every task links to the spec that defines it.

**Read [CLAUDE.md](CLAUDE.md) first**, then this. Phase rationale lives in
[system/14-build-phases.md](docs/system/14-build-phases.md) — this file is the execution order.

**Status:** Phase 0 partly built — `packages/core` complete, **142 tests green**.
Migrations written but **never executed** (Postgres not yet connected).
**Target:** ~9 weeks, one developer. ~6 weeks with two from Phase 2.

> Handing this to a new developer? Start at **[HANDOVER.md](HANDOVER.md)**.

---

## Document map

### System — what it does

| File | Covers | Read when |
|---|---|---|
| [system/00-overview.md](docs/system/00-overview.md) | Index, system summary | Starting |
| [system/01-decisions.md](docs/system/01-decisions.md) | D1–D7 locked decisions | Starting |
| [system/02-rules.md](docs/system/02-rules.md) | **The six non-negotiables** | **Always** |
| [system/03-stack.md](docs/system/03-stack.md) | Stack, layout, conventions | Phase 0 |
| [system/04-data-model.md](docs/system/04-data-model.md) | Full DDL, 20 tables, constraints | Any schema or query work |
| [system/05-booking-engine.md](docs/system/05-booking-engine.md) | Availability, pricing, holds, concurrency | Any booking work |
| [system/06-admin-console.md](docs/system/06-admin-console.md) | Every admin screen and metric definition | Phase 1 |
| [system/07-public-site.md](docs/system/07-public-site.md) | Public pages, booking flow, payment modes | Phase 2 |
| [system/08-partner-api.md](docs/system/08-partner-api.md) | Turf Town API, auth, errors, webhooks | Phase 3 |
| [system/09-money-settlement.md](docs/system/09-money-settlement.md) | Payment methods, refunds, settlement | Phases 1–3 |
| [system/10-reports-export.md](docs/system/10-reports-export.md) | Reports, Excel export, missed demand | Phase 3 |
| [system/11-roles-permissions.md](docs/system/11-roles-permissions.md) | Roles, permission matrix, audit | Phase 1 |
| [system/12-notifications.md](docs/system/12-notifications.md) | Outbox, templates, OTP | Phase 2 |
| [system/13-ops-security.md](docs/system/13-ops-security.md) | Hosting, backups, security controls | Phases 0 and 4 |
| [system/14-build-phases.md](docs/system/14-build-phases.md) | Phase rationale and gates | Planning |
| [system/15-open-questions.md](docs/system/15-open-questions.md) | What is still unanswered, and the default | When blocked |
| [system/glossary.md](docs/system/glossary.md) | Domain vocabulary | When naming things |

### Frontend — how it looks and is built

| File | Covers | Read when |
|---|---|---|
| [ui/00-overview.md](docs/ui/00-overview.md) | Two products, opposite goals | Starting UI work |
| [ui/01-principles.md](docs/ui/01-principles.md) | **Six design rules** | **Always, for UI** |
| [ui/02-design-system.md](docs/ui/02-design-system.md) | Neutral tokens, theme-swap guarantee | Any styling |
| [ui/03-patterns.md](docs/ui/03-patterns.md) | Shell, table, slot grid, panel, forms | Building screens |
| [ui/04-states.md](docs/ui/04-states.md) | Empty, loading, error, denied | Every screen |
| [ui/05-responsive.md](docs/ui/05-responsive.md) | Mobile-as-app, bottom tabs, PWA | Any screen |
| [ui/06-screens.md](docs/ui/06-screens.md) | Wireframes | Building screens |
| [ui/07-architecture.md](docs/ui/07-architecture.md) | Server/client split, actions, folders | Phase 1 start |
| [ui/08-copy-a11y.md](docs/ui/08-copy-a11y.md) | Words and accessibility | Every screen |
| [ui/09-state.md](docs/ui/09-state.md) | Where state lives, no store library | Any interactivity |

### Other

| File | |
|---|---|
| [docs/client/build-plan.html](docs/client/build-plan.html) | Client-facing plan ([published](https://claude.ai/code/artifact/f6821f61-8a48-483b-bb18-7d1f7768f419)) |
| [docs/client/turf-town-email.md](docs/client/turf-town-email.md) | Ready to send |

---

## Pre-flight — before any code

- [ ] **Send the Turf Town email** — [docs/client/turf-town-email.md](docs/client/turf-town-email.md). Their reply time is the only thing outside our control
- [ ] **Submit WhatsApp Business templates** — 3–7 days approval, blocks nothing meanwhile ([system/12-notifications.md](docs/system/12-notifications.md))
- [ ] **Buy the Hostinger VPS** — verify India/Singapore region and root access ([system/03-stack.md](docs/system/03-stack.md))
- [ ] **Register the domain**
- [ ] Create the GitHub repository

**Not needed yet:** Razorpay (deferred, Q20), brand assets (deferred by decision, Q21), price grid (Q16, needed by go-live).

---

## Phase 0 — Foundations and the engine · week 1

No screens. The thing that makes this a booking system rather than a spreadsheet.

### Setup
- [x] ✅ pnpm workspace, TypeScript strict, vitest → [system/03-stack.md](docs/system/03-stack.md)
- [x] ✅ `infra/compose.yml` — fallback only; **this machine already has PostgreSQL 18.4 running** → [system/13-ops-security.md](docs/system/13-ops-security.md)
- [x] ✅ Migration runner script — `scripts/migrate.mjs`, checksummed, forward-only
- [x] ✅ CI: typecheck, lint, test
- [x] ✅ Lint rule — **no hex colour in `.tsx`** → [ui/02-design-system.md](docs/ui/02-design-system.md)

### Database → [system/04-data-model.md](docs/system/04-data-model.md)

- [x] ✅ `0001_foundation.sql` — settings, courts, court_hours, channels, users, customers
- [x] ✅ `0002_bookings.sql` — price_rules, bookings, **the exclusion constraint**, `expire_stale_holds()`
- [x] ✅ `0003_money.sql` — payments, refunds, settlements, cash_handovers
- [x] ✅ `0004_partner.sql` — api_keys, webhook_outbox
- [x] ✅ `0005_ops.sql` — blackouts, audit_log, message_outbox, otp_codes, sessions
- [x] ✅ `0006_hardening.sql` — updated_at, notes, blocking, anonymisation, **booking_attempts**, login_attempts, `booking_balances` view
- [x] ✅ Seed — **3 courts, Mon–Fri 06:00–23:00, Sat–Sun 06:00–00:00, 60-min slots**
- [x] ✅ Two database roles + `REVOKE DELETE` → [system/13-ops-security.md](docs/system/13-ops-security.md)
- [x] ✅ Drizzle schema mirroring the migrations — **never `drizzle-kit push`**

### Core → [system/05-booking-engine.md](docs/system/05-booking-engine.md)
- [x] ✅ `core/time` — 30 tests — IST, business date, cross-midnight
- [x] ✅ `core/money` — 16 tests — paise
- [x] ✅ `core/pricing` — 21 tests — specificity then priority
- [x] ✅ `core/availability` — 37 tests — `computeAvailability`, `computeAvailabilityRange`, `findContiguous`
- [x] ✅ `core/booking` — 38 tests — guards, state machine, reference generator

### Write path
- [x] ✅ `createBooking` with **`23P01` and `40P01` retries**
- [x] ✅ `expireStaleHolds` + worker loop (30s)
- [x] ✅ `booking_attempts` logging — written *after* the attempt, never inside the transaction

### GATE — blocks merge
- [x] ✅ 100 concurrent bookings, one slot → exactly 1 wins, 99 `JUST_TAKEN`, 0 errors
- [x] ✅ 50 concurrent overlapping ranges of different lengths → no `40P01` escapes
- [x] ✅ Both run in CI

**Done when:** `npm run demo -- --date 2026-09-05` prints 54 slots and the stress test is green.

---

## Phase 1 — Admin console · weeks 2–4

**Milestone: the desk can run the venue.** No website, no Turf Town needed.

### Foundation → [ui/07-architecture.md](docs/ui/07-architecture.md)
- [ ] Next.js app, Tailwind, shadcn/ui init
- [ ] Neutral tokens → [ui/02-design-system.md](docs/ui/02-design-system.md)
- [ ] `/admin/_theme` preview page
- [ ] Auth — argon2id staff login, sessions, throttling → [system/13-ops-security.md](docs/system/13-ops-security.md)
- [ ] `requirePermission()` + the matrix → [system/11-roles-permissions.md](docs/system/11-roles-permissions.md)
- [ ] Audit log writing on every mutation
- [ ] Admin shell — sidebar, header search, **bottom tabs below `md`** → [ui/03-patterns.md](docs/ui/03-patterns.md), [ui/05-responsive.md](docs/ui/05-responsive.md)

### Screens → [system/06-admin-console.md](docs/system/06-admin-console.md) + [ui/06-screens.md](docs/ui/06-screens.md)
- [ ] **Now board** — desk landing page
- [ ] **Dashboard** — all tiles, exact definitions
- [ ] **Book a slot** — walk-in, cash/card, server-resolved price
- [ ] **Calendar month** — counts and fill bars
- [ ] **Calendar day** — slot grid; list below `lg`
- [ ] **Booking panel** — sheet; bottom sheet on mobile; activity log; partner cancel warning
- [ ] **Search** — our ref, **Turf Town ref**, phone, name
- [ ] **Customers** — list, detail, block/unblock
- [ ] **Daily close** and **Cash handover** (declared field starts empty)
- [ ] Settings: **Courts** (copy-to-all, warn on existing bookings), Pricing, Blackouts, Staff, Partners, Venue

### Every screen
- [ ] Loading, empty, no-results, error, denied → [ui/04-states.md](docs/ui/04-states.md)
- [ ] Keyboard shortcuts → [ui/06-screens.md](docs/ui/06-screens.md)
- [ ] Copy reviewed → [ui/08-copy-a11y.md](docs/ui/08-copy-a11y.md)

### GATE
- [ ] Permission matrix test passes in CI — desk role rejected everywhere the matrix says no
- [ ] A full day booked, paid, cancelled and closed with no SQL run by hand

---

## Phase 2 — Public site · weeks 5–6

Launches on **`pay_at_venue`**. Razorpay is deferred behind the mode switch.

- [ ] Marketing pages — neutral theme, no brand yet
- [ ] **`/book` step 1** — month calendar with availability dots
- [ ] **`/book` step 2** — hour list, Morning/Afternoon/Evening, adjacent-merge
- [ ] Auto court assignment with `change`
- [ ] Sticky summary bar
- [ ] Phone OTP — **mandatory** in `pay_at_venue` → [system/12-notifications.md](docs/system/12-notifications.md)
- [ ] Hold creation + countdown
- [ ] `pay_at_venue`: confirm unpaid, **cap unpaid bookings per phone**, no-show marker
- [ ] `/my-bookings` — OTP login, cancel with refund quote
- [ ] Message outbox + 5 customer templates
- [ ] **Legal pages** — terms, privacy, cancellation → [system/07-public-site.md](docs/system/07-public-site.md) §Legal pages. Lawyer review before go-live
- [ ] PWA manifest + icons → [ui/05-responsive.md](docs/ui/05-responsive.md)
- [ ] *Deferred:* Razorpay orders + webhook handler

### GATE
- [ ] Booking completable one-handed at 360px
- [ ] Focusing an input on iOS Safari does not zoom
- [ ] A real WhatsApp confirmation arrives on a phone

---

## Phase 3 — Turf Town and reporting · weeks 7–8

- [ ] API keys — issue, hash+pepper, revoke, scopes, shared-counter rate limit
- [ ] Five endpoints → [system/08-partner-api.md](docs/system/08-partner-api.md)
- [ ] Accept **direct confirm without a prior hold** (Q2 — support both)
- [ ] Stable error codes, CORS, published partner docs
- [ ] Outbound webhook queue, signed
- [ ] Settings → Partners detail, one commission field
- [ ] **Source-wise report** + **Excel export**, two sheets → [system/10-reports-export.md](docs/system/10-reports-export.md)
- [ ] **Missed demand report** — from `booking_attempts`
- [ ] Occupancy report
- [ ] Settlements — create, invoice, mark settled, write off → [system/09-money-settlement.md](docs/system/09-money-settlement.md)

### GATE
- [ ] A booking made on a sandbox key appears attributed to Turf Town in the report
- [ ] A key cannot read another channel's bookings (404, not 403)
- [ ] The Excel export sums correctly and opens cleanly

---

## Phase 4 — Go-live · week 9

- [ ] VPS provisioned, Caddy, TLS, domain
- [ ] Backups + WAL archiving off-box, encrypted
- [ ] **Restore rehearsal on a clean box** — blocks go-live
- [ ] Sentry with **PII scrubbing** → [system/13-ops-security.md](docs/system/13-ops-security.md)
- [ ] Uptime monitoring alerting to a phone
- [ ] Secrets out of the repo, rotation plan
- [ ] WhatsApp live, SMS fallback proven
- [ ] Real price grid, real courts, real staff accounts
- [ ] Staff training, one week running parallel with current process
- [ ] Full checklist in [system/13-ops-security.md](docs/system/13-ops-security.md) ticked

---

## Later — not in this build

Membership · coaching · tournaments · packs and wallets · multi-venue ·
**recurring bookings** (top candidate) · waitlist · Razorpay switch-on ·
brand theme swap · offline desk mode (argued against).

---

## When an answer arrives

1. Update [system/15-open-questions.md](docs/system/15-open-questions.md) — move it to Answered with the date
2. Update whichever spec it changes
3. If it changes a decision, update [system/01-decisions.md](docs/system/01-decisions.md)

Never leave a spec disagreeing with a known answer.
