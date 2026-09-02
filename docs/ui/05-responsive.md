---
id: fe-05-responsive
title: Responsive and mobile
status: draft
audience: ai-agent, designer
---

# Responsive — mobile is an app, not a smaller desktop

Two products, two directions. The admin console is **desktop-first** — it lives
on a counter machine. The public site is **mobile-first** — nearly every booking
will be made on a phone.

But below `md`, both stop being "the website, narrower". They become **an app**:
bottom navigation, full-screen steps, sticky actions, no hover, and installable
to the home screen.

## Breakpoints

```
sm    640    phone
md    768    large phone / small tablet    ← app layout below this
lg   1024    tablet landscape / laptop
xl   1280    counter machine — the admin's design target
```

---

## Admin on a phone

### Bottom tab bar, not a drawer

A hamburger drawer is a website. A bottom bar is an app — and it is reachable
with a thumb, which a top-left menu button is not.

```
┌──────────────────────────────────┐
│  Now                        🔍   │  ← 52px bar, title + search
├──────────────────────────────────┤
│                                  │
│   ON COURT NOW                   │
│   ┌────────────────────────────┐ │
│   │ Court 1    7–8pm           │ │
│   │ Rahul      ₹1,200   PAID   │ │
│   └────────────────────────────┘ │
│   ┌────────────────────────────┐ │
│   │ Court 3    7–8pm           │ │
│   │ Priya      ₹1,200  UNPAID  │ │  ← tap to take payment
│   └────────────────────────────┘ │
│                                  │
│   NEXT UP · 8:00 pm              │
│   ...                            │
│                                  │
├──────────────────────────────────┤
│   ●        ▦        +       ⋯    │  ← 56px + safe area
│  Now   Calendar   Book    More   │
└──────────────────────────────────┘
```

**Four tabs, no more.** `Now · Calendar · Book · More`.
Everything else — reports, close, cash, settings, customers — lives under
**More** as a plain list. Owners use those at a laptop anyway.

- **Book** is centred and visually distinct. It is the action, not a destination.
- The current tab is filled; the rest are outlined. Label always visible — icon-only
  navigation fails staff turnover (`01-principles.md` anti-goals).
- The tab bar is fixed, and sits above `env(safe-area-inset-bottom)`.

### Rows, not tables

Every admin table becomes stacked cards below `md`. Never a horizontally
scrolling table on a phone — it is the clearest sign a page was not designed for
the device.

```
  ┌────────────────────────────────┐
  │ PC-8FK2QD          Sat 6 Sep   │
  │ Court 2 · 7:00–8:00 pm         │
  │ Rahul Kumar                    │
  │ ₹1,200                 UNPAID  │
  └────────────────────────────────┘
```

### Detail opens from the bottom

On desktop the booking panel slides from the right. On a phone it is a **bottom
sheet** — the native pattern, thumb-reachable, dismissed by swiping down.

Two heights: half-height by default, drag up for full. `Esc`, backdrop tap, and
swipe-down all close it.

### The day grid becomes a list

A courts × time grid needs roughly 700px before it stops being readable.
Below `lg` it becomes a list grouped by hour:

```
  ── 19:00 ──────────────────── now ──
   Court 1   Rahul        ₹1,200  PAID
   Court 2   Turf Town    TT-99182   —
   Court 3   Priya        ₹1,200  UNPAID

  ── 20:00 ───────────────────────────
   Court 1   Suresh       ₹1,200  UNPAID
   Court 2   free                + Book
   Court 3   Deepa        ₹1,200  PAID
```

Same information, same colours, same actions, every row a comfortable tap
target. Opens scrolled to the current hour, not to 06:00.

---

## Public site on a phone

Not tabbed — it is one linear flow. **One decision per screen, full height, one
action at the bottom.**

