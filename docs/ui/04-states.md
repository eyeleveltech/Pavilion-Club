---
id: fe-04-states
title: Empty, loading, error, denied
status: draft
audience: ai-agent
---

# The other half of every screen

Most of a build is the happy path. Most of the *feeling* of a product is these.
**Every screen must define all five.** A screen shipped with only the populated
state is not finished.

---

## 1. Loading

- **Skeletons, not spinners.** A skeleton in the shape of the content stops the
  layout jumping when data lands.
- The **shell renders immediately** — sidebar, header, page title. Only the data
  region is a skeleton.
- Anything under ~300ms shows nothing at all. Flashing a skeleton for one frame
  looks broken.
- A slow save disables its button and changes the label: *"Booking…"*. Never
  leave a button live during a submit.

## 2. Empty — nothing exists yet

Distinct from "no results". Say what it is, and give the action.

| Screen | Message | Action |
|---|---|---|
| Calendar day | *No bookings on this day yet.* | **Book a slot** |
| Customers | *No customers yet. They appear here after their first booking.* | — |
| Settlements | *No settlements yet. Create one at the end of the month.* | **Create settlement** |
| Partners | *No partners connected. Add one to let an outside platform sell your courts.* | **Add partner** |
| Blackouts | *No blackouts. Add one to close a court for maintenance or an event.* | **Add blackout** |
| Missed demand | *No missed demand recorded yet — nobody has been turned away.* | — |

No illustrations. No "Oops!". A sentence and a button.

## 3. No results — a filter is too narrow

Different message, different fix: the data exists, the filter excluded it.

```
No bookings match "Rah" in September.
[ Clear search ]   [ Search all dates ]
```

Always offer the widening action. Never make the user work out what to undo.

## 4. Error

Three kinds, three treatments.

**Field error** — under the input, `--danger`, states the fix.
> *Enter a 10-digit mobile number.*

**Action failed** — toast, and the form keeps everything typed.
> *Could not save. Your changes are still here — try again.*

**Page failed** — inline in the content region. The shell stays; the sidebar
still works.
> **This page could not load.** [ Try again ]

Rules:
- **Never lose typed data on an error.** A desk staff member who retypes a phone
  number because of a network blip will stop trusting the system.
- Never show a raw error code or stack trace. Log it, show a sentence.
- Say what to do next, not what went wrong internally.

### The one error that needs its own design

```
That slot was just taken.
Someone booked Court 2 at 19:00 a moment ago.

[ Pick another slot ]        [ See what's free at 19:00 ]
```

This is not a failure — it is the system working. It must not look like a crash,
and it must offer the next best thing immediately (`../system/05-booking-engine.md`
`JUST_TAKEN`).

## 5. Permission denied

Nav items the role cannot use are **hidden**. But a bookmarked or shared URL
still has to answer:

```
You don't have access to this page.
Ask the owner if you need it.
[ Back to Now ]
```

No detail about what is behind it. Never a blank page, never a redirect loop.

---

## Two more worth designing

**Expired hold** — the customer's ten minutes ran out.

```
Your hold expired. The slot has been released.
[ Check if it's still free ]
```

**Stale data** — the day grid has been open for a while. Refresh every 60s in the
background; if a booking changed underneath, show a quiet line rather than
yanking the view:

> *Updated just now · 1 new booking*

Never re-sort or scroll-jump a grid someone is looking at.

---

```
ACCEPTANCE
- every screen has a defined loading, empty, no-results, error and denied state
- an error during a form submit never clears the form
- slot_taken renders as a choice, not as a failure
- a role without permission gets the denied screen, not a blank page
```
