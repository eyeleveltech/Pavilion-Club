---
id: 15-open-questions
title: Open questions
status: open
audience: ai-agent, client
---

# 15 — Open questions

Each question states the **default assumed until answered**. An AI agent
implementing from this specification MUST use the stated default and MUST NOT
invent a different one silently. Update this file when an answer arrives, and
note which files change.

Legend: **BLOCKING** = cannot build the affected part. **DEFAULTED** = building
proceeds on the default.

---

## Partner platform — Turf Town

Confirmed 2026-09-01: the partner is **Turf Town**
(M/s. Turf Town Technologies Private Limited, No.17 Lakshmi Street, Kilpauk,
Chennai 600 010). A marketplace: they list Pavilion Club, their users book,
they take the payment.

Everything below was derived from Turf Town's **consumer** Terms of Service and
Privacy Policy (last modified 17 Feb 2023). Those documents govern Turf Town and
its app users. They do **not** govern the Turf Town ↔ Pavilion Club relationship,
and they are not the integration contract — see Q10.

**Q1 — Does Turf Town's integration spec replace ours?** `BLOCKING for Phase 3`
The client states Turf Town has an existing API that other venue-management
platforms already integrate with, and that we must build to that common
interface. If so, decision D2 changes shape — we implement *their* contract
rather than publishing our own. No public documentation of it exists; it must
come from Turf Town directly.
*Default until answered:* build `08-partner-api.md` as specified. Our five
endpoints map onto any sane marketplace contract, so the engine work is not
wasted whichever way this lands — only the request and response shapes change.
*Escalate if:* their model requires **us to call them** and push availability.
That breaks R1 and needs a design conversation before any code is written.

**Q2 — Can they hold before payment?** `NOT BLOCKING — support both`
*Expectation:* probably no. Turf Town sells Venue Manager, where the marketplace
and the venue calendar share one database and holds are internal. Adding an
external call into their checkout is a dependency marketplaces avoid.

*Why this is not blocking:* the exclusion constraint holds regardless, so a
court is never double-booked. The failure without holds is that they charge a
customer, we answer `slot_taken`, and the customer is refunded. Their checkout
window is 60–90 seconds, so with 2–4 courts and ~40 partner bookings a month
this is a handful of collisions a year, concentrated on peak slots.

*Build:* `POST /holds` exists anyway — our own website needs that exact code
path. Also accept a direct confirm with no prior hold (~20 lines). Support both,
let them choose.

*Negotiate this instead — a contract line, not a feature:*
> When Pavilion Club returns `slot_taken`, Turf Town refunds their customer in
> full and the venue bears no liability or chargeback.

Far easier to agree than a change to their checkout, and it removes the exposure
their ToS §IX.1 currently dumps on the venue.

*Strategic note for the client:* exclusive slot allocation may be the better
commercial deal, not the fallback. Allocate the quiet hours (Tuesday 2pm), keep
peak (Saturday 7pm) for direct bookings at full margin — peak sells itself, and
commission on it is revenue given away.

**Q3 — Commission, service fee, and who pays which.** `DEFAULTED — not blocking`
*Scope note:* calculating their commission is **not our job**. Turf Town works
out their own cut. We record what was sold through them at our prices, and hand
over the evidence. `commission_bps` is one optional number so the settlement can
show an expected figure; left blank, the invoice shows gross and still works.

Their ToS §II.3 says Turf Town charges **the user** a service fee, varying by
"duration of the rental, demand for the stadium or activity centre, weather
conditions, seasonal peaks". That is a customer-side fee, and it may mean
Pavilion Club receives the full slot price with no venue commission at all.
Must confirm: (a) is there a venue-side commission on top, (b) is it deducted
before payout, (c) does Turf Town display our slot price unmodified.
*Default:* `commission_bps = 0`, editable the day a number is known.
*MUST:* settlement gross is always `SUM(bookings.amount_paise)` — **our** price.
Never the amount Turf Town collected, which includes their own fee.

