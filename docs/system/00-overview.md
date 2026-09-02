---
id: 00-overview
title: Overview and index
status: draft
audience: ai-agent, developer, client
---

# 00 — Overview

## What this system is

A single-venue booking and management system for **Pavilion Club**, a pickleball
facility. One codebase, three surfaces, one shared answer to "is that court free
at that time".

| Surface | Users | Spec |
|---|---|---|
| Public website | Customers booking online | `07-public-site.md` |
| Admin console | Owner, manager, front desk | `06-admin-console.md` |
| Partner API | Outside booking platforms | `08-partner-api.md` |

All three read availability from the same function and write into the same
`bookings` table. There is no second copy of the schedule anywhere.

## The core domain object

A **booking** is one court, held for one continuous time range, by one customer,
arriving through one channel, in one of five states.

```
held ──pay/confirm──> confirmed ──day passes──> completed
 │                        │                          │
 └──expiry──> cancelled <─┴──cancel──┘        no_show ┘
```

`held` and `confirmed` block the slot. Nothing else does.

## Document index

| File | Covers |
|---|---|
| `00-overview.md` | This file. Index and system summary. |
| `01-decisions.md` | Decisions that are locked, and what would reopen them. |
| `02-rules.md` | The six engineering non-negotiables. **Read always.** |
| `03-stack.md` | Technology, repository layout, coding conventions. |
| `04-data-model.md` | Complete schema with DDL, enums, constraints, indexes. |
| `05-booking-engine.md` | Availability, pricing resolution, holds, concurrency. |
| `06-admin-console.md` | Every admin screen, route, and metric definition. |
| `07-public-site.md` | Public pages, booking flow, online payment path. |
| `08-partner-api.md` | REST API spec, auth, scopes, error codes, webhooks. |
| `09-money-settlement.md` | Payment methods, refunds, partner settlement lifecycle. |
| `10-reports-export.md` | Report definitions with SQL, Excel export column spec. |
| `11-roles-permissions.md` | Roles, permission strings, the matrix, audit rules. |
| `12-notifications.md` | Outbox pattern, WhatsApp/SMS templates, OTP. |
| `13-ops-security.md` | Hosting, backups, monitoring, security requirements. |
| `14-build-phases.md` | Phased task breakdown with acceptance gates. |
| `15-open-questions.md` | Unanswered questions, with the default assumed until answered. |
| `glossary.md` | Domain vocabulary. |

UI, UX and frontend architecture are a separate plan in `../ui/`.

## Scope

**In scope (Phase 1):** dashboard, walk-in booking, calendar, online booking and
payment, partner API, source-wise reporting with Excel export, settlement
tracking, roles, notifications.

**Out of scope (Phase 2 or later):** membership, coaching and academies,
tournaments, prepaid packs and wallets, a mobile app, multi-venue. See
`14-build-phases.md` §Out of scope.

## Reading this as an AI agent

- Every rule uses **MUST / MUST NOT / SHOULD / MAY** in the RFC 2119 sense.
- Blocks marked `ACCEPTANCE` are testable criteria. Implement them as automated tests.
- Blocks marked `OPEN` depend on an unanswered question in `15-open-questions.md`.
  Implement the stated default; do not invent a different one silently.
- SQL and TypeScript in these documents is the specification, not illustration.
  Deviating from it needs a note in the PR explaining why.
