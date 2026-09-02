---
id: fe-06-screens
title: Screens
status: draft
audience: ai-agent, designer
---

# Screens

Wireframes. Behaviour and data definitions live in `../system/06-admin-console.md`
and `../system/07-public-site.md` — this file is layout only.

---

## Now — `/admin` for desk staff

The screen a desk person keeps open all evening. Auto-refreshes every 30s.

```
Now                                              [ + Book a slot ]
Saturday 6 September · 7:42 pm

ON COURT NOW ─────────────────────────────────────────────────────
  Court 1   7:00–8:00   Rahul        +91 98765 43210   ₹1,200  PAID
  Court 2   7:00–8:00   Turf Town    TT-99182          —
  Court 3   7:00–8:00   Priya        +91 91234 56789   ₹1,200  UNPAID ⚠

NEXT UP · 8:00 pm ────────────────────────────────────────────────
  Court 1   Kumar       +91 90000 11111               ₹1,200  PAID
  Court 2   FREE                                      [ + Book ]
  Court 3   Anita       +91 90000 22222               ₹1,200  UNPAID ⚠

LATER TODAY ──────────────────────────────────────────────────────
  9:00   2 of 3 booked          10:00  1 of 3 booked
  11:00  0 of 3 booked

TO COLLECT ───────────────────────────────────────────── ₹3,600 ──
  3 bookings today still unpaid                        [ See them ]
```

Three questions answered without scrolling: who is on court, who is coming, who
owes money.

---

## Dashboard — `/admin` for owner and manager

```
Dashboard                                     Saturday 6 September

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ BOOKINGS     │ COLLECTED    │ BOOKED VALUE │ STILL OWING  │
│ 41           │ ₹38,400      │ ₹49,200      │ ₹3,600       │
│ of 54 slots →│ 32 payments →│ incl. partner│ 3 bookings  →│
└──────────────┴──────────────┴──────────────┴──────────────┘

┌───────────────────────────┬───────────────────────────────┐
│ ONLINE vs OFFLINE         │ TURF TOWN OUTSTANDING         │
│ Online    24  ₹28,800     │ ₹12,600  ·  11 bookings       │
│ Offline   17  ₹20,400     │ Not yet invoiced           →  │
└───────────────────────────┴───────────────────────────────┘

NEXT 7 DAYS ──────────────────────────────────────────────────────
  Sun 7   ████████░░  38/54      Thu 11  ███░░░░░░░  14/51
  Mon 8   ██░░░░░░░░   8/51      Fri 12  █████░░░░░  22/51
  Tue 9   ███░░░░░░░  11/51      Sat 13  █████████░  47/54
  Wed 10  ██░░░░░░░░   9/51
```

Every tile and every bar is clickable. If `no_price` errors exist, a `--danger`
strip appears above the tiles — a customer tried to pay and was refused.

---

## Book a slot — `/admin/book`

Optimised for P1: twenty seconds.

```
Book a slot

Date  [ Sat 6 Sep ▾ ]        Court  [ Court 2 ▾ ]

  18:00  free      19:00  taken     20:00  free      21:00  free
  ▢                ▨                ▢                ▢

Phone  [ 98765 43210        ]   ✓ Rahul Kumar · 12 bookings
Name   [ Rahul Kumar        ]

Price  ₹1,200                   [ override ]

Payment   ( ) Cash    ( ) Card

              [ Payment received — block slot ]

              Block without payment · Blackout this slot
```

- Phone first. A known number fills the name and shows their history count.
- Price comes from the rules; override reveals a mandatory reason field.
- Exactly one primary button. The two secondary actions are text links.
- `Enter` submits from anywhere in the form.

---

## Calendar — month, `/admin/calendar`

```
September 2026                        [ ‹ ] [ Today ] [ › ]

  Mon      Tue      Wed      Thu      Fri      Sat      Sun
   1        2        3        4        5        6        7
   8        11       9        14       22       41       38
   ▂        ▂        ▂        ▃        ▄        █        █

   8        9        10       11       12       13       14
   7        10       12       11       19       47       41
   ▂        ▂        ▂        ▂        ▃        █        █
```

