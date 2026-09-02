---
id: fe-02-design-system
title: Design system
status: NEUTRAL BY DECISION — visual design deferred (2026-09-01)
audience: ai-agent, designer
---

# Design system

## Decision: no visual design work now

Confirmed with the client 2026-09-01. **We are not designing the look of this
product at this stage.** Build everything against the neutral tokens below. The
theme is replaced in full at a later date.

This is not a placeholder we hope to get away with — it is a decision, and the
rules in this file exist to make the later swap genuinely cheap.

## What a later theme change can replace — all of it

| Changeable by editing tokens alone | |
|---|---|
| Every colour | brand, neutrals, semantic, channel colours |
| Typeface | family, and the whole size and weight scale |
| Spacing | the 4px scale, so density changes globally |
| Corner radius | one value, everywhere |
| Borders and shadows | |
| Logo | one SVG file |

Nothing above requires touching a component, a screen, or any logic.

## What a theme change does NOT cover

Being straight about the boundary now avoids an argument later.

| Not a theme change | What it actually is |
|---|---|
| Moving where things sit on a page | Layout work |
| Adding or removing a screen | Scope change |
| Changing the booking flow (date → time) | UX redesign |
| Turning the day grid into something else | Component rebuild |

**Look** is free later. **Structure** is not. If the client may want a different
layout, that conversation is cheaper now than after Phase 1.

## The five rules that keep the swap cheap

Enforced in review, and the first two in CI.

1. **No hex colour in any component file.** Only `var(--…)` or a Tailwind class
   bound to a token. A lint rule fails the build on a raw hex in `.tsx`.
2. **No hardcoded font size, weight, or spacing.** Use the scale.
3. **shadcn components are restyled through tokens only** — never by editing
   colour values inside `components/ui/`.
4. **Channel colours come from the database** (`channels.colour_hex`), not from
   CSS. The owner can already change them without a deploy.
5. **A theme preview page exists** — see below.

## The theme preview page — `/admin/_theme`

A single internal page rendering every component in every state: buttons, tables,
badges, the slot grid with all six cell states, forms with errors, empty states,
toasts, the stat tile.

Its only job: **swap the token file, open one page, and see whether anything
broke.** Without it, verifying a theme change means clicking through twenty
screens and missing three.

Not linked in the nav. Owner role only.

```
ACCEPTANCE — proves the swap works
- changing only the token file visibly changes every screen
- no .tsx file contains a hex colour
- /admin/_theme renders every component and every state on one page
```

---

Everything below is the neutral starting point. It is deliberately plain.

## Tokens

```css
:root {
  /* Neutrals — slight green bias so they read as chosen, not default */
  --bg:            #F7F8F6;   /* app background */
  --surface:       #FFFFFF;   /* cards, tables, panels */
  --surface-2:     #EEF1EC;   /* table headers, subtle fills */
  --border:        #DDE3DB;
  --border-strong: #BCC6BA;
  --ink:           #12201C;   /* primary text */
  --ink-soft:      #4E605A;   /* secondary text, labels */
  --ink-faint:     #7E8E88;   /* placeholders, disabled */

  /* Brand — PLACEHOLDER until the design team delivers */
  --brand:         #0D5F52;
  --brand-soft:    #DEEBE6;
  --brand-ink:     #FFFFFF;   /* text on brand */

  /* Semantic — system state ONLY. Never reused for a channel (P4) */
  --ok:      #1E7A4B;   --ok-soft:      #E0F0E7;
  --warn:    #9A6B12;   --warn-soft:    #FAEFD8;
  --danger:  #A03325;   --danger-soft:  #F8E4E0;
  --info:    #2A5B8C;   --info-soft:    #E2ECF6;

  /* Spacing — 4px base */
  --s1: 4px;  --s2: 8px;  --s3: 12px; --s4: 16px;
  --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px;

  --radius: 6px;        /* one radius everywhere. No rounded-2xl cards */
}
```

Dark mode is **not** in scope for the admin console — it is used under venue
lighting, and a second theme doubles the review surface for no operational gain.
Revisit only if staff ask.

## Type

One family, four sizes. The admin is data, not editorial.

| Role | Size / weight | Used for |
|---|---|---|
| Page title | 20px / 600 | One per screen |
| Section | 15px / 600 | Card and group headings |
| Body | 14px / 400 | Everything |
| Data | 13px / 400 | Table cells, slot grid |
| Label | 11px / 600, `0.06em`, uppercase | Column heads, eyebrows |

**`font-variant-numeric: tabular-nums` on every money and time column.** Without
it, amounts in a column do not line up and the eye cannot scan them.

Typeface: system stack until the brand delivers, then whatever they specify —
provided it has a real number set and a licence.

## Channel colours (P4 — hue means source)

Stored in `channels.colour_hex`, so these are seed values the owner can change,
not constants in code.

| Channel | Hue | Swatch |
|---|---|---|
| Website | Teal | `#0D5F52` |
| Walk-in | Pale teal | `#CFE3DC` |
| Phone | Slate | `#9AA8A3` |
| **Turf Town** | **Amber** | `#B5822A` |

Amber for the partner is deliberate: it is the one channel whose money is not
ours yet, so it should read as different at a glance across the whole day grid.

## Payment state (P4 — fill means paid)

| State | Treatment |
|---|---|
| **Paid** | Solid fill in the channel hue, white text |
| **Unpaid** | Outlined in the channel hue, transparent fill, amount in `--warn` |
| **Held** | Dashed outline, muted — expires shortly |
| **Partner (unpaid to us)** | Solid amber, small `—` where an amount would sit |
| **Cancelled** | Struck through, `--ink-faint`, only in history views |

A person must be able to tell paid from unpaid from across the counter, without
reading the amount.

## shadcn components — what to use for what

Use these; do not invent parallel ones.

| Job | Component |
|---|---|
| Lists of bookings, reports | `table` |
| Booking detail, add contact | `sheet` (side panel) — not `dialog` |
| Destructive confirm | `alert-dialog` |
| All forms | `form` + `input` + `select` + `react-hook-form` + `zod` |
| Date picker | `popover` + `calendar` |
| Status and channel chips | `badge`, restyled to the fill rules above |
| Save confirmations | `sonner` toast |
| Report periods, partner detail | `tabs` |
| Loading | `skeleton` |

**The slot grid and the month calendar are custom.** shadcn's `calendar` is a
date picker. Do not try to bend it into a booking sheet — see `03-patterns.md`.

## Brand handover

When the design team delivers:

1. Replace `--brand*` and, if they specify them, the neutrals.
2. Add the logo as SVG in two versions (full colour, single colour).
3. Set the typeface in one place.
4. Court photography is used **only on the public site**. None in the admin.

Nothing else should need to change. If a brand swap requires touching component
files, the tokens were bypassed somewhere — that is a bug.
