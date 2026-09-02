# Pavilion Club — Booking & Management System

Pickleball court booking for a single venue: a public booking website, a
front-desk admin console, and a partner API that lets outside platforms sell
Pavilion Club's courts.

**Status: planning. No application code exists yet.**

**Start at [IMPLEMENTATION.md](IMPLEMENTATION.md)** — the working checklist, with
every task linked to the spec that defines it. Specs live in `docs/system/` (what the
system does) and `docs/ui/` (how it looks and is built).

---

## Read these first, in this order

| File | Read it when |
|---|---|
| `docs/system/00-overview.md` | Always. Index and system summary. |
| `docs/system/02-rules.md` | **Always.** Six non-negotiables. Violating one is a bug even if tests pass. |
| `docs/system/04-data-model.md` | Touching the schema, migrations, or any query. |
| `docs/system/05-booking-engine.md` | Touching availability, holds, or booking creation. |

The rest of `docs/system/` is loaded on demand — each file states what it covers.

---

## The six rules (full text in `docs/system/02-rules.md`)

1. **Availability is computed in exactly one place.** One function. No caching in front of it.
2. **Double booking is prevented by the database, not the code.** A Postgres exclusion constraint.
3. **A booking is confirmed by the payment webhook, never by the browser.**
4. **Money is integer paise.** No floats, no `numeric`, no rupees in the database.
5. **Prices are snapshotted onto the booking** and recomputed server-side. Never trusted from the client.
6. **A channel is data, never a branch.** No `if (source === 'townscript')` anywhere.

---

## Conventions

- **Money**: integer paise, column suffix `_paise`. ₹1,200 is `120000`. Format only at the UI edge.
- **Time**: stored `timestamptz` (UTC), displayed `Asia/Kolkata`. Never store naive local time.
- **Business date**: computed in application code, stored on the row. A 00:30 booking belongs to
  the night that is closing. Every report keys off `business_date`, never off `created_at`.
- **IDs**: `uuid` primary keys. Bookings also carry a human `reference` like `PC-8FK2QD`.
- **Migrations**: numbered, forward-only, plain SQL in `db/migrations/`. Never edit an applied migration.
- **Errors**: every API failure returns a stable machine-readable `code`. Clients match on `code`, never on `message`.

## Things that will bite you

Each is already solved in the spec. Listed so nobody "simplifies" one away.

- **Holds are `bookings` rows**, not a separate table. It is the only way one exclusion constraint covers both.
- **An expired hold still blocks at the database level.** The constraint cannot see `expires_at`. Hence
  the sweeper *and* the retry on `23P01` that expires the blocking row first.
- **Overlapping bookings of different lengths deadlock** (`40P01`), not just conflict. Treat a deadlock as contention: backoff and retry.
- **`AT TIME ZONE` is STABLE, not IMMUTABLE**, so Postgres rejects it in a generated column. That is why `business_date` is written by the application.
- **Partner bookings have no payment row until settled.** `collected` = sum of payments. Always.

## Never do this

- Take a price, an amount, or a court's rate from the request body.
- Confirm a booking from a browser redirect or a client-side callback.
- Add a table or code path that also answers "is this slot free".
- Add a per-partner `if` branch. Add a `channels` row instead.
- Pre-fill a cash-declaration field with the expected amount.

---

## Frontend

UI, UX and frontend architecture live in `docs/ui/`, not `docs/system/`.

| File | Read it when |
|---|---|
| `docs/ui/00-overview.md` | Starting any UI work |
| `docs/ui/01-principles.md` | Always, for UI work. Six rules with checkable consequences |
| `docs/ui/03-patterns.md` | Building any screen — shell, table, slot grid, panel, forms |
| `docs/ui/07-architecture.md` | Server/client split, data fetching, server actions, URL state |

`docs/system/` says **what** a screen does. `docs/ui/` says **how it looks and how it
is built.** On behaviour, `docs/system/` wins. On presentation, `docs/ui/` wins.

Two frontend rules that are really backend rules:
- Availability is computed in a **server component**. The browser never receives
  raw bookings and works out what is free.
- Every **server action** calls `requirePermission()` itself. A page-level check
  does not protect an action — it is an HTTP endpoint.
