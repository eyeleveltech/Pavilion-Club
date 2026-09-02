---
id: 06-admin-console
title: Admin console
status: draft
audience: ai-agent, client
depends_on: [04-data-model, 05-booking-engine, 11-roles-permissions]
---

# 06 — Admin console

Routes live under `apps/web/src/app/(admin)/`. Nav order below is the client's
own stated order and reflects how the day actually runs. **Do not reorder it.**

| Order | Nav label | Route | Permission |
|---|---|---|---|
| 1 | Dashboard | `/admin` | `reports:read` |
| 2 | Book a slot | `/admin/book` | `booking:write` |
| 3 | Calendar | `/admin/calendar` | `booking:read` |
| 4 | Reports | `/admin/reports` | `reports:read` |
| 5 | Daily close | `/admin/close` | `reports:read` |
| 6 | Cash | `/admin/cash` | `booking:write` |
| 7 | Settings | `/admin/settings/*` | varies |

---

## 1. Dashboard — `/admin`

What the owner sees on opening the laptop. **Every tile needs an exact
definition**, because "revenue" means three different things here and confusing
them is how reconciliation breaks.

| Tile | Exact definition |
|---|---|
| **Bookings today** | `COUNT(*)` of bookings with `business_date = today` AND `status IN ('confirmed','completed','no_show')`. **Not** bookings created today. |
| **Collected today** | `SUM(payments.amount_paise) WHERE received_on = today` (gateway payments use the capture date). Money that actually moved, whatever day the game is. |
| **Booked value today** | `SUM(bookings.amount_paise) WHERE business_date = today AND status IN ('confirmed','completed','no_show')`. Includes partner bookings not yet paid to us. |
| **Online vs offline** | Grouped by `channels.is_online`. Online = website + partners. Offline = walk-in + phone. Shown as count **and** value. |
| **Next 7 days** | For each of the next 7 business dates: slots taken, slots free, percent filled. Rendered as a small bar per day, each clickable through to that day's grid. |
| **Still owing** | Confirmed bookings for today whose paid total is less than `amount_paise`, excluding channels with `settles_later = true`. The one number the desk can act on before the customer walks off. |
| **Partner outstanding** | `SUM(amount_paise - commission)` for bookings on `settles_later` channels with `settlement_id IS NULL` or a settlement not yet `settled`. Broken down per partner. |

Capacity for the fill percentage:
`slots_available = SUM over courts of ((close_minutes - open_minutes) / slot_minutes)`,
minus blackout slots. Never hardcode it.

```
ACCEPTANCE
- "Collected today" equals the sum of the payments list on /admin/close for the same date
- a partner booking increases "Booked value" and "Partner outstanding", and does NOT
  increase "Collected today"
- the 7-day strip totals match the day grid for each of those days
```

---

## 2. Book a slot — `/admin/book`

The walk-in screen. Someone is standing at the counter; this screen must be
usable while talking to them. Target: **under 20 seconds** for a repeat customer.

**Flow**

1. Date defaults to today. Court and time picked from a grid of what is free —
   the same `computeAvailability()`, no shortcut query.
2. Phone number first, then name. If the phone matches an existing customer the
   name fills itself and shows their booking count.
3. Price displayed from the resolved rule. An override field is available with
   `pricing:override`; it **requires a reason** and writes an `audit_log` row.
4. Payment mode: **Cash** or **Card**. Nothing else — this is the client's
   explicit instruction. Card means their own machine; we record the mode, we
   do not process the card.
5. One primary button: **Payment received — block slot**.

**On submit**, in a single transaction:

- insert the `bookings` row with `channel_id` = `walkin` (or `phone`),
  `status = 'confirmed'`, `confirmed_at = now()`;
- insert a `payments` row with the method, `received_by` = the logged-in user,
  `received_on` = today's business date;
- queue the WhatsApp confirmation.

**MUST**: a booking taken at the counter writes a `payments` row. A booking with
no payment row has not been paid.

> In the neighbouring Turf OS build, "cash at venue" was an intention written on
> the booking and never a receipt. Three separate screens then reported money as
> collected that nobody had handed over. Do not repeat this.

**MUST NOT**: read the price from any form field. Recompute server-side (R5).

Secondary actions on the same screen: **Block without payment** (for a booking
being paid later — creates the booking with no payment row, and it appears in
"Still owing") and **Blackout this slot** (maintenance, not a booking).

```
ACCEPTANCE
- submitting a tampered amount_paise in the request body stores the resolved price
- an override with no reason is rejected
- a cash booking appears in "Collected today" and in the cash handover for
  the user who took it, not the user who created the booking earlier
```

