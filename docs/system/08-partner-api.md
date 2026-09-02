---
id: 08-partner-api
title: Partner API v1
status: draft
audience: ai-agent, partner-integrator
depends_on: [02-rules, 05-booking-engine]
---

# 08 — Partner API v1

For an outside platform selling Pavilion Club's courts on their own site or app.
The same availability engine the venue's own calendar runs on — there is no
second implementation of "what is free", so this API and the front desk can
never disagree.

**Base URL** — `https://<venue-domain>/api/v1`

Decision D2: they call us. Decision D5: the API is partner-agnostic; a new
partner is a `channels` row plus an `api_keys` row, never a code change (R6).

---

## Authentication

```
Authorization: Bearer pc_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`X-Api-Key: pc_live_…` is accepted as an alternative.

A key identifies **one channel and a set of scopes, and nothing else**. It can
never become a user login. It is stored hashed and peppered — if lost, it is
reissued, not recovered. Keys prefixed `pc_test_` are sandbox keys: they behave
identically and their bookings are marked as test data and excluded from revenue
reports.

### Scopes

| Scope | Allows |
|---|---|
| `availability:read` | `GET /availability` |
| `bookings:write` | `POST /holds`, `POST /bookings` |
| `bookings:read` | `GET /bookings/{id}` |
| `bookings:cancel` | `POST /bookings/{id}/cancel` |

A key without the scope gets `403 missing_scope`, and the response lists the
scopes it does have — so a misconfigured key is one request to diagnose.

## Rate limits

Fixed one-minute window per key, default 120 requests. On refusal:

```
HTTP 429
Retry-After: 37
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
```

`NOTE` — the counter lives in the `api_keys` row, so it is shared across
processes. A per-process counter is wrong the moment there are two containers.

## Errors

Every failure is JSON with the same shape and a stable `code`. **Match on
`code`, never on `message`** — messages get reworded.

```json
{ "error": { "code": "slot_taken", "message": "That slot is no longer available." } }
```

| Status | Code | Meaning |
|---|---|---|
| 400 | `bad_json` | Body was not JSON |
| 400 | `missing_fields` | A required field was absent |
| 400 | `bad_timestamp` | `starts_at` was not an ISO 8601 timestamp |
| 400 | `not_contiguous` | Requested range is not a whole number of slots |
| 401 | `missing_key` | No key presented |
| 401 | `invalid_key` | Key unknown or revoked |
| 403 | `missing_scope` | Key lacks the scope for this endpoint |
| 404 | `court_not_found` | No such court |
| 404 | `not_found` | No such booking, or not created by your key |
| 409 | `slot_taken` | The slot went while you were deciding |
| 409 | `hold_expired` | The hold expired before you confirmed |
| 409 | `already_cancelled` | Booking is already cancelled |
| 422 | `outside_hours` | Court is closed at that time |
| 422 | `outside_window` | Beyond `booking_window_days` |
| 422 | `no_price_configured` | No price rule matches that slot |
| 429 | `rate_limited` | See `Retry-After` |
| 500 | `internal` | Our fault. Safe to retry with the same idempotency key. |

---

## Endpoints

### GET /availability

```
GET /api/v1/availability?date=2026-09-14&court_id=<uuid>
Scope: availability:read
```

`court_id` optional; omitted returns all bookable courts. `date` is a business
date in `YYYY-MM-DD`.

```json
{
  "date": "2026-09-14",
  "timezone": "Asia/Kolkata",
  "courts": [
    {
      "court_id": "8f2c…",
      "name": "Court 1",
      "slot_minutes": 60,
      "slots": [
        { "starts_at": "2026-09-14T12:30:00Z", "ends_at": "2026-09-14T13:30:00Z", "price_paise": 90000 },
        { "starts_at": "2026-09-14T13:30:00Z", "ends_at": "2026-09-14T14:30:00Z", "price_paise": 120000 }
      ]
    }
  ]
}
```

Only free slots are returned. Prices are in paise (R4).

### POST /holds

Blocks a slot for `hold_ttl_minutes`. **Call this before taking the customer's
money.**

```json
POST /api/v1/holds
Scope: bookings:write

