---
id: fe-03-patterns
title: Layout and component patterns
status: draft
audience: ai-agent
---

# Patterns

Build these once. Every screen composes them. A screen that invents its own
table style or its own header is a review rejection.

## The admin shell

```
┌────────────┬──────────────────────────────────────────────────┐
│ PAVILION   │  [ / Search reference, phone, name…        ]  SM │
│            ├──────────────────────────────────────────────────┤
│ ▸ Now      │                                                  │
│   Dashboard│   Page title                      [Primary action]│
│   Book     │   Sub-line: context, date, filters               │
│   Calendar │  ┌────────────────────────────────────────────┐  │
│   Search   │  │                                            │  │
│            │  │              page content                  │  │
│ MONEY      │  │                                            │  │
│   Reports  │  └────────────────────────────────────────────┘  │
│   Close    │                                                  │
│   Cash     │                                                  │
│            │                                                  │
│ SETUP      │                                                  │
│   Settings │                                                  │
└────────────┴──────────────────────────────────────────────────┘
```

- Sidebar 200px, fixed, grouped with small uppercase labels (`OPS`, `MONEY`,
  `SETUP`). Collapses to icons below 1024px, to a drawer below 768px.
- **Search is always in the header.** `/` focuses it from anywhere.
- Nav items the role cannot access are **hidden, not disabled** — a desk user
  should not see doors they cannot open.
- Landing page depends on role: **desk → Now**, manager and owner → Dashboard.

## Page header

Every page. One pattern.

```
Day view                                        [ + Book a slot ]
Saturday 6 September · 3 courts · 41 of 54 booked
```

Title, a factual sub-line, and at most one primary action. Filters sit under the
header and are reflected in the URL (`07-architecture.md`).

## Data table

One style everywhere: bookings, reports, customers, settlements.

- Header: `--surface-2`, 11px uppercase label type, sticky on scroll.
- Rows 40px. Compact — this is a tool (P3).
- Money and time columns right-aligned, tabular figures.
- Whole row clickable where a detail view exists; cursor and hover fill.
- Sort on the columns that matter, encoded in the URL.
- Wide tables scroll **inside their own container**. The page never scrolls
  sideways.
- Never paginate below 200 rows; scroll instead. Staff scan, they do not page.

## Stat tile

Dashboard only.

```
┌─────────────────────┐
│ COLLECTED TODAY     │   ← 11px uppercase label
│ ₹18,400             │   ← 28px tabular
│ 14 payments      →  │   ← 12px, --ink-soft, whole tile clickable
└─────────────────────┘
```

Every tile links somewhere. A number the owner cannot click into is a dead end
(P2).

## The slot grid — the hardest component

Courts across, hours down. Custom built.

```
        Court 1            Court 2            Court 3
06:00   ·                  ·                  ·
…
18:00   ▨ Kumar      ₹1200 ·                  ▨ Anita      ₹1200
19:00   ▨ Rahul      ₹1200 ▨ TURF TOWN        ▨ Priya      ₹1200
        ─────────────────────── now ───────────────────────────
20:00   ▤ Suresh   unpaid  ·                  ▨ Deepa      ₹1200
21:00   ·                  ▨ Meera      ₹1200 ·
22:00   ·                  ·                  ▒ maintenance
23:00   ·                  ·                  ·
```

Cell rules:

| | |
|---|---|
| **Free** | `--surface`, hairline border, hover shows `+ Book`, click opens Book a slot pre-filled |
| **Booked** | Channel hue, solid if paid, outlined if unpaid (`02-design-system.md`) |
| **Held** | Dashed, muted, with the remaining minutes |
| **Blackout** | Hatched `--surface-2`, reason on hover |
| **Past** | 45% opacity, not clickable |
| **Now** | A 2px `--brand` line across all courts at the current time |

- A multi-hour booking is **one cell spanning its rows**, not repeated per hour.
- Time labels are sticky on the left; court headers sticky on top.
- Minimum cell height 44px — it is a touch target on a tablet.
- Legend sits under the grid, mapping hue to channel.
- Below 1024px this becomes a list. See `05-responsive.md`.

## Month calendar

Also custom. Deliberately sparse — it exists to be scanned (P3).

```
  Mon      Tue      Wed      Thu      Fri      Sat      Sun
   1        2        3        4        5        6        7
   8 bkgs   11       9        14       22       41 ███   38 ███
   ▁▁       ▂▂       ▁▁       ▃▃       ▅▅       ███      ███
```

Each cell: the date, `N bookings`, and a fill bar. Nothing else. Click opens the
day view. Today outlined in `--brand`.

## Detail panel

A `sheet` sliding from the right — **not** a modal dialog. Staff need to see the
grid behind it while talking to a customer.

Contains: customer, channel, amount and payment state, actions, and the activity
log (who did what, when). Closes on `Esc`.

## Forms

- `react-hook-form` + `zod`, one schema shared with the server action.
- Labels above inputs, always. No placeholder-as-label.
- Errors under the field, in `--danger`, stating the fix.
- One primary button, bottom right. Secondary actions are text buttons.
- Destructive actions are separated from the primary flow, and confirm through
  `alert-dialog` stating the consequence (P6).
- Money inputs take rupees, convert to paise at the boundary, and never accept
  more than two decimal places.

## Empty and loading

Specified in `04-states.md`. Every one of the above must define both.
