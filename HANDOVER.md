# Handover

Written 2 September 2026. Read this first, then [CLAUDE.md](CLAUDE.md), then
[IMPLEMENTATION.md](IMPLEMENTATION.md).

---

## What this is

A booking and management system for **Pavilion Club**, a three-court badminton
venue. Three surfaces, one codebase:

1. **Admin console** — what the front desk uses all day
2. **Public site** — customers booking online
3. **Partner API** — Turf Town, a marketplace, selling the same courts

The hard problem is not any of the screens. It is that all three write into one
schedule and **the same court must never be sold twice**.

---

## Status, precisely

| | |
|---|---|
| **Specification** | Complete — 27 documents in `docs/` |
| **`packages/core`** | **Complete. 142 tests green, typecheck clean** |
| **Migrations** | Written — `db/migrations/0001`–`0006` — **never executed** |
| **Seed** | Written — `db/seed/0001_pavilion.sql` — never executed |
| **`packages/db`** | Not started |
| **The concurrency gate** | **Not run.** This is the important one |
| **`apps/web`, `apps/worker`** | Not started |
| **Git** | Initialised, **no commits yet** |

```bash
pnpm install && pnpm test
# 5 files, 142 tests, all passing, no database required
```

### Be careful with the word "done"

`packages/core` is genuinely done — it is pure TypeScript and its tests prove it.

The migrations are **written, not verified**. Nobody has run them. They will
probably work, but "probably" is not a status. Marked `[~]` in
[IMPLEMENTATION.md](IMPLEMENTATION.md).

---

## Your first hour

### 1. Connect Postgres — this is the only blocker

**PostgreSQL 18.4 is already installed and running** on the Windows machine this
was built on (service `postgresql-x64-18`, port 5432). It is not on PATH:

```
C:\Program Files\PostgreSQL\18\bin
```

Auth is `scram-sha-256`, so you need the `postgres` password. If nobody has it,
reset it in pgAdmin or as Administrator:

```
psql -U postgres
\password postgres
```

Then create `.env` (already gitignored):

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/pavilion
```

`infra/compose.yml` exists as a Docker fallback if you would rather not use the
local install. **Docker is not required.**

### 2. Create the database and run the migrations

```bash
psql -U postgres -c "CREATE DATABASE pavilion"
pnpm db:migrate --status     # what is pending
pnpm db:migrate --seed       # apply, then load 3 courts + hours + channels
```

Expect this to surface a syntax error or two. Nobody has run this SQL.

### 3. Sanity-check the seed

```sql
SELECT count(*) FROM court_hours;   -- 21  (3 courts x 7 days)
SELECT count(*) FROM channels;      --  5  (website, walkin, phone, admin, turftown)
```

---

## Then: finish Phase 0

Three tasks, in order. All specified in
[docs/system/05-booking-engine.md](docs/system/05-booking-engine.md).

**1. `packages/db`** — Drizzle schema mirroring the migrations, plus repositories
for bookings, courts, customers, channels and prices.

> **Never run `drizzle-kit push`.** We write the migrations by hand; Drizzle
> reads the schema, it does not generate it. The generator would silently drop
> the exclusion constraint, the partial indexes and `expire_stale_holds()` — and
> the exclusion constraint is the entire guarantee.

**2. `createBooking`** with both retries:

```ts
23P01  // exclusion violation — might be a genuinely taken slot, OR an expired
       // hold the sweeper has not reached. Expire the blocker, retry once.
40P01  // deadlock — two overlapping ranges of DIFFERENT lengths checking the
       // constraint simultaneously. Ordinary Saturday traffic. Backoff, retry.
```

Without the `40P01` branch, two customers wanting overlapping hours on a
Saturday evening both see a 500.

**3. The gate.** This is why Phase 0 exists:

```
100 simultaneous bookings, one slot
  → exactly 1 succeeds
  → 99 receive a clean JUST_TAKEN
  → 0 unhandled errors
