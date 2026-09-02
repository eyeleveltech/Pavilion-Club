---
id: fe-01-principles
title: Design principles
status: draft
audience: ai-agent, designer
---

# Design principles

Six. Each one has a consequence you can check a screen against, so they are
usable in review rather than decorative.

---

## P1 — Twenty seconds at the counter

Someone is standing there. The staff member is talking to them while typing. If
booking a returning customer takes longer than about twenty seconds, they will
stop using the system and write it in a book.

**Consequences**
- Phone number is the **first** field on the walk-in screen, and typing a known
  one fills everything else.
- Today is always the default date. Now is always the default time.
- One primary button per screen. Everything else is visually quieter.
- No confirmation dialog on the happy path. Confirm destructive things only.
- Keyboard shortcuts for the five daily actions (`06-screens.md`).

---

## P2 — Money is never ambiguous

Three different figures live on these screens: **booked value**, **collected**,
and **outstanding**. A staff member who confuses them takes the wrong action; an
owner who confuses them loses trust in every number.

**Consequences**
- Never label anything just "Revenue". Say *Collected today* or *Booked value*.
- Paid and unpaid are distinguishable **without reading** — fill versus outline.
- Amounts always carry `₹` and use tabular figures so columns align.
- Anything owed is actionable: clicking it goes to the bookings concerned.

---

## P3 — Density in the admin, calm on the public site

The admin console is a tool used for eight hours. Whitespace that looks generous
in a portfolio means scrolling for a person trying to find a 7pm booking.

**Consequences**
- Admin: compact table rows, small type for data, tight vertical rhythm.
- Admin: no hero sections, no marketing spacing, no decorative illustration.
- Public: generous spacing, larger type, one decision per screen.

---

## P4 — Colour carries one meaning at a time

The day grid must show two independent things at once: **where a booking came
from**, and **whether it is paid**. Encoding both in colour makes both unreadable.

**Consequences**
- **Hue = channel.** Website, walk-in, phone, Turf Town each own a hue.
- **Fill = payment.** Solid means paid; outlined means unpaid.
- Semantic status colours (error, warning, success) are reserved for system
  state and never reused for a channel.
- Every colour-coded thing also carries a text label. Colour is never the only
  signal — see `08-copy-a11y.md`.

---

## P5 — Never hide a fact

Settings describe the future. Bookings are facts that already happened.

**Consequences**
- Shortening opening hours still renders the booking that now falls outside them.
- A settings change that affects existing bookings **warns and lists them**; it
  never blocks and never silently drops them.
- A cancelled booking is visible as cancelled, never removed from history.
- Deleting is deactivating. Nothing disappears.

---

## P6 — Say what will happen, before it happens

The expensive mistakes here are irreversible and involve someone else's money.

**Consequences**
- Cancel shows the **refund amount** before it is confirmed.
- Cancelling a Turf Town booking warns that **no refund will be issued by us**.
- Blackout over existing bookings lists exactly which bookings will be cancelled.
- Recalculating or settling shows the row count and the money delta first.
- Every destructive confirmation states the consequence, not "Are you sure?".

---

## Anti-goals

Written down because they are what a good-looking admin panel usually gets wrong.

- **Charts for their own sake.** The owner wants numbers he can act on. Two
  sparklines maximum on the dashboard; everything else is figures and tables.
- **Dashboards that need explaining.** If a tile needs a tooltip to be
  understood, rename the tile.
- **Animation.** A loading skeleton and a toast. Nothing else moves.
- **Configurable layouts.** One good layout beats a customisable mediocre one.
- **Icon-only buttons** in the admin. Staff turnover is real; labels are cheaper
  than training.
