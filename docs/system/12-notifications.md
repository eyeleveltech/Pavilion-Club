---
id: 12-notifications
title: Notifications and OTP
status: draft
audience: ai-agent
depends_on: [04-data-model]
---

# 12 — Notifications

## The outbox rule

**A message is never sent inline during a request.** It is queued in
`message_outbox` and drained by the worker. A slow messaging provider must never
slow down a booking, and a provider outage must never fail a payment.

```
queue -> worker leases (leased_until) -> send -> sent
                              |
                              +-- failure -> attempts++ -> backoff -> retry
                              +-- attempts >= 5 -> dead, alert the owner
```

Backoff: 30s, 2m, 10m, 1h, 6h. WhatsApp failure falls back to SMS on the same
row, recording the fallback in `last_error`.

## Customer messages

| Template | Trigger | Contains |
|---|---|---|
| `booking_confirmed` | Booking confirmed, any channel | Reference, court, date, time, amount, venue address |
| `booking_reminder` | 09:00 IST on the day of play | Court, time, reference |
| `booking_cancelled` | Cancellation | Reference, refund amount and expected timing |
| `booking_rescheduled` | Desk moves a booking | Old and new time |
| `otp` | Login or booking verification | 6-digit code, 5-minute validity |

## Venue messages

| Template | Trigger |
|---|---|
| `daily_summary` | 23:45 IST to the owner — bookings, collected, tomorrow's fill |
| `partner_booking` | Optional, on a partner booking arriving |
| `outbox_dead` | A message hit 5 failures |
| `settlement_due` | Month end, per partner with an outstanding balance |

## OTP

- 6 digits, 5-minute validity, stored **hashed** in `otp_codes`.
- Maximum 5 verification attempts per code, then it is burned.
- Rate limited: 3 sends per phone per 15 minutes, and per-IP limiting on top.
  This is the obvious abuse target and the one that costs real money per SMS.
- In development the code MAY be returned in the response. This MUST be disabled
  in production by an explicit environment check, not by a comment.

```
ACCEPTANCE
- a booking confirms successfully even when the messaging provider is down
- a WhatsApp failure falls back to SMS and the SMS arrives
- a message that fails 5 times is marked dead and alerts the owner
- 4 OTP requests for one phone inside 15 minutes: the 4th is refused
- no OTP code is stored in plaintext
```

## Provider setup — start on day one

WhatsApp Business template approval takes **3 to 7 days** and blocks nothing
else in the meantime. Submitting the templates late turns a paperwork delay into
a launch delay. Submit all five customer templates at the start of Phase 0.

Accounts needed: a WhatsApp BSP (AiSensy or Interakt), an SMS provider (MSG91 or
2Factor) for fallback and OTP.
