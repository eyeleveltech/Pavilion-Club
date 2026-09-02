---
id: fe-00-overview
title: Frontend plan — overview
status: draft
audience: ai-agent, designer, developer
---

# Frontend — overview

The system plan in `../system/` says **what** each screen must do. This plan says
**how it looks, how it behaves, and how it is built.**

Where the two disagree on behaviour, `../system/` wins — it carries the client's
requirements and the money rules. Where they disagree on presentation, this one
wins.

## Two products, opposite goals

| | Admin console | Public site |
|---|---|---|
| Who | Desk staff, manager, owner | Customers |
| When | Eight hours a day, standing at a counter | Once, on a phone, deciding |
| Goal | **Speed and certainty** | **Confidence and calm** |
| Density | High. It is a tool | Low. Few decisions per screen |
| Design first for | Desktop, then tablet | Mobile, then desktop |

Treating these as one design language produces a beautiful admin console nobody
can work fast in, or a public site that looks like a spreadsheet. Two stances,
one component library.

## Files

| File | Covers |
|---|---|
| `00-overview.md` | This file |
| `01-principles.md` | The design stance, and the rules that follow from it |
| `02-design-system.md` | Tokens, type, colour semantics, channel colours |
| `03-patterns.md` | Shell, page header, data table, **slot grid**, panel, forms |
| `04-states.md` | Empty, loading, error, no-results, denied — the forgotten half |
| `05-responsive.md` | Breakpoints, and what the day grid becomes on a phone |
| `06-screens.md` | Wireframes, screen by screen |
| `07-architecture.md` | Folder structure, server/client split, data, forms, URL state |
| `08-copy-a11y.md` | Words and accessibility |
| `09-state.md` | Where every kind of state lives, and when a store would be justified |
| `10-build-guide.md` | **The brand, and the whole frontend step by step.** Start here |

## Stack, as it affects the frontend

- **Next.js 15 App Router.** Server Components by default.
- **Tailwind + shadcn/ui.** Components are copied into the repo — we own and edit
  them. There is no upstream version to fight.
- **No client state library** — because nothing in this product needs one, not
  as a principle. The reasoning and the trigger for adding Zustand are in
  `09-state.md`.
- **Brand received 2026-09-02.** MidnightBlue and gold, Montserrat, the Pavilion
  Club wordmark and monogram. Real tokens and every screen's build order are in
  `10-build-guide.md`.

## The one hard constraint the frontend must respect

**Availability is computed on the server. Always.** (`../system/02-rules.md` R1.)

The browser never receives raw bookings and works out what is free. It receives
a computed slot list. A "clever" client-side availability calculation is the one
change that would break the double-booking guarantee, and it would look like a
performance improvement while doing it.