```

Plus 50 concurrent *overlapping ranges of different lengths*, asserting no
`40P01` escapes. Both run in CI and block merge.

**Until that gate is green, nothing built on top is safe to sell.**

---

## Decisions that are locked

Full text and rationale in
[docs/system/01-decisions.md](docs/system/01-decisions.md). Please do not
relitigate these without talking to the client.

| | |
|---|---|
| **D1** | Standalone build, single venue. No `tenant_id` anywhere |
| **D2** | Turf Town calls **our** API. We stay the source of truth for availability |
| **D3** | Partner bookings are a **receivable** — confirmed, not collected, until settled |
| **D4** | Website rebuilt with booking built in |
| **D5** | Partner is Turf Town. The design stays channel-generic anyway |
| **D7** | badminton only. No sport column, no buffer time between bookings |

Also settled: **3 courts**, Mon–Fri 06:00–23:00, Sat–Sun 06:00–00:00,
**60-minute slots**, 10-minute holds, 30-day booking window.

Stack: Next.js 15 · PostgreSQL 16+ · Drizzle for CRUD, raw SQL for reports ·
Tailwind + shadcn/ui · auth built in-house · Hostinger VPS.

---

## The six rules

In [docs/system/02-rules.md](docs/system/02-rules.md). **Violating one is a bug
even when tests pass.**

1. Availability is computed in exactly one place. No caching in front of it.
2. Double booking is prevented by the database, not the code.
3. A booking is confirmed by the payment webhook, never by the browser.
4. Money is integer paise.
5. Prices are snapshotted onto the booking, recomputed server-side.
6. A channel is data, never a branch.

---

## Things that will bite you

Every one of these is already handled. They are listed so nobody "simplifies"
one away.

- **Holds are `bookings` rows**, not a separate table. It is the only way one
  exclusion constraint can cover both holds and confirmed bookings.
- **An expired hold still blocks in the database.** The constraint cannot see
  `expires_at`. Hence the sweeper *and* the `23P01` retry. Availability, by
  contrast, correctly treats it as free — that asymmetry is deliberate and
  tested.
- **`AT TIME ZONE` is STABLE, not IMMUTABLE**, so Postgres rejects it in a
  generated column. That is why `business_date` is written by the application.
- **Partner bookings have no payments row until settled.** This is why
  `refundQuote` returns zero for them with no channel check anywhere — it falls
  out of the money model. Do not add an `if`.
- **A part-hour request must not report "CLOSED".** Guards match slots that
  *overlap* the request, not slots contained by it. This was a real bug, caught
  by a test.
- **The reference alphabet excludes `L`** as well as `0`, `O`, `1` and `I`.
  Also a real bug — the spec contradicted itself.

---

## Open questions

[docs/system/15-open-questions.md](docs/system/15-open-questions.md) lists 24,
each with **the default assumed until answered**. Use the default; do not invent
a different one silently.

**Nothing blocks Phase 0 or Phase 1.** The ones with a real deadline:

| | Needed by |
|---|---|
| Turf Town's integration docs + venue agreement | Phase 3 (week 7) |
| The real price grid | Go-live |
| Whose Razorpay account, and start the KYC | Before switching to `gateway` mode |
| Brand assets | Deferred by decision — build on neutral tokens |

An email to Turf Town is drafted and unsent:
[docs/client/turf-town-email.md](docs/client/turf-town-email.md). Their reply
time is the only thing on this project outside our control — send it early.

---

## Two things deliberately deferred

**Razorpay.** The public site launches on `online_payment_mode = 'pay_at_venue'`:
booked online, paid at the desk. Flipping to `gateway` is one settings change.
But in `pay_at_venue` mode, **OTP, a cap on unpaid bookings per phone, and the
no-show marker are mandatory, not optional** — without payment, a free booking is
a free way to hold a Saturday court.

**Visual design.** No theme, fonts or brand work. Everything is built on neutral
tokens and the whole look is replaced later by editing one token file. A lint
rule forbidding hex colours in `.tsx` keeps that promise real —
[docs/ui/02-design-system.md](docs/ui/02-design-system.md).

---

## Where things live

```
CLAUDE.md              rules and conventions — an AI agent reads this first
IMPLEMENTATION.md      the checklist, every task linked to its spec
docs/system/  (17)     what the system does
docs/ui/      (10)     how it looks and is built
docs/client/   (2)     client-facing plan, Turf Town email
db/migrations          0001-0006, forward-only, checksummed by the runner
packages/core          time · money · pricing · availability · booking  ✓ 142 tests
packages/db            NOT STARTED
apps/web, apps/worker  NOT STARTED
```

`packages/core` must never import Next.js, React, or a database driver. It takes
data in and returns decisions. **If the core suite is green, the booking logic is
correct** — and that boundary is what lets the desk, the website and Turf Town
share one answer to "what is free".

---

## Before you start

Nothing is committed. Make the first commit so there is a baseline to work from:

```bash
git add -A
git commit -m "Phase 0: specification, core engine, migrations"
```
