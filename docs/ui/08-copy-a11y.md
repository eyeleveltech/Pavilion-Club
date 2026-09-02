---
id: fe-08-copy-a11y
title: Copy and accessibility
status: draft
audience: ai-agent, designer
---

# Copy

Words are design material here. The people reading them are busy, sometimes
mid-conversation with a customer.

## Voice

Plain, direct, unhurried. Never clever. Never apologetic.

- A control says what happens: **Book slot**, then a toast saying **Booked**.
- Active voice. *"Turf Town refunds this customer"*, not *"the customer will be
  refunded by Turf Town"*.
- Name things the way staff name them. **Court**, **slot**, **booking**,
  **paid**. Not *reservation*, *resource*, *transaction*.

## Never say these

| Avoid | Because | Say |
|---|---|---|
| Revenue | Means three different things here | Collected · Booked value |
| Source | Overloaded | Channel, or the channel's name |
| Reservation | Staff say booking | Booking |
| Are you sure? | States nothing | The actual consequence |
| Oops! Something went wrong | Says nothing, sounds childish | What failed and what to do |
| Delete | We deactivate and cancel; nothing is destroyed | Cancel · Deactivate · Remove |

## Buttons

Verb plus object, or just the verb where obvious.

```
Book slot          Take payment       Create settlement
Payment received — block slot         Add contact details
Copy Monday to all weekdays
```

Never `Submit`, `OK`, or `Yes`. In an `alert-dialog`, the confirm button repeats
the action: **Cancel booking**, not **Confirm**.

Careful with the word *Cancel*: cancelling a **booking** and cancelling a
**dialog** are different. In a booking dialog the dismiss button says **Keep
booking**.

## Confirmations state the consequence

```
Cancel this booking?

Rahul Kumar · Court 2 · Sat 6 Sep 19:00
A refund of ₹1,200 will be issued to the customer.

[ Keep booking ]              [ Cancel booking ]
```

And for a partner booking, the warning replaces the refund line entirely
(`06-screens.md`).

## Errors say what to do

| Bad | Good |
|---|---|
| Invalid input | Enter a 10-digit mobile number |
| Booking failed | That slot was just taken. Pick another? |
| Error 403 | You don't have access to this page. Ask the owner if you need it. |
| Price not found | No price is set for this slot. Add one in Settings → Pricing. |

## Numbers and dates

- Money: `₹1,200` — symbol, thousands separator, no decimals unless there are paise.
- Time: `7:00 pm` in the UI. 24-hour only in settings fields where precision matters.
- Dates: `Sat 6 Sep` in tables, `Saturday 6 September` in headings. Never `06/09/26` — ambiguous.
- Zero is `₹0`, never blank. Blank means unknown; zero means zero.
- Unknown partner amount is `—`, and the column header explains it.

---

# Accessibility

Not a compliance exercise — this runs on a counter machine under venue lighting,
often used quickly.

## Non-negotiable

- **Colour is never the only signal.** Every channel chip carries its name; every
  paid/unpaid state carries the word or the amount. A colour-blind staff member
  must read the grid as well as anyone (P4).
- **Contrast** — 4.5:1 for body text, 3:1 for large text and UI borders. Check
  the amber Turf Town fill specifically; amber on white fails easily.
- **Visible focus ring** on every interactive element. Staff will use `Tab`.
- **Full keyboard operation** of the booking flow — a booking must be completable
  without a mouse.
- **Real semantics.** `<button>` for actions, `<a>` for navigation, `<table>` for
  tables. A clickable `<div>` is a bug.
- **Labels on every input.** Placeholder is not a label.
- **44×44px minimum** tap targets, including slot grid cells.

## Screen reader specifics

- Slot grid cells announce meaningfully: *"Court 2, 7pm, booked, Rahul Kumar,
  1,200 rupees, unpaid"* — not *"cell"*.
- The sheet traps focus, returns it to the trigger on close, and closes on `Esc`.
- Toasts are `aria-live="polite"`. Errors are `assertive`.
- Skeletons carry `aria-busy`.

## Motion

- Respect `prefers-reduced-motion`; disable the sheet slide and any transition.
- Nothing auto-scrolls or reorders while someone is reading it (`04-states.md`).

```
ACCEPTANCE
- the booking flow is completable with keyboard only
- every channel and payment state is identifiable in greyscale
- axe reports no critical violations on Now, Dashboard, Day view, Book a slot
- the amber Turf Town chip passes 4.5:1 against its background
```