**Q4 — Will they pass us the customer's name and phone?** `NOT BLOCKING`
Their Privacy Policy §IV lists who they share user data with — subsidiaries and
affiliates, a successor entity, law enforcement, contractors working on their
behalf, and anyone with the user's consent. **Venues are not named.** So there is
no published basis for it, though marketplaces normally do in practice.

*Three possible answers, all workable:*
1. Full name and phone — best case.
2. Name plus a masked or proxy number — the Uber/Swiggy pattern.
3. Booking reference only — the customer shows their Turf Town booking at the gate.

*Why it does not block:* what the desk needs is something the arriving customer
can quote and we can match. `partner_reference` does that, and `/admin/search`
searches it. The phone is for reminders, not for entry.

*Build:* `customer_id` stays nullable. The day grid shows
"Turf Town · TT-99182" for a booking with no contact. The slot panel offers
**Add contact details**, so the desk can capture the phone at the gate.

*Business note:* that capture is worth doing anyway. A marketplace customer
whose number you hold can book direct next time, with no commission.

*Legal:* if they do send personal data, Pavilion Club becomes a data fiduciary
under the DPDP Act. Cover it in the venue agreement and in Pavilion Club's own
privacy policy.

**Q5 — Whose cancellation policy wins?** `ANSWERED 2026-09-01`

**Decision: whoever collected the money handles the refund.**
- A Turf Town booking may be cancelled at any time, with no cutoff from us. The
  slot frees immediately. We refund nothing — Turf Town refunds their customer.
- A Pavilion Club booking follows our cutoff, and we refund.

Specified in `05-booking-engine.md` §Cancellation and refunds, and in
`06-admin-console.md` §Cancelling a partner booking from the desk.

Pavilion Club knowingly absorbs the late-cancellation loss on partner bookings.
The reasoning that led here is kept below, because if that cost ever bites, this
is the analysis to revisit.

<details>
<summary>Original analysis</summary>


Two separate questions. Only the second is ours:
- *What does the customer get back?* Turf Town's call. They hold the money and
  their contract is with the customer. Do not try to control this.
- *Does Pavilion Club still get paid for that slot?* The only one that matters.

*Where the money actually leaks:* early cancellations cost nothing — the slot
resells. The loss is entirely in **late** cancellations, where a peak slot goes
empty with no chance of resale. Rough exposure at ~40 partner bookings/month
with 5–10% cancelling late: 2–4 peak slots a month, ₹30k–₹60k a year.

*The clean fix — one narrow ask, not a policy argument:*
> "Please configure Pavilion Club's 24-hour cancellation window on your side, so
> your customers cannot cancel inside it."

Most Indian sports marketplaces allow a per-venue cancellation window. If they
agree, this question closes entirely.

*Fallbacks, in order:*
1. They keep their window but still pay for late cancellations. Unlikely.
2. Pavilion Club absorbs it — the current default. Cancellation frees the slot
   and drops off the invoice. Safe, because it never claims money we cannot
   justify.
3. Give them off-peak slots only. If they insist on late cancellations, don't
   let them sell Saturday 7pm. The exposure disappears.

*Build now:* **nothing.** `cancelled_at` and `cancelled_by` are already stored,
so "Pavilion Club is paid for cancellations inside 24 hours" is later a `WHERE`
clause in the settlement query, not a redesign.

*Settle these in the same conversation:*
- **No-shows.** Booked, paid, nobody came, no cancellation. Pavilion Club should
  be paid — the court was held. Our spec already counts no-shows as payable;
  confirm they agree.
- **Venue-side cancellation.** Rain or maintenance: we cancel, they refund their
  customer, the booking drops off the invoice. They need our `booking.cancelled`
  webhook or their customer turns up to a locked gate. This is why Q10 should be
  a yes.
- **The customer-facing half is already handled** on our site: the
  `/cancellation-policy` page states that partner bookings follow the partner's
  policy and are refunded by them — see `07-public-site.md` §Legal pages.