Date, booking count, fill bar. Nothing else. Today outlined in `--brand`.

## Calendar — day, `/admin/calendar/2026-09-06`

The slot grid from `03-patterns.md`. Legend beneath:

```
Website ■   Walk-in ■   Phone ■   Turf Town ■     Outlined = unpaid
```

---

## Booking panel (sheet, from the right)

```
PC-8FK2QD                                                    [ × ]
─────────────────────────────────────────────────────────────────
Court 2 · Saturday 6 September · 19:00–20:00

Rahul Kumar          +91 98765 43210
Turf Town · TT-99182                          ← channel chip

₹1,200                                        UNPAID TO US
─────────────────────────────────────────────────────────────────
[ Take payment ]  [ Reschedule ]  [ Mark no-show ]

Cancel booking

  ⚠ This was booked through Turf Town. Cancelling here frees the
    court but does NOT refund the customer. They must cancel in
    the Turf Town app.
─────────────────────────────────────────────────────────────────
ACTIVITY
  Created   6 Sep 11:04   Turf Town API
  Confirmed 6 Sep 11:04   Turf Town API
```

The activity list is `audit_log`, already written. This is what ends arguments.

---

## Search — `/admin/search`

```
[ /  Reference, phone, or name…                                 ]

  PC-8FK2QD   Sat 6 Sep 19:00   Court 2   Rahul      ₹1,200  UNPAID
  TT-99182    Sat 6 Sep 19:00   Court 2   Turf Town  ₹1,200  —
  PC-4MN7XR   Sat 13 Sep 20:00  Court 1   Rahul      ₹1,200  PAID
```

Searches our reference, **Turf Town's reference**, phone, and name. Today first.

---

## Customers — `/admin/customers`

```
Customers                                     [ Search…          ]

  Rahul Kumar     +91 98765 43210   12 bookings   ₹14,400   0 no-shows
  Priya S         +91 91234 56789    8 bookings    ₹9,600   1 no-show
  Deepa R         +91 90000 33333    3 bookings    ₹3,600   3 no-shows ⚠
```

Detail page: booking history, total spent, no-show count, notes, block/unblock.

---

## Settings → Courts

```
Courts                                          [ + Add court ]

Court 1                                            [ Active ▾ ]
Slot length [ 60 min ▾ ]

  Mon  [ 06:00 ] – [ 23:00 ]              + add a second period
  Tue  [ 06:00 ] – [ 23:00 ]
  …
  Sat  [ 06:00 ] – [ 00:00 ]
  Sun  [ 06:00 ] – [ 00:00 ]

  [ Copy Monday to all weekdays ]   [ Copy this court to all courts ]

  17 slots/day weekdays · 18 weekends · 363 slots/week across 3 courts
```

On save, if bookings now fall outside hours: list them, warn, allow (P5).

---

## Public — `/book` · date first, then time

The Google Calendar / Calendly pattern. **Pick a date, then pick an hour.**

Chosen over a courts × time grid for three reasons: it works identically on a
phone and a desktop with no alternate layout; it asks one question per screen
(P3); and it removes a decision most customers do not care about — *which* court.

### Step 1 — Choose a date

```
                      Book a court

              ‹        September 2026        ›

        Mon   Tue   Wed   Thu   Fri   Sat   Sun
                                       1     2
                                       ●     ●

          3     4     5    [6]    7     8     9
          ●     ●     ●     ◐     ●     ◐     ●

         10    11    12    13    14    15    16
          ●     ●     ●     ◐     ●     ✕     ●

        ● free    ◐ filling up    ✕ full

              Open 6:00 am – midnight
```

- **Today is the default.** Past dates are not selectable.
- Beyond the 30-day booking window: greyed, not shown as an error.
- A full day is struck through and unclickable — never let someone tap into an
  empty screen.