---

## 3. Calendar — `/admin/calendar`

### Month view — `/admin/calendar?month=YYYY-MM`

A full calendar month. Each date cell shows:

- the booking count, e.g. **"10 bookings"** (the client's own words);
- a fill indicator (percent of capacity);
- nothing else. This view exists to be scanned.

Clicking a date opens the day view.

### Day view — `/admin/calendar/[date]`

Courts across the top, time down the side. One column per court.

Each booked cell shows:

- customer name and phone;
- amount, and whether it is **paid** or **unpaid** (rendered differently, so the
  desk can see at a glance who still owes);
- **where the booking came from** — the `channels.name`, in `channels.colour_hex`.
  Website, walk-in, phone, or the partner by name. This is the client's explicit
  requirement: *"in that slot, you show whether it is online booking, offline
  booking."*

A legend maps colour to channel. Free slots are clickable and open
`/admin/book` pre-filled with that court and time.

Clicking a booked slot opens a panel: customer details, payment history,
**reschedule**, **cancel** (showing the refund quote before confirming),
**mark no-show**, **take payment** if unpaid.

#### Cancelling a partner booking from the desk

A Turf Town customer standing at the counter asking to cancel is a trap. If the
desk cancels it here, the court frees but **no refund is issued** — Turf Town
holds the money, and the customer leaves believing they have been refunded.

So the cancel action on a partner booking MUST warn before proceeding:

> **This was booked through Turf Town.**
> Cancelling here frees the court but does **not** refund the customer. They must
> cancel in the Turf Town app to get their money back.
> Cancel anyway? *(reason required)*

Legitimate reasons to proceed: rain, maintenance, a double-booked event — a
venue-side cancellation. In those cases the `booking.cancelled` webhook tells
Turf Town so they can refund their customer, and the booking drops off the
month's invoice.

The desk's correct answer to a customer wanting to cancel is: **"cancel it in
the Turf Town app."** Put that line on the panel.

**MUST NOT** nest `<form>` elements for the no-show and cancel buttons — the
browser discards the inner one and the click submits the wrong action. This
exact bug shipped in Turf OS.

```
ACCEPTANCE
- month cell counts equal the day view booking counts for that date
- a partner booking renders in the partner's colour with the partner's name
- cancel shows the refund amount before it is confirmed, and writes an audit row
```

---

## 3b. Find a booking — `/admin/search`

Always reachable from the header, because the commonest question at the counter
is "I booked, can you find me?"

Searches, in one box:

- our reference (`PC-8FK2QD`)
- **the partner's reference** (`TT-99182`) — a Turf Town customer quotes theirs,
  not ours
- customer phone, full or last four digits
- customer name, partial

Results show court, date, time, channel, amount, and paid status, ordered with
today first. Clicking one opens the same slot panel as the calendar.

`MUST` support the partner reference. Without it, a marketplace customer holding
only their own booking code cannot be found at all.

## 3c. Bookings that arrive without contact details

A partner may send us a booking with no name or phone (`15-open-questions.md`
Q4). `bookings.customer_id` is nullable for exactly this.

- The day grid renders the cell as **"Turf Town · TT-99182"** instead of a name.
  It MUST NOT render blank or "Unknown".
- The slot panel offers **Add contact details** — the desk types the phone and
  name when the customer arrives, and the booking is linked to a customer record
  (created if new).
- This is worth doing for its own sake: a marketplace customer captured at the
  gate can be sent a WhatsApp confirmation next time and book direct, with no
  commission on that booking.

## 4. Reports — `/admin/reports`

Full specification in `10-reports-export.md`. Tabs: **Source-wise**,
**Occupancy**, **Settlements**.

## 5. Daily close — `/admin/close?date=`

The 11:30pm screen. Keyed off `business_date`, so a 00:30 booking counts against
the night that is closing.

- bookings and value for the day, by court;
- collected, split by method (gateway / cash / card);
- expected cash in the till;
- still owing, listed by booking so the desk can chase.

## 6. Cash — `/admin/cash`

End-of-shift handover. Shows what the system expects from that shift, then asks
the staff member to declare what is actually in the till.

**The declared field MUST start empty.** Pre-filling it with the expected amount
makes every reconciliation come out clean and worthless. Variance is computed
and stored, and a non-zero variance requires a note.

## 7. Settings

| Route | Contains | Permission |
|---|---|---|
| `/admin/settings/courts` | Courts, opening hours per weekday, slot length, disable a court — detailed below | `pricing:write` |
| `/admin/settings/pricing` | Price rules with a live preview of what a given day resolves to | `pricing:write` |
| `/admin/settings/blackouts` | Maintenance and private events | `booking:write` |
| `/admin/settings/staff` | Users and roles. Removal is **confirmed** and reversible (deactivate, not delete) | `staff:manage` |
| `/admin/settings/partners` | Add a partner channel, issue and revoke API keys, set commission, see last call and today's request count | `partner:manage` |
| `/admin/settings/partners/[id]` | One partner. Three sections — see below | `partner:manage` |
| `/admin/settings/venue` | Name, timezone, business day start, hold TTL, booking window, cancellation policy | `settings:write` |

Issuing an API key shows the full key **once**, then only the prefix. It is
stored hashed.

### Courts and hours — `/admin/settings/courts`

Pavilion Club has **3 courts**. Nothing about them is in code: count, names,
slot length and opening hours are all rows, editable by the owner.

**The governing rule for this whole screen:**

> The grid is generated from settings. **Bookings are facts.** A settings change
> must never hide, move, or invalidate an existing booking.

Shorten Saturday's closing time from 23:00 to 22:00 and an existing 22:30 booking
still renders on the day grid, still appears in reports, and still lets the
customer in. The engine stops *generating* new slots there; it does not erase
what was already sold. This is the single easiest thing to get wrong here.

#### Per court

```
Court 1                                    [ Active ▾ ]
Slot length   [ 60 min ▾ ]

  Mon   06:00 – 23:00
  Tue   06:00 – 23:00
  Wed   06:00 – 23:00
  Thu   06:00 – 23:00
  Fri   06:00 – 23:00
  Sat   06:00 – 00:00        ← past midnight, stored as close = 1440
  Sun   06:00 – 00:00

  [ Copy Monday to all weekdays ]   [ Copy this court to all courts ]
  Closed on a day: clear both times
```

A day may have **more than one opening period** — a venue that shuts midday for
cleaning or heat is `06:00–11:00` and `16:00–23:00`. Show one period per day by
default with a small **+ add a second period** link; most venues never touch it,
and it should not clutter the screen for those who don't.

**Bulk actions are not a nicety.** Three courts across seven days is 21 rows.
Without "copy to all weekdays" and "copy to all courts", setup is twenty minutes
of typing and every future change is error-prone.

#### Before saving, show the consequences

```
17 slots per day per court · 51 slots per day across 3 courts

⚠ 2 existing bookings now fall outside opening hours:
   Sat 6 Sep 22:30 Court 2 — Rahul (PC-8FK2QD)
   Sat 13 Sep 22:30 Court 2 — Priya (PC-4MN7XR)
   These bookings are unaffected and will still be honoured.
```

Warn, never block. The owner may be shortening hours *because* of those bookings.

#### Court states — three different things, do not conflate

| State | Means | Use for |
|---|---|---|
| **Active** | Bookable normally | The default |
| **Inactive** (`is_bookable = false`) | Generates no new slots, indefinitely | A court out of action, being resurfaced, or not yet built |
| **Blackout** (a `blackouts` row) | Closed for a specific date range | Maintenance, a private event, a tournament, a public holiday |

Making a court inactive or adding a blackout over **existing bookings** MUST list
them and require confirmation, then cancel them with the correct refund and an
audit row. Silently burying paid bookings is the exact defect QA found in the
neighbouring Turf OS build.

#### Blackouts — `/admin/settings/blackouts`

Date range, time range, reason, and a **"all courts"** checkbox that writes one
row per court. Closing the whole venue for Pongal should be one action, not
three.

### Partner detail — `/admin/settings/partners/[id]`

Three sections. The commission block is the one the owner will actually use.

**Connection**
Display name, colour on the calendar, active toggle. API key prefix with
**Reissue** and **Revoke**. Last call, requests today against the limit.

**Their commission** — one optional field.

```
Commission they deduct   [ 15 ] %      (leave blank if you don't know)

A ₹1,200 booking → they keep ₹180 → you receive ₹1,020
```

That is the entire commission UI. We do not model how Turf Town calculates their
cut — no tiers, no caps, no per-slot rates. The number exists only so the
settlement screen can show an expected figure to check their payment against.
Blank means the settlement shows gross, which is still a complete invoice.

**Money**
Outstanding balance, last settlement with its date and amount, and a link to
`/admin/reports/settlements`.

`MUST` show, on each settled settlement, **what we expected against what they
actually paid, with the variance**. Spotting an underpayment is the whole reason
this section exists.