</details>

**Q6 — When a customer cancels on Turf Town, do they call our cancel endpoint?**
`STILL OPEN — but now the only cancellation question left`
Given the Q5 decision, this is the whole partner cancellation flow: they cancel,
they call us, our slot frees, nobody refunds anything on our side.
If they will not call it, the fallback is a nightly reconciliation job comparing
their bookings against ours — slower, still correct, and the court is only
wrongly blocked for a few hours rather than permanently.

**Q6 — When a customer cancels on Turf Town, do they call our cancel endpoint?**
`BLOCKING for Phase 3`
Without it the court sits blocked and empty. *Default:* assume yes.

**Q7 — Do they read availability live, or from a cache?** `BLOCKING for Phase 3`
A cached mirror breaks R1 and makes double bookings inevitable.
*Default:* assume live.

**Q8 — Is there a sandbox?** `DEFAULTED`
*Default:* our own `pc_test_` sandbox keys let us build and test the whole
integration without them, which is why Phase 3 does not wait on their calendar.

**Q9 — Which legal entity?** `BLOCKING for contract`
Their ToS names **Turf Town Technologies Private Limited**; the Venue Manager
app on Google Play is published by **Turftown Sporting Pursuits Private Limited**.
Two different names. The venue agreement must name the right one.

**Q10 — Get the two documents that actually matter.** `BLOCKING for Phase 3`
(a) the **Venue Partner Agreement**, (b) the **API / integration documentation**,
(c) sandbox credentials, (d) a named technical contact.
The consumer ToS and Privacy Policy supplied so far are neither of these.

**Q11 — Does marketplace listing require using their Venue Manager?**
`BLOCKING for Phase 3`
Turf Town ships **Turf Town Venue Manager**, their own venue-side app for slot
booking, revenue tracking and payment collection — a direct competitor to what
we are building. Their commercial incentive is for Pavilion Club to use it
rather than a third-party system. Establish early whether marketplace listing is
available to venues running their own software, and on what terms.

---

## The venue

**Q12 — How many courts?** `ANSWERED 2026-09-01 — 3 courts`
Names still to confirm; seed as "Court 1", "Court 2", "Court 3" and rename in
Settings when the client says otherwise. Count, names, slot length and hours are
all admin-editable rows — see `06-admin-console.md` §Courts and hours. Nothing
about the court configuration is in code.

**Q13 — Opening and closing times per weekday.** `ANSWERED 2026-09-01`
**Mon–Fri 06:00–23:00, Sat–Sun 06:00–00:00, all 3 courts.**
Seeded in `04-data-model.md` §Seed. 363 slots a week.
Editable in Settings, so this is a starting position, not a commitment.

*Still worth confirming with the venue owner when convenient:*

*Ask the venue owner, in their words, not ours:*
- What time does the first game of the day start?
- What time is the last slot?
- Is the weekend different?
- Do you ever run past midnight?
- Do you close on any day of the week?
- Do you shut in the middle of the day — cleaning, heat, maintenance?

The last one is why `court_hours` allows more than one period per weekday. The
answer is usually no, and then nobody ever sees that capability.

*Nothing is wasted whichever way they answer.* Cross-midnight, split shifts and
a closed weekday are all already handled, because the business-date logic they
depend on sits at the centre of the engine and had to be built anyway.

**Q14 — Slot length: 30 or 60 minutes?** `ANSWERED 2026-09-01 — 60 minutes`
Per court, changeable in Settings without a migration.

**Q15 — Can a customer book consecutive slots?** `DEFAULTED`
*Default:* yes. This is what makes the `40P01` deadlock handling necessary — see
`05-booking-engine.md`.

**Q16 — The full price grid.** `BLOCKING for go-live`
Weekday, weekend, morning, evening peak. Any off-peak or member rate.
*Default:* a single flat rule for development. `no_price_configured` refuses a
booking rather than defaulting to zero.

