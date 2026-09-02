---
id: 07-public-site
title: Public site and online booking
status: draft
audience: ai-agent
depends_on: [05-booking-engine, 09-money-settlement, 12-notifications]
---

# 07 — Public site

Decision D4: the site is rebuilt with booking built in. One codebase, one
deployment, no embed widget. Routes under `apps/web/src/app/(site)/`.

## Pages

| Route | Job |
|---|---|
| `/` | What Pavilion Club is, the courts, photos, location, hours. A booking widget above the fold showing today's next free slots. |
| `/book` | The booking flow. |
| `/book/[reference]` | Confirmation. Reference, court, time, amount, what to do on arrival. Shareable, no login needed. |
| `/my-bookings` | Phone + OTP. Upcoming bookings, cancel with a refund quote shown first. |
| `/about` | The venue, the sport, facilities. |
| `/contact` | Directions, map, hours, phone. |
| `/terms`, `/privacy`, `/cancellation-policy` | Required before a payment gateway will approve the account. Contents specified below. |

## The booking flow — `/book`

```
pick date  ->  see grid of free slots + prices  ->  select one or more
consecutive slots  ->  phone + name  ->  OTP  ->  pay  ->  confirmed
```

1. **Date picker.** Limited to `booking_window_days` ahead (default 30). Past
   dates not selectable.
2. **Slot grid.** Courts across, times down. Free slots show the price. Only
   `state === 'free'` is selectable. Data comes from `computeAvailability()` —
   R1, the same function the desk and the partner API use.
3. **Selection.** Multiple slots may be selected if consecutive on one court.
   Running total shown. The whole selection becomes **one booking row**.
4. **Identify.** Phone (E.164, +91 default) and name. OTP verification —
   see `12-notifications.md`.
5. **Hold.** On continue, the server creates the hold. The slot is now blocked
   for `hold_ttl_minutes` (default 10). A visible countdown tells the customer.
6. **Pay.** See below.
7. **Confirm.** Redirect to `/book/[reference]`.

`MUST` — the price shown is recomputed server-side when the hold is created. If
it has changed since the grid was rendered, show the new price and require the
customer to accept before paying.

## Two payment modes

The gateway is deferred (`15-open-questions.md` Q20), so the site is built to
launch **without** it and switch over later with one settings change. Driven by
`venue_settings.online_payment_mode`.

### Mode: `pay_at_venue` — the launch mode

```
pick slots -> phone + OTP -> confirm -> "Pay ₹1,200 at the venue"
```

- The booking is created **confirmed**, with **no payments row**. It shows on the
  desk's calendar as unpaid, and in the dashboard's "Still owing" tile.
- The desk takes cash or card on arrival, exactly as a walk-in.
- **OTP is mandatory in this mode.** Without payment, an unverified phone number
  is a free way to block a Saturday evening court.

`MUST` also, in this mode:
- Cap unpaid future bookings per phone number — default 2. A settings value.
- Show the no-show count on the desk panel, so staff can see a repeat offender.
- Let the desk mark **no-show**, which is already a booking state.

Without those three, free online booking gets abused within a month.

### Mode: `gateway` — once Razorpay is live

Flipping the setting changes the flow to hold → pay → webhook → confirmed, below.
Nothing else in the system moves: the same hold, the same availability, the same
booking row. The gateway is the last step, not the architecture.

### Mode: `off`

No public booking. Desk and partner channels only. The switch to reach for if
something goes badly wrong.

## The payment path (mode: `gateway`)

```
POST /book/hold        -> creates booking (held), creates Razorpay order, returns order id
   [ Razorpay checkout in the browser ]
POST /api/webhooks/razorpay  -> verifies HMAC, confirms booking, writes payment row
GET  /book/[reference] -> polls booking status until confirmed
```

**R3 — the webhook confirms the booking, never the browser.**

1. Server creates the hold, then a Razorpay order for `amount_paise`.
2. Customer pays in the Razorpay checkout.
3. Razorpay POSTs the webhook. We:
   - verify the HMAC signature against `RAZORPAY_WEBHOOK_SECRET`; reject if it fails;
   - **store the raw event first, then process it**;
   - check `gateway_event_id` — if seen before, return 200 and do nothing;
   - set `status = 'confirmed'`, `confirmed_at`;
   - insert a `payments` row with `method = 'gateway'`;
   - queue the WhatsApp confirmation.