```
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│  ‹   Choose a date               │   │  ‹   Sat 6 September             │
├──────────────────────────────────┤   ├──────────────────────────────────┤
│                                  │   │  MORNING                         │
│   ‹    September 2026    ›       │   │  ┌────────────────────────────┐  │
│                                  │   │  │ 06:00 – 07:00      ₹800    │  │
│   M   T   W   T   F   S   S      │   │  │ 3 courts free              │  │
│                   1   2   3      │   │  └────────────────────────────┘  │
│   4   5   6   7   8   9  10      │   │  ┌────────────────────────────┐  │
│   ●   ●   ●   ◐   ●   ✕   ●      │   │  │ 07:00 – 08:00      ₹800    │  │
│                                  │   │  │ 3 courts free              │  │
│  11  12  13  14  15  16  17      │   │  └────────────────────────────┘  │
│                                  │   │  ...                             │
│                                  │   ├──────────────────────────────────┤
│                                  │   │ 19:00–21:00 · 2 hrs    ₹2,400    │
│                                  │   │ [       Continue  →       ]      │
└──────────────────────────────────┘   └──────────────────────────────────┘
                                          ↑ sticky, above safe area
```

- Each hour row is a **56px card**, not a table row.
- The summary bar appears the moment something is selected and never leaves.
- Back is in the header — and the browser back button does the same thing,
  because each step is a URL (`09-state.md`).

---

## The details that make it feel native

Small, easy to skip, and collectively the whole difference.

| | Why |
|---|---|
| **`font-size: 16px` on every input** | Anything smaller makes iOS Safari zoom in on focus. The single most common "this feels like a website" bug |
| **`100dvh`, never `100vh`** | Mobile browser chrome resizes the viewport; `vh` puts your bottom bar under it |
| **`env(safe-area-inset-bottom)`** | Otherwise the tab bar sits under the iPhone home indicator |
| **`-webkit-tap-highlight-color: transparent`** | Kills the grey flash on tap; use a real `:active` state instead |
| **`:active` states, not `:hover`** | Hover sticks after a tap on touch devices and looks broken |
| **`overscroll-behavior: contain` on sheets** | Stops the page behind scrolling when the sheet hits its end |
| **44px minimum, 56px for primary rows** | Thumbs, not cursors |
| **`inputmode="numeric"` on phone fields** | Number pad, not a full keyboard |
| **`autocomplete="tel"`** | One-tap fill of their own number |
| **No layout shift on keyboard open** | Sticky bars use `position: fixed`, not `sticky`, on mobile |

---

## Installable — the thing that actually makes it an app

A `manifest.json` and icons, nothing more:

```json
{
  "name": "Pavilion Club",
  "short_name": "Pavilion",
  "start_url": "/admin",
  "display": "standalone",
  "background_color": "#F7F8F6",
  "theme_color": "#0D5F52",
  "icons": [ /* 192, 512, maskable */ ]
}
```

Staff **Add to Home Screen** on the counter tablet. It then opens full screen
with no browser bar, its own icon, and its own app switcher entry. For a few
hours of work it is indistinguishable from an installed app for the way it is
used.

**Deliberately NOT doing:** offline booking. A service worker that queues
bookings while the internet is down means two devices can accept the same slot,
and reconciling that is exactly the problem the whole system exists to prevent
(`../system/02-rules.md` R2). Cache the shell and static assets if useful; never
cache availability, and never queue a write.

---

## Tablet — the counter's real device

768–1023px is likely where the desk actually works. It gets the phone's bottom
tab bar but with **two columns**: the day list on the left, the selected booking
open beside it rather than in a sheet. Fewer taps for the person using it all
evening.

---

## Rules at every size

- Wide content scrolls **inside its own container**. The page body never scrolls
  sideways, at any width.
- Tabular figures on money and time columns, always.
- **Test at 360px** — the common cheap-Android width in India, and narrower than
  most laptops make you think.
- **Test with everything full and names long.** Empty states always look fine;
  three booked courts with long names is where layouts break.
- Test with the on-screen keyboard open. It halves the visible height.

```
ACCEPTANCE
- no horizontally scrolling table on any screen below md
- focusing any input on iOS Safari does not zoom the page
- the bottom tab bar clears the home indicator on a notched iPhone
- the app installs to the home screen and opens without browser chrome
- no service worker caches availability or queues a booking write
- the booking flow is completable one-handed at 360px wide
```