**Q17 — Cancellation policy.** `DEFAULTED` — see also Q5
*Default:* free cancellation more than 24 hours before, no refund inside that.
Stored in `venue_settings`, changeable without a deploy.

**Q18 — How far ahead can customers book?** `DEFAULTED`
*Default:* 30 days. In `venue_settings`.

**Q19 — Who gets a login, and at what role?** `BLOCKING for go-live`
*Default:* one owner account for development.

**Q20 — Razorpay.** `DEFERRED 2026-09-01 — integrate later`
Client has parked the gateway. The site therefore launches on
`online_payment_mode = 'pay_at_venue'` and flips to `'gateway'` with one settings
change when Razorpay is ready — see `07-public-site.md` §Two payment modes.

*What this buys:* Phase 2 no longer waits on KYC, and the public site can go live
weeks earlier.

*What it costs, and must be built with it:* online bookings are unpaid until the
customer arrives, so a free reservation is a free way to block a Saturday
evening court. Mandatory in this mode — OTP verification, a cap on unpaid future
bookings per phone (default 2), and the no-show marker on the desk panel.

*Still to decide before switching to `gateway`:* whose account — Pavilion Club's
or ours. It determines who is liable and where the money lands, and the KYC takes
days. Not urgent now, but do not discover it on launch week.

**Q21 — Brand assets and visual design.** `DEFERRED BY DECISION 2026-09-01`
No UI design work happens now. Everything is built on neutral tokens, and the
theme is replaced in full later — see `../ui/02-design-system.md`. Not a
blocker for any phase, including the public site launch.

Not blocking. Build against neutral placeholder tokens; brand is CSS variables
plus a logo file, so the swap is an afternoon.

*Ask the design team for exactly this, or it arrives as a PDF and nothing usable:*
- Logo as **SVG** — full colour, plus a single-colour version for dark backgrounds
- Favicon source, square, 512px minimum
- Brand colours as **hex values**, not swatches in a PDF
- Typefaces by **name**, with the licence. Google Fonts is easiest; anything else
  needs licensed webfont files
- Court photographs, landscape, **1600px wide minimum**, unwatermarked
- Whatever brand guidelines exist

---

## Technical

**Q22 — Confirm the stack.** `ANSWERED 2026-09-01`
Next.js 15 + TypeScript · PostgreSQL 16+ · **Drizzle for CRUD, raw SQL for
reports** · plain SQL migrations (Drizzle never owns the schema) · Tailwind +
shadcn/ui · **auth built in-house**, sessions table + phone OTP · Razorpay
deferred behind the mode switch · SheetJS · Sentry.
Full detail in `03-stack.md`, now marked confirmed.

**Q23 — Hosting.** `ANSWERED 2026-09-01 — Hostinger VPS`
Docker Compose + Caddy on one box. Postgres from the official Docker image, so
`btree_gist` needs no extra work.
*Verify before purchase:* an India region (Singapore as fallback), and that
daily snapshots are available.

**Q23a — Domain name.** `BLOCKING for Phase 2`
Needed before any real webhook can be tested.

**Q24 — Who owns the server day to day after go-live?** `BLOCKING for go-live`

---

## Answered

Move questions here with the answer and the date, rather than deleting them.

| # | Question | Answer | Date |
|---|---|---|---|
| D1 | Standalone or tenant on Turf OS? | Standalone build | 2026-09-01 |
| D2 | Who calls whom for the partner integration? | The partner calls our API — but see Q1, their spec may govern | 2026-09-01 |
| D4 | Embed booking or rebuild the site? | Rebuild with booking built in | 2026-09-01 |
| — | Turf Town or Townscript? | **Turf Town.** A marketplace listing Pavilion Club; their users book and they collect payment | 2026-09-01 |
| — | How many partner platforms? | One — Turf Town. The generic channel design stays (D5), because it costs nothing and a second marketplace is a row, not a rebuild | 2026-09-01 |
