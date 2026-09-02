---
id: 03-stack
title: Stack, layout, conventions
status: confirmed 2026-09-01
---

# 03 — Stack and conventions

## Technology

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 15 (App Router), TypeScript strict | One codebase for site, admin, and API. Server components keep availability logic server-side. |
| Database | **PostgreSQL 16+** | Non-negotiable. R2 needs exclusion constraints and `btree_gist`. No other mainstream database offers this. |
| Schema | Plain SQL migrations, numbered, forward-only | The constraints ARE the product. **Drizzle does not own the schema** — we write the migrations, Drizzle reads them. Never `drizzle-kit push`. |
| Query layer | **Drizzle ORM** for CRUD, **raw SQL** for reports and the write path | Type safety catches a column typo at compile time, which matters when agents write the code. Reports stay readable as SQL. |
| Auth | **Built, not a library** | Staff: phone/email + argon2id password. Customers: phone + 6-digit OTP. Both use the `sessions` table already in the schema. Phone-OTP is what auth libraries handle worst. |
| Styling | Tailwind CSS + **shadcn/ui** | Confirmed. Components are copied into the repo, not installed as a dependency — we own and edit them. Dialog, table, form, select, popover and date picker cover most of the admin console. |
| Payments | Razorpay (orders + webhook) | Standard for Indian venues. UPI, cards, netbanking. |
| Messaging | WhatsApp BSP (AiSensy/Interakt) + SMS fallback (MSG91) | See `12-notifications.md`. |
| Excel | SheetJS (`xlsx`) | Client asked for a downloadable sheet, not CSV. |
| Hosting | **Hostinger VPS**, Docker Compose + Caddy | Confirmed. Root access, real cron for the sweeper, no cold start on webhooks. |
| Errors | Sentry | |

## Hosting — Hostinger VPS

Confirmed 2026-09-01. Postgres runs in Docker from the official image, which
ships the contrib modules — so `btree_gist` is available without building
anything. That removes the usual managed-database risk entirely.

**Two things to verify before purchase:**
- A region in India, or Singapore as the nearest fallback. Latency shows up in
  the slot grid on mobile, and Razorpay's webhooks originate in India.
- Daily snapshots available, as a second line behind our own off-box backups.

The six requirements below are recorded because they are why a VPS was chosen
over managed hosting, and they apply again if the provider is ever changed:

1. **PostgreSQL 16+ with the `btree_gist` extension.** Non-negotiable — R2 does
   not work without it. Rules out most shared hosting and any MySQL-only plan.
2. **A long-running process**, not per-request functions. The worker runs the
   hold sweeper, the message outbox and the nightly jobs continuously.
3. **No cold start on inbound requests.** A Razorpay webhook that times out is a
   customer who paid and lost their slot (R3).
4. **Root or Docker access**, so the app, worker, Postgres and Caddy run together.
5. **Off-box backup storage** reachable from the box — Cloudflare R2 or
   Backblaze. A backup on the same disk is not a backup.
6. **A region close to India.** Latency matters for the slot grid on mobile, and
   Razorpay's webhooks originate in India. Pick the India or Singapore region if
   the provider offers one — verify before purchase.

**Minimum sizing:** 2 vCPU / 8 GB / 100 GB NVMe for one venue, comfortably.
4 vCPU / 16 GB if the same box is expected to host anything else.

**Alternative if the VPS route is dropped:** Vercel + managed Postgres (Neon,
ap-south). No server to maintain, but cron granularity is one minute rather than
seconds, and the worker needs a separate always-on host. Acceptable, because
correctness comes from the `23P01` retry in `05-booking-engine.md`, not from the
sweeper's schedule.

## shadcn/ui notes

- Components are **copied into `components/ui/`**, not installed. We own them and
  edit them freely; there is no upstream version to fight.
- Most shadcn components are client components (`"use client"`). Keep data
  fetching in server components and pass results down — availability logic must
  never move to the browser (R1).
- Components the admin console will lean on: `table`, `dialog`, `form`,
  `select`, `popover`, `calendar`, `tabs`, `badge`, `toast`.
- The day grid and month calendar are **custom** — shadcn's `calendar` is a date
  picker, not a booking sheet. Do not try to bend it into one.

## Repository layout

```
db/
  migrations/          0001_foundation.sql, 0002_bookings.sql, ...
  seed/                channels, a demo court, price rules
packages/
  core/                PURE TypeScript. No React, no Next, no db driver.
    time/              IST, business date, cross-midnight
    pricing/           rule resolution
    availability/      the slot engine  <- R1 lives here
    booking/           state machine, write-path guards
    money/             paise formatting and arithmetic
  db/                  repositories, one file per aggregate
apps/
  web/
    src/app/(site)/    public marketing + booking
    src/app/(admin)/   admin console
    src/app/api/v1/    partner API
    src/app/api/webhooks/razorpay/
  worker/              sweeper, outbox drain, nightly jobs
```

**`packages/core` MUST NOT import** Next.js, React, or a database driver. It
takes data in and returns decisions. That boundary is what lets every surface
share one answer to "what is free". If the core test suite is green, the booking
logic is correct.

## Conventions

- **Money**: `integer` paise, column suffix `_paise`. Format with
  `formatPaise()` at the UI edge only.
- **Time**: `timestamptz` in, `Asia/Kolkata` out. Minutes-from-midnight
  (`open_minutes`, `close_minutes`) for opening hours; values > 1440 mean past
  midnight.
- **Naming**: `snake_case` in SQL, `camelCase` in TypeScript, repositories map
  between them explicitly.
- **Errors**: an API failure is `{ "error": { "code": "...", "message": "..." } }`
  with a stable `code`. Match on `code`.
- **Idempotency**: any write endpoint reachable by a retry takes an idempotency
  key and is unique-indexed on it.
- **Tests**: unit tests in `packages/core` need no database. Integration tests
  run against real Postgres. The two merge gates (concurrency, permissions) run
  in CI and block merge.

## Environment variables

```
DATABASE_URL=
APP_URL=
SESSION_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
WHATSAPP_API_KEY=
SMS_API_KEY=
API_KEY_PEPPER=          # hashing pepper for partner keys, held outside the DB
SENTRY_DSN=
```

Secrets MUST be held outside the repository and outside the database.