{
  "court_id": "8f2c…",
  "starts_at": "2026-09-14T13:30:00Z",
  "ends_at":   "2026-09-14T14:30:00Z",
  "customer": { "phone": "+919876543210", "name": "Rahul" },
  "idempotency_key": "your-uuid"
}
```

```json
201
{
  "booking_id": "b1e4…",
  "reference": "PC-8FK2QD",
  "status": "held",
  "expires_at": "2026-09-14T12:40:00Z",
  "amount_paise": 120000
}
```

`amount_paise` is **our** resolved price. Any amount in the request is ignored (R5).

### POST /bookings

Confirms a hold after the partner has taken payment.

```json
POST /api/v1/bookings
Scope: bookings:write

{
  "booking_id": "b1e4…",
  "partner_reference": "TT-99182",
  "amount_collected_paise": 120000
}
```

```json
200
{ "booking_id": "b1e4…", "reference": "PC-8FK2QD", "status": "confirmed" }
```

- Sets `status = 'confirmed'`, `confirmed_at`, `partner_reference`.
- Writes **no `payments` row** — the money is with the partner. It becomes a
  receivable. See `09-money-settlement.md`.
- Idempotent on `(channel_id, partner_reference)`. Re-sending returns the same
  booking, not an error.
- Returns `409 hold_expired` if the hold lapsed. The partner must then either
  re-hold or refund their customer.

### GET /bookings/{id}

```json
200
{
  "booking_id": "b1e4…", "reference": "PC-8FK2QD", "status": "confirmed",
  "court": { "id": "8f2c…", "name": "Court 1" },
  "starts_at": "2026-09-14T13:30:00Z", "ends_at": "2026-09-14T14:30:00Z",
  "amount_paise": 120000,
  "customer": { "phone": "+919876543210", "name": "Rahul" },
  "partner_reference": "TT-99182"
}
```

Returns `404 not_found` for a booking your key did not create. A key MUST NOT be
able to read another channel's bookings.

### POST /bookings/{id}/cancel

```json
POST /api/v1/bookings/b1e4…/cancel
Scope: bookings:cancel