4. The browser redirect polls `/book/[reference]` until it reads confirmed. If
   the customer's connection dies here, the booking is already safe.

```
ACCEPTANCE
- a real gateway test payment confirms exactly one booking via the webhook
- delivering that same webhook twice changes nothing (no second payment row)
- a webhook with a bad signature is rejected and logged
- closing the browser immediately after paying still yields a confirmed booking
- a hold that is never paid frees its slot after hold_ttl_minutes
```

### Failure cases the UI must handle

| Case | Behaviour |
|---|---|
| Slot taken between grid render and hold | `slot_taken` — refresh the grid, explain, keep the rest of the selection |
| Payment abandoned | Hold expires; the customer sees "your hold expired, please pick again" |
| Payment succeeded, webhook delayed | Confirmation page shows "confirming your payment" and keeps polling; never says failed |
| Payment failed | Hold released immediately so the slot returns to the grid |

## My bookings — `/my-bookings`

- Login is phone + OTP. No password. Session in `sessions.customer_id`.
- Lists upcoming and past bookings with reference, court, time, amount, status.
- **Cancel** shows the refund quote from `refundQuote()` **before** confirming,
  then writes the cancellation, the refund row, and the audit row in one
  transaction, and queues the cancellation message.
- OTP endpoints MUST be rate limited per phone and per IP.

## Legal pages

Two reasons these are not optional: Razorpay will not approve an account without
them, and Pavilion Club holds customers' personal data — including data received
from Turf Town — which makes it a **data fiduciary** under India's Digital
Personal Data Protection Act, 2023.

**These are drafts for a lawyer to review, not legal advice.** Write them, then
have them checked before go-live.

### `/privacy` — what it must cover

| Section | Must say |
|---|---|
| Who we are | Pavilion Club's legal entity name and registered address |
| What we collect | Name, phone, email, booking history, payment reference. **Explicitly: we never see or store card details** — those go straight to Razorpay |
| Where it comes from | Booked on this website · given at the front desk · **received from partner platforms such as Turf Town when you book through them** |
| Why we hold it | To fulfil and confirm the booking, contact you about it, send reminders, and keep the financial records the law requires |
| Who we share it with | The payment gateway (Razorpay), the messaging provider (WhatsApp/SMS), and nobody else. We do not sell or rent it |
| How long we keep it | Booking and payment records for as long as tax law requires — confirm the period with the client's accountant. Marketing contact deleted on request |
| Your rights | Access, correction, and deletion, and how to ask for each |
| Grievance contact | **A named person and a working email address.** Turf Town's own published policy has an unfilled `enter email here` placeholder — do not repeat that |

### `/cancellation-policy` — what it must cover

- The venue's own rule (default: free more than 24 hours before, no refund inside).
- Refund method and timing.
- **A line stating that bookings made through a partner platform are governed by
  that platform's cancellation policy, and refunds for them are handled by the
  platform.** Without this, a Turf Town customer will demand a refund from
  Pavilion Club for money Pavilion Club never received.

### `/terms` — what it must cover

Booking is a licence to use the court for the stated time; conduct and safety
rules; the venue's right to cancel for weather or maintenance and what happens
to the money; limitation of liability; governing law and jurisdiction.

### In the Turf Town venue agreement

Separate from the website pages, the venue agreement with Turf Town must state
what personal data they pass to Pavilion Club, on what basis, and what Pavilion
Club may do with it — in particular whether contact details captured through a
Turf Town booking may be used for the venue's own direct marketing later. See
`15-open-questions.md` Q4.

## Non-functional

- Mobile first. Most bookings will happen on a phone, often on a weak network.
- The slot grid must be usable at 360px wide.
- Lighthouse performance ≥ 90 on the home page and `/book`.
- The booking flow MUST work without JavaScript for the date and slot selection
  steps where practical; payment necessarily requires JS.
- All prices displayed in rupees, formatted from paise at render time (R4).
