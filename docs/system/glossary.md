---
id: glossary
title: Glossary
status: draft
audience: ai-agent
---

# Glossary

Domain vocabulary. Use these words exactly; ambiguity here becomes bugs later.

| Term | Means |
|---|---|
| **Availability** | The computed set of slots that can be booked. Produced by one function only (R1). |
| **Blackout** | A court blocked for maintenance or a private event. Not a booking, so occupancy reports stay honest. |
| **Booked value** | `SUM(bookings.amount_paise)`. What was sold. **Not** what arrived. |
| **Booking** | One court, one continuous time range, one customer, one channel, one of five states. |
| **Booking window** | How far ahead the public may book. A write-path guard, never an availability concept. |
| **Business date** | The night a booking belongs to. A 00:30 booking belongs to the night that is closing. Every report keys off this. |
| **Channel** | Where a booking came from: website, walk-in, phone, admin, or a named partner. A row, never a code branch (R6). |
| **Collected** | `SUM(payments.amount_paise)`. Money that actually moved. |
| **Commission** | What a partner keeps from a booking they sourced. Stored in basis points. |
| **Confirmed** | Paid, or accepted at the desk, or confirmed by a partner. Blocks the slot. |
| **Desk** | The front counter. Also the lowest staff role. |
| **Hold** | A `bookings` row with `status = 'held'` and `expires_at`. Blocks the slot while someone pays. Not a separate table. |
| **Idempotency key** | A caller-supplied id making a retried write safe. Unique-indexed per channel. |
| **No-show** | Booked, paid, nobody came. Distinct from cancelled, and **counted as revenue**. |
| **Occupancy** | Slots taken over slots available, for a period. Denominator comes from opening hours minus blackouts. |
| **Outstanding** | Booked value minus collected. Split into *customer owes* and *partner owes*. |
| **Paise** | 1/100 rupee. The only unit money is stored in (R4). ₹1,200 is `120000`. |
| **Partner** | An outside platform selling our courts through the API. |
| **Receivable** | A confirmed booking whose money is with a partner, not with us. |
| **Reference** | Human-readable booking id, e.g. `PC-8FK2QD`. What a customer quotes at the gate. |
| **Scope** | What an API key may do. Keys carry scopes; users carry permissions. Never mixed. |
| **Settlement** | A period's partner bookings invoiced as one balance. `pending → invoiced → settled`. |
| **Slot** | One bookable unit of time on one court, `court.slot_minutes` long. |
| **Sweeper** | The job that expires stale holds. Tidiness, not correctness — correctness comes from the `23P01` retry. |

## Words to avoid

| Avoid | Because | Use instead |
|---|---|---|
| "Revenue" | Means three different things | "booked value" or "collected" |
| "Source" | Overloaded with database sources | "channel" |
| "Turf" | This is a pickleball venue | "court" |
| "Slot table" | There is none; slots are computed | "availability" |
| "Cash at venue" | It described an intention, not a receipt — this caused a real defect | "paid in cash" (with a payments row) |
