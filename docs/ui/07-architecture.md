---
id: fe-07-architecture
title: Frontend architecture
status: draft
audience: ai-agent
---

# Frontend architecture

Next.js 15 App Router. The decisions here mostly exist to keep availability on
the server (R1) and to avoid a state-management layer nobody needs.

## Folder structure

```
apps/web/src/
  app/
    (site)/                    public — marketing + booking
      page.tsx  book/  about/  contact/  terms/  privacy/
    (admin)/                   admin console
      layout.tsx               the shell: sidebar, header, search
      page.tsx                 Now or Dashboard, by role
      book/  calendar/  search/  customers/  reports/  close/  cash/
      settings/
    api/v1/                    partner API
    api/webhooks/razorpay/
  components/
    ui/                        shadcn — copied in, ours to edit
    admin/                     SlotGrid, MonthCalendar, BookingPanel, StatTile
    site/                      PublicSlotGrid, SummaryBar
  lib/
    format.ts                  formatPaise, formatTime — the UI boundary
    url.ts                     search-param helpers
  server/
    session.ts                 requirePermission()
    actions/                   server actions, one file per aggregate
```

## Server and client components

**Default: server.** A component becomes `"use client"` only when it needs
state, an event handler, or a browser API.

| Server | Client |
|---|---|
| Every page and layout | Slot grid cells (click, hover) |
| Data fetching, all of it | Forms |
| Availability computation | Date picker, sheet, dialog |
| Permission checks | Search box, keyboard shortcuts |
| Money formatting | Countdown timers |

**The rule that matters:** availability is computed in a server component and
passed down as a plain `Slot[]`. The browser **never** receives raw bookings and
works out what is free. Most shadcn components are client components — keep the
data fetching above them and pass results in.

## Data fetching

- Fetch in the page (a server component), pass down as props. No client-side
  fetching library, no SWR, no React Query.
- Query the database directly through `packages/db`. No internal HTTP hop to our
  own API — that exists for partners.
- One query per screen where possible. The month view uses
  `computeAvailabilityRange()` — one query for 30 days, not thirty.
- `revalidatePath()` after a mutation. Nothing caches availability
  (R1) — `export const dynamic = 'force-dynamic'` on the calendar, Now board and
  booking pages.

## The URL is the state

No Zustand, no Redux, no Context for app data. Screen state lives in search
params:

```
/admin/calendar/2026-09-06?court=2
/admin/reports/source?from=2026-09-01&to=2026-09-30&channel=turftown
/admin/search?q=98765
```

Which means a screen is shareable, bookmarkable, survives refresh, and the back
button works. When the desk phones the owner about a booking, they can send the
link.

Client state is only ever ephemeral UI: is the sheet open, is the dropdown open.

## Mutations — server actions

Every write is a server action, one file per aggregate in `server/actions/`.

```ts
'use server';

export async function createDeskBooking(input: unknown) {
  const session = await requirePermission('booking:write');   // 1. permission
  const data = deskBookingSchema.parse(input);                // 2. validate
  // 3. NEVER trust an amount from the client — resolve it server-side (R5)
  const result = await createBooking({ ...data, createdBy: session.userId });
  revalidatePath('/admin/calendar');
  return result;
}
```

Non-negotiable:

- **Permission is checked inside the action**, not only on the page. An action is
  an HTTP endpoint; page-level checks do not protect it.
- **Validate with zod**, using the same schema the form uses.
- **Never accept a price, amount, or court rate from the client.**
- Return a typed result the form can render — never throw a raw error to the UI.

## Forms

`react-hook-form` + `zod`, schema shared with the action.

- The submit button disables and relabels during submit (`04-states.md`).
- On failure, **the form keeps every typed value**. This is the one that gets
  missed and it is the one that loses staff trust.
- `useOptimistic` only where a failure is harmless — never on booking creation,
  where "just taken" is a real and common outcome.

## Live-ish data

The Now board and the day grid go stale while someone stares at them.

- Poll every 30s (Now) and 60s (day grid) via `router.refresh()`.
- **Never re-sort or scroll-jump** a view someone is looking at. Show a quiet
  line: *"Updated just now · 1 new booking"*.
- No websockets. Polling is enough for one venue and one less thing to run.

## Formatting boundary

Money is integer paise everywhere (R4) until `lib/format.ts`. Times are UTC
until the same boundary, then rendered in the venue's timezone from
`venue_settings` — never a hardcoded `Asia/Kolkata` in a component.

```
ACCEPTANCE
- no component imports the database driver
- no client component receives a raw bookings array
- every server action calls requirePermission before touching data
- posting a crafted amount to a booking action stores the resolved price
- a failed submit leaves the form populated
```
