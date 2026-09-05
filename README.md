# Pavilion Club

Booking and management system for a three-court badminton arena: a public
booking site, a front-desk admin console, and a partner API that lets Turf Town
sell the same courts without ever selling one twice.

**Status:** Phase 0 in progress. `packages/core` complete, **142 tests passing**.
Migrations written but not yet executed. No screens yet.

**New to this project? Read [HANDOVER.md](HANDOVER.md).**

---

## Start here

| | |
|---|---|
| [HANDOVER.md](HANDOVER.md) | **Start here.** Status, first hour, locked decisions, traps |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | The checklist. Every task, linked to the spec that defines it |
| [CLAUDE.md](CLAUDE.md) | Entry point for AI agents. The six rules and the conventions |
| [docs/README.md](docs/README.md) | Index of all 27 specifications |

## Getting started

```bash
pnpm install
pnpm test          # core suite — no database needed
pnpm typecheck
```

`packages/core` is pure TypeScript and runs without a database, a server or a
network. **If the core suite is green, the booking logic is correct.**

### Database

Postgres is needed only for the integration tests and the concurrency gate.

```bash
pnpm db:up         # Postgres 16 in Docker
pnpm db:migrate
pnpm db:reset      # destroy and recreate — dev only
```

Requires **PostgreSQL 16+ with `btree_gist`**. This is not negotiable: the
double-booking guarantee is an exclusion constraint, and no other mainstream
database provides one.

## Layout

```
docs/system/    what the system does — data model, engine, screens, money
docs/ui/        how it looks and is built — design, patterns, states, architecture
docs/client/    client-facing plan and the Turf Town email
db/             migrations and seed
packages/core   availability · pricing · money · time · booking state machine
packages/db     schema, repositories, the write path
apps/web        Next.js — public site, admin console, partner API
apps/worker     hold sweeper, outbox drains, nightly jobs
infra/          compose, Caddy
```

`packages/core` must never import Next.js, React, or a database driver. It takes
data in and returns decisions. That boundary is what lets the website, the desk
and Turf Town share one answer to "what is free".

## The six rules

Everything follows from these. Full text in [docs/system/02-rules.md](docs/system/02-rules.md).

1. **Availability is computed in exactly one place.** No caching in front of it.
2. **Double booking is prevented by the database, not the code.**
3. **A booking is confirmed by the payment webhook, never by the browser.**
4. **Money is integer paise.**
5. **Prices are snapshotted onto the booking**, and recomputed server-side.
6. **A channel is data, never a branch.**

## The gate

```bash
pnpm test:stress   # 100 simultaneous bookings on one slot
```

Exactly one must win. Ninety-nine get a clean "just taken". Zero errors. This
runs on every commit and blocks merge — until it is green, nothing built on top
is safe to sell.
