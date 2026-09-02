---
id: fe-09-state
title: State management
status: draft
audience: ai-agent
depends_on: [fe-07-architecture]
---

# State management

`07-architecture.md` said "the URL is the state". That is a slogan, not an
architecture. This file is the actual model.

## Five kinds of state

Almost every state-management mistake is putting one of these in the wrong
place. Classify first, then the answer is obvious.

| # | Kind | Example | Lives in |
|---|---|---|---|
| 1 | **Server data** | bookings, courts, availability, prices | Server components. Never copied into a client store |
| 2 | **Screen state** | which date, which court, which report period, search query | **URL search params** |
| 3 | **Wizard state** | the in-progress booking, before it becomes a hold | **URL search params** |
| 4 | **Form state** | field values, validation errors, submitting | `react-hook-form`, local |
| 5 | **Ephemeral UI** | is the sheet open, is the dropdown open, hover | `useState`, local |

**There is no sixth kind in this product.** No global user preferences, no
client-side cart, no offline queue, no cross-page shared model. That is why no
store library is needed — not because stores are bad.

---

## Rule 1 — server data never enters a client store

The most damaging possible mistake here would be putting the slot list in a
store, keeping it "in sync", and rendering from it.

```ts
// NEVER
const useSlots = create((set) => ({ slots: [], fetchSlots: async () => { … } }));
```

Availability is computed on the server on every render (R1). A client copy goes
stale the moment someone else books, and the customer then chooses a slot that
is already gone. The database still refuses it — so this is not a correctness
bug — but the customer gets a failure where they should have got a truthful list.

Server data flows **down as props**, from a server component. It is never
mirrored, cached, or subscribed to on the client.

---

## Rule 2 — anything worth a refresh goes in the URL

```
/admin/calendar/2026-09-06?court=2&booking=PC-8FK2QD
/admin/reports/source?from=2026-09-01&to=2026-09-30&channel=turftown
/book?date=2026-09-06&from=19&to=21
```

Which buys, for free:

- **Refresh-safe.** Mobile browsers reload backgrounded tabs. A wizard held in
  `useState` loses everything; a wizard in the URL does not.
- **The back button works.** Step 2 → back → step 1, with no custom history code.
- **Shareable.** The desk can send the owner a link to the exact booking.
- **Testable.** A test navigates to a URL instead of clicking through three steps.

Read with `useSearchParams`, write with `router.push`. One helper in `lib/url.ts`
so nothing hand-builds a query string.

---

## The booking wizard — the only real multi-step state

Each step is a URL. Nothing else holds it.

```
/book                                     step 1 · choose a date
/book?date=2026-09-06                     step 2 · choose an hour
/book?date=2026-09-06&from=19             one hour selected, summary bar live
/book?date=2026-09-06&from=19&to=21       two hours, merged
/book?date=2026-09-06&from=19&to=21&court=2   court overridden manually
/book/hold/[bookingId]                    hold created — state is now a DATABASE ROW
```

**The elegant part:** the moment the hold is created, the wizard's state stops
being client state at all. It is a `bookings` row with `status='held'` and an
`expires_at`. The page needs one number — the countdown — and nothing else.

So the client state in the entire public booking flow exists for about thirty
seconds, and it lives in the address bar.

The only genuinely local state on that screen is the multi-select interaction
while dragging across hours, and that resolves into `from`/`to` on release.

---

## The admin day grid

```
/admin/calendar/2026-09-06?booking=PC-8FK2QD
```

The open booking panel is a **URL param, not `useState`**. Same reasoning, plus
one more: staff can send that link to the owner and it opens on the same booking.

Polling (`router.refresh()` every 60s) re-runs the server component and pushes
fresh props down. Nothing to invalidate, nothing to reconcile — because there is
no client copy to go stale.

---

## Mutations

Server actions, then `revalidatePath()`. No client cache to update.

`useOptimistic` **only where failure is harmless** — marking a no-show, toggling
a setting. **Never on booking creation**, where `JUST_TAKEN` is a real and
frequent outcome and an optimistic row would appear and then vanish.

---

## When to add a store, and which

Do not add one pre-emptively. Add one when **all three** are true:

1. Three or more sibling components need the same state,
2. it genuinely does not belong in the URL,
3. and prop drilling has passed two levels.

Today nothing in the plan meets that bar. The realistic future trigger is an
offline-capable desk mode — a queue of pending bookings is real client state
with no URL representation. That is explicitly out of scope
(`../system/14-build-phases.md`).

**If it becomes necessary: Zustand.** ~1KB, no provider, no boilerplate, works
with server components because it is opt-in per component. Redux and its
ecosystem are far more machinery than a three-court booking system will ever
need.

---

## Anti-patterns — reject these in review

| Anti-pattern | Why |
|---|---|
| Availability or prices in a client store | Goes stale, breaks R1's intent |
| A `useEffect` that fetches on mount | Server components already have the data |
| React Query / SWR | Adds a cache layer over data that is already server-rendered |
| A Context provider for the current date | It is a URL param |
| Panel open/closed in `useState` | Loses shareability for nothing |
| `useOptimistic` on booking creation | `JUST_TAKEN` makes the row flicker in and out |
| Duplicating `venue_settings` into a store | Pass it down; it changes twice a year |

```
ACCEPTANCE
- no client component holds a bookings or slots array in state
- date, court, report range, search query and open panel are all URL params
- refreshing mid-booking-wizard loses nothing
- the back button steps back through the wizard with no custom history handling
- no state library is in package.json
```