{ "reason": "customer_request" }
```

```json
200
{ "booking_id": "b1e4…", "status": "cancelled", "refund_due_paise": 0 }
```

`refund_due_paise` is what **we** owe. For a partner booking we were never paid
for, this is 0 — the partner refunds their own customer. The slot is freed
immediately.

---

## Events we send them

Signed over `timestamp.body` with the channel's webhook secret, queued in
`webhook_outbox`, retried with backoff to 8 attempts, then dead-lettered. This
is what keeps their listing fresh when a slot is blocked at our desk.

```
X-Pavilion-Timestamp: 1789412400
X-Pavilion-Signature: sha256=<hex hmac of "timestamp.body">
```

| Event | Fires when |
|---|---|
| `slot.blocked` | The desk or the website took a slot they were showing |
| `booking.cancelled` | A booking they sold was cancelled on our side |
| `court.unavailable` | A blackout or maintenance window was added |

Receivers MUST tolerate duplicates. We guarantee at-least-once delivery.

---

## Guardrails — agree these with the partner before integrating

1. **Hold before payment.** They must call `POST /holds` before charging their
   customer. Without it they will occasionally take money for a slot that went
   five seconds earlier. **This is the single most important thing to agree.**
2. **No cached inventory.** If they mirror our availability into their own
   database and sell from the mirror, R1 is broken and double bookings become
   inevitable.
3. **Match on `code`, not `message`.**
4. **Test against sandbox keys first.**

### Fallback if they cannot hold before payment

Allocate the partner a **fixed block of slots they own exclusively** —
implemented as standing blackouts on our side, released back to us on an agreed
notice period. Less revenue, but safe. Only use this if guardrail 1 is refused.

---

---

## Turf Town specifics

The partner is **Turf Town** (turftown.in, Chennai). Everything below comes from
their published **consumer** Terms of Service and Privacy Policy, last modified
17 February 2023. Those documents govern Turf Town and its app users. They are
**not** the venue agreement and **not** the integration contract. No public API
documentation exists — searched 2026-09-01.

### Their spec may replace this one

`OPEN, BLOCKING for Phase 3.` The client states Turf Town has an existing API
that other venue-management platforms integrate with. If so, this document
becomes our internal design and their contract becomes the published interface.

The engine underneath does not change. Availability, holds, the exclusion
constraint and the concurrency guarantees are identical whichever shape sits in
front of them. **The one model to refuse** is being asked to push availability to
them and receive bookings asynchronously — that breaks R1 and guarantees
double bookings. Escalate rather than implement it.

### Their service fee is not our price

ToS §II.3: Turf Town charges **the user** a service fee "determined on the basis
of various factors including but not limited to duration of the rental, demand
for the stadium or activity centre, weather conditions, seasonal peaks".

- The total their customer pays is **not** our slot price.
- `amount_collected_paise` in `POST /bookings` is informational only. Store it,
  never compute from it.
- **Settlement gross is always `SUM(bookings.amount_paise)`** — our price,
  resolved by our rules (R5).
- It may also mean there is no venue-side commission at all, and Pavilion Club
  receives the full slot price. Confirm before setting `commission_bps`.

### Their cancellation policy is not ours

ToS §V: refunds follow Turf Town's own policy, shown on their cart page,
processed by them in 5–7 business days. Pavilion Club's policy is 24 hours.
These will conflict, and the gap is real money every month. See
`15-open-questions.md` Q5.

### The liability is Pavilion Club's

ToS §IX.1: *"Turf Town will not be a party to or in any way responsible for
monitoring any transaction between you and third-party providers of services
such as the owners of different Venue."*

If a slot is sold twice, Turf Town's terms put that on Pavilion Club. This is
why **hold-before-payment is a commercial requirement, not a technical
preference** — no code on our side can prevent an oversell if their money moved
before they asked us.

### Customer contact details are not guaranteed

Privacy Policy §IV lists who they share user data with: subsidiaries and
affiliates, a successor entity, law enforcement, contractors working on their
behalf, and anyone with the user's consent. **Venues are not named.** There is
no published basis for them passing us a booker's name and phone. Get it into
the venue agreement — the desk needs a phone number at the gate.

### They sell a competing product

**Turf Town Venue Manager** is their own venue-side app for slot booking,
revenue tracking and payment collection. Their commercial incentive is for
Pavilion Club to use it rather than our system. Establish early whether
marketplace listing is available to venues running their own software.

---

## Questions to put to Turf Town

Answers go in `15-open-questions.md` Q1–Q11.

1. Do you have an integration specification we should build to? Please send it.
2. At checkout, do you read our availability live, or from a cache you refresh periodically?
3. Can you call a hold endpoint before taking payment, and confirm after?
4. Your ToS says you charge the user a service fee. Is there also a venue-side commission, and is it deducted before payout?
5. Do you display our slot price unmodified?
6. What is the payout cycle to the venue?
7. Do you pass us the customer's name and phone number?
8. Whose cancellation policy applies — yours or the venue's? If you refund inside the venue's no-refund window, is the venue still paid?
9. When a customer cancels on your side, do you call our cancel endpoint?
10. Do you want webhooks from us when a slot is blocked at our desk?
11. Is there a sandbox we can test against before go-live?
12. Is marketplace listing available to venues running their own booking software, rather than Venue Manager?

```
ACCEPTANCE
- a key with no bookings:write scope gets 403 missing_scope listing its scopes
- a key cannot read a booking created by a different channel (404, not 403)
- POST /bookings twice with the same partner_reference creates one booking
- 121 requests in one minute on a 120/min key: the 121st gets 429 with Retry-After
- a partner booking appears in the source-wise report attributed to that partner
- a sandbox key's bookings are excluded from revenue reports
```