- Availability comes from `computeAvailabilityRange()` — **one query for the
  whole month**, not thirty (`../system/05-booking-engine.md`).

### Step 2 — Choose a time

```
  ‹ Back        Saturday 6 September              3 courts

  MORNING
    06:00 – 07:00        ₹800          3 courts free
    07:00 – 08:00        ₹800          3 courts free
    08:00 – 09:00        ₹800          1 court left
    09:00 – 10:00        —             Booked
    10:00 – 11:00        ₹800          2 courts free
    11:00 – 12:00        ₹800          3 courts free

  AFTERNOON
    12:00 – 13:00        ₹800          3 courts free
    …

  EVENING
    18:00 – 19:00        ₹1,200        2 courts free
    19:00 – 20:00        ₹1,200        1 court left      ← selected
    20:00 – 21:00        ₹1,200        1 court left      ← selected
    21:00 – 22:00        —             Booked
    22:00 – 23:00        ₹1,000        3 courts free
```

- Grouped **Morning / Afternoon / Evening**. A flat list of eighteen hours is
  hard to scan; three groups of six is not.
- Each row is the full hour range — `19:00 – 20:00`, exactly as the client asked.
  Never a bare start time.
- **"1 court left" is real scarcity, and it is true.** It is the count of free
  courts in that hour, taken from the same availability function the desk uses.
  Never inflate it.
- Booked hours stay **visible and greyed**, not removed. A gap in a list makes
  people think the page is broken.
- On first open, scroll to the **next available hour**, not to 06:00.

### Selecting more than one hour

Adjacent selections merge, and the summary states the total, not the parts.

```
    19:00 – 20:00     selected
    20:00 – 21:00     selected

      →  shown as “19:00 – 21:00 · 2 hours”
```

Non-adjacent hours cannot both be selected — tapping a distant hour replaces the
selection rather than creating two bookings. If a customer genuinely wants two
separate slots, they book twice. Keeping this rule makes the whole flow one
booking, one price, one payment.

### Which court?

**Assigned automatically.** With three identical pickleball courts, most
customers do not care, and asking costs a step.

The summary shows what they got, with a quiet way to change it:

```
  Court 2 assigned · change
```

`change` reveals only the courts free for the whole chosen range.

### Step 3 — The summary bar

Sticky at the bottom from the moment something is selected. Never scroll-to-find
on a phone.

```
 ┌────────────────────────────────────────────────────────────┐
 │  Sat 6 Sep · 19:00 – 21:00 · 2 hours                       │
 │  Court 2 assigned · change                       ₹2,400    │
 │                                          [ Continue → ]    │
 └────────────────────────────────────────────────────────────┘
```

Then phone → OTP → hold created (10-minute countdown appears) → pay, or
*"Pay ₹2,400 at the venue"* while `online_payment_mode` is `pay_at_venue`
(`../system/07-public-site.md`).

### If the slot goes while they are deciding

```
    19:00 – 20:00 was just taken.

    Still free at that time:
      20:00 – 21:00     ₹1,200        [ Select ]
      18:00 – 19:00     ₹1,200        [ Select ]
```

Never a dead end, and never an error dialog — the system is working, and the
next best option is one tap away (`04-states.md`).

### Admin keeps its grid

The desk screen stays a courts × time grid on purpose. Staff need to answer
*"7pm is full — anything on another court?"* in one glance, which a grid does and
a sequential flow does not. Different user, different need (P1 vs P3).

---

## Keyboard shortcuts (admin)

| Key | |
|---|---|
| `/` | Focus search |
| `B` | Book a slot |
| `T` | Today |
| `N` | Now board |
| `1` `2` `3` | Jump to court in the day view |
| `←` `→` | Previous / next day |
| `Esc` | Close panel |

A `?` overlay lists them. Five actions repeated hundreds of times a week is
where the counter's time actually goes (P1).
