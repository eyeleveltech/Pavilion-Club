---
id: fe-10-build-guide
title: Frontend build guide
status: active — brand received 2026-09-02
audience: ai-agent, developer
supersedes: the neutral placeholder tokens in 02-design-system.md
---

# Frontend build guide

Everything needed to build the frontend, in build order. Brand facts from
`Brand Guidelines_PC_Apr 26.pdf`, screens from `06-screens.md` and
`../system/06-admin-console.md`.

Follow this top to bottom. Each step is buildable and testable on its own.

---

# 1. Brand facts

## 1.1 Colours — exact values

**Primary**

| Name | Hex | RGB |
|---|---|---|
| MidnightBlue | `#0f1e2e` | 15, 30, 46 |
| DarkKhaki (gold) | `#c7a26a` | 199, 162, 106 |

**Secondary**

| Name | Hex | RGB |
|---|---|---|
| Ivory | `#F9F6ED` | 249, 246, 237 |
| White | `#ffffff` | 255, 255, 255 |
| Black | `#0c0c0b` | 12, 12, 11 |

## 1.2 The contrast rule — read before using gold

| Combination | Ratio | Verdict |
|---|---|---|
| Gold text on white | ~2.2:1 | **FAILS.** Never use |
| Gold text on ivory | ~2.1:1 | **FAILS.** Never use |
| Gold text on MidnightBlue | ~7.5:1 | Passes — the brand's signature pairing |
| MidnightBlue text on gold | ~6.5:1 | Passes — use for gold buttons |
| MidnightBlue text on ivory | ~15:1 | Passes — default body text |
| White text on MidnightBlue | ~16:1 | Passes |

**Rules that follow:**

1. Gold is **never** text on a light background. Not for links, labels, prices,
   or headings.
2. Gold **is** used as: a fill (buttons, chips, the dark sidebar's active state),
   a hairline rule, an icon on dark, and text on MidnightBlue.
3. A gold button carries **MidnightBlue** text, never white.
4. Gold is a **brand accent, never a data colour.** It never encodes a channel,
   a status, or a value in a chart.

## 1.3 Typography

**Primary — Montserrat.** Google Fonts, free, webfont-licensed.
Weights used: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap">
```

**Secondary — Formale Script.** Used in the logo only.

> **Do not license or load Formale Script as a webfont.** It appears only inside
> the wordmark and monogram, which ship as SVG with outlined paths. Loading a
> licensed script face for two words on a page is cost and weight for nothing.
> If a designer asks for script text on a page, the answer is an SVG.

**Numbers.** Money and time columns need `font-variant-numeric: tabular-nums`.

```
STEP: verify Montserrat's tabular figures render aligned in a money column
before Phase 1 ships. If they do not, apply a mono fallback to `.num` only:
font-family: 'IBM Plex Mono', monospace — do NOT change the body face.
```

## 1.4 Logo assets required from the design team

| File | Use |
|---|---|
| `wordmark-navy.svg` | On ivory and white grounds |
| `wordmark-ivory.svg` | On MidnightBlue grounds |
| `wordmark-gold.svg` | On MidnightBlue, for hero and footer |
| `monogram-navy.svg` | Tight spaces on light |
| `monogram-gold.svg` | Tight spaces on dark |
| `favicon.svg` + 512px PNG | Browser tab, PWA icon |

**Approved lockups only.** The wordmark is centre-aligned, three lines:
*The* (script) / **PAVILION** (serif caps, letterspaced) / *Club* (script).
Left-aligned or reflowed variants are shown as forbidden in the guidelines.

**Safezone:** clear space equal to the cap height of `PAVILION` on all four
sides. Nothing — no text, no border, no image edge — inside it.

**Never:** recolour, stretch, rotate, add a stroke, or thicken the monogram.

---

# 2. Tokens

Create `apps/web/src/app/globals.css`. **This file is the only place a hex value
may appear.**

```css
:root {
  /* ---- Brand ---- */
  --navy:        #0f1e2e;
  --gold:        #c7a26a;
  --ivory:       #F9F6ED;
  --white:       #ffffff;
  --black:       #0c0c0b;

  /* ---- Grounds ---- */
  --bg:          var(--ivory);    /* app background */
  --surface:     var(--white);    /* cards, tables, panels */
  --surface-2:   #F3EEE1;         /* table headers, subtle fills */
  --surface-dark: var(--navy);    /* sidebar, footer, hero */

  /* ---- Text ---- */
  --ink:         var(--navy);
  --ink-soft:    #4A5765;
  --ink-faint:   #8A939E;
  --ink-on-dark: #F2EFE6;
  --ink-on-gold: var(--navy);

  /* ---- Lines ---- */
  --border:        #E4DFD0;
  --border-strong: #CFC7B2;
  --border-dark:   #22344A;   /* on navy grounds */

  /* ---- Accent (brand, never data) ---- */
  --accent:      var(--gold);
  --accent-soft: #F0E4CE;
  --accent-ink:  var(--navy);

  /* ---- Semantic. Chosen to be clearly distinct from brand gold ---- */
  --ok:      #2E6F4E;  --ok-soft:      #E2F0E8;
  --warn:    #B85C1E;  --warn-soft:    #FBE8D9;
  --danger:  #A33124;  --danger-soft:  #F8E3DF;
  --info:    #2A5B8C;  --info-soft:    #E3ECF6;

  /* ---- Channels. Gold is deliberately absent ---- */
  --ch-website:  #0f1e2e;
  --ch-walkin:   #7C93AB;
  --ch-phone:    #A9AFB6;
  --ch-partner:  #8C5A3C;   /* Turf Town — distinct from brand gold on purpose */
  --ch-admin:    #5C6874;

  /* ---- Spacing, 4px base ---- */
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px;
  --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px;

  --radius:    6px;
  --radius-lg: 10px;   /* sheets and modals only */

  --font: 'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif;
}
```

**Why Turf Town is not gold:** gold is the brand. If the partner's bookings were
gold, every Turf Town booking on the day grid would read as "Pavilion Club's own"
at a glance, which is the opposite of the point.

**No dark mode** for the admin console. It runs under venue lighting and a
second theme doubles the review surface. The public site is already dark in its
hero and footer sections by design.

## 2.1 Type scale

| Role | Size | Weight | Use |
|---|---|---|---|
| Display | 40 / 56px | 700 | Public hero only |
| H1 | 28px | 700 | Public page titles |
| H2 | 20px | 600 | Admin page title, public section |
| H3 | 16px | 600 | Card and group headings |
| Body | 14px | 400 | Everything |
| Data | 13px | 400 | Table cells, slot grid |
| Label | 11px | 600, `0.08em`, uppercase | Column heads, eyebrows |

Public site scales up one step at `lg`. Admin does not — it is a tool.

## 2.2 Tailwind config

```ts
// tailwind.config.ts — map tokens, never redeclare hex
theme: {
  extend: {
    colors: {
      navy: 'var(--navy)', gold: 'var(--gold)', ivory: 'var(--ivory)',
      bg: 'var(--bg)', surface: 'var(--surface)', 'surface-2': 'var(--surface-2)',
      ink: 'var(--ink)', 'ink-soft': 'var(--ink-soft)', 'ink-faint': 'var(--ink-faint)',
      border: 'var(--border)', accent: 'var(--accent)',
      ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)', info: 'var(--info)',
    },
    fontFamily: { sans: ['Montserrat', 'system-ui', 'sans-serif'] },
    borderRadius: { DEFAULT: 'var(--radius)', lg: 'var(--radius-lg)' },
  },
}
```

**Lint rule:** fail the build on any `#rrggbb` inside `.tsx`. Only `globals.css`
may contain hex.

---

# 3. Build order

Do these in sequence. Each is shippable.

```
STEP 1   Project shell        Next.js, Tailwind, shadcn, tokens, fonts, logo
STEP 2   Component kit        buttons, inputs, table, badge, sheet, empty states
STEP 3   /admin/_theme        every component in every state on one page
STEP 4   Admin shell          sidebar, header, bottom tabs, auth
STEP 5   Admin screens        Now, Dashboard, Book, Calendar, Search, Customers
STEP 6   Admin money          Reports, Daily close, Cash
STEP 7   Admin settings       Courts, Pricing, Blackouts, Staff, Partners, Venue
STEP 8   Public shell         header, footer, hero pattern
STEP 9   Public booking       date, time, details, hold, confirmation
STEP 10  Public rest          home, about, contact, my-bookings, legal
STEP 11  PWA + polish         manifest, icons, states audit, a11y audit
```

---

# 4. Component kit — STEP 2

Build these once. Every screen composes them; a screen that invents its own
table or button is a review rejection.

## 4.1 Button

| Variant | Background | Text | Use |
|---|---|---|---|
| **Primary** | `--navy` | white | The one main action per screen |
| **Gold** | `--gold` | `--navy` | Public CTAs — Book now, Continue |
| **Secondary** | transparent, `--border-strong` outline | `--ink` | Cancel, Back |
| **Ghost** | transparent | `--ink-soft` | Tertiary, in-table actions |
| **Danger** | transparent, `--danger` outline | `--danger` | Cancel booking, Remove |

Height 40px (admin), 48px (public). Radius `--radius`. Disabled: 45% opacity,
`cursor: not-allowed`. Loading: spinner replaces label text, button stays the
same width.

## 4.2 Input / Select / Textarea

Label **above**, 11px uppercase `--ink-soft`. Field 40px, `--surface` background,
`--border` 1px. Focus: 2px `--navy` ring, offset 1px. Error: `--danger` border
plus message below in `--danger`.

**`font-size: 16px` on every input** — smaller makes iOS Safari zoom on focus.

## 4.3 Table

Header `--surface-2`, 11px uppercase `--ink-soft`, sticky. Rows 44px,
`--border` bottom hairline. Hover `--surface-2`. Money and time right-aligned
with `tabular-nums`. Wide tables scroll inside their own container.

Below `md` the table becomes stacked cards — never a horizontal scroll.

## 4.4 Badge / chip

Channel chip: 1px border in the channel colour, background at 12% of it, text in
the channel colour, 11px 600. Always shows the channel **name**, never colour
alone.

Status: `PAID` in `--ok`, `UNPAID` in `--warn`, `HELD` in `--info`,
`CANCELLED` in `--ink-faint` struck through.

## 4.5 Sheet, Dialog, Toast, Skeleton

Sheet slides from the right on desktop, **up from the bottom on mobile**.
`--radius-lg` on the leading edge. `Esc`, backdrop tap and swipe-down all close.

Dialog only for destructive confirmation. Toast bottom-right desktop, bottom-full
mobile, 4s.

Skeletons, not spinners. Nothing shown under 300ms.

## 4.6 Empty state

Icon-free. One sentence in `--ink-soft`, one primary button. No illustrations,
no "Oops".

---

# 5. Admin console

Ground `--bg` ivory. Sidebar `--navy`. Cards `--surface` white.

## 5.1 Shell — STEP 4

**Desktop ≥1024px**

- Sidebar 216px, `--surface-dark`, fixed. Monogram gold at top, 32px.
- Nav items: `--ink-on-dark` at 14px. Active item: `--gold` text with a 3px gold
  left bar. Hover: `--border-dark` background.
- Groups labelled `OPS` / `MONEY` / `SETUP` in 10px uppercase `--ink-faint`.
- Header 56px, `--surface`, `--border` bottom. Search box left, user menu right.
- Content max-width 1440px, padding `--s6`.

**Below 1024px** sidebar collapses to icons. **Below 768px** it is replaced by a
bottom tab bar: `Now · Calendar · Book · More`, 56px + `env(safe-area-inset-bottom)`,
`--surface-dark`, active tab gold.

**Landing page by role:** desk → `/admin` Now board. Manager and owner →
`/admin` Dashboard.

## 5.2 Login — `/admin/login`

Full-screen `--navy`. Centred card `--surface`, 400px, `--radius-lg`. Wordmark in
gold above the card. Fields: phone or email, password. Primary button full width.
Error: *"Phone or password is incorrect."* — never say which was wrong.

After 5 failures in 15 minutes: *"Too many attempts. Try again in 15 minutes."*

## 5.3 Now — `/admin` (desk)

**Purpose:** the screen a desk person keeps open all evening. Auto-refreshes 30s.

**Content:**
1. Header: "Now", date, live clock.
2. **ON COURT NOW** — one card per court in play: court, time range, customer
   name and phone, amount, PAID/UNPAID chip. Unpaid cards get a `--warn` left
   edge and a **Take payment** button.
3. **NEXT UP** — the following hour, same card shape. Free courts show a
   **+ Book** button.
4. **LATER TODAY** — compact list, hour and `n of 3 booked`.
5. **TO COLLECT** — total owed today, count, **See them** link.

**UX:** no pagination, no filters, no date picker. It is always now. Updating
must never re-sort or scroll-jump — show *"Updated just now · 1 new booking"*.

## 5.4 Dashboard — `/admin` (manager, owner)

**Content:**
1. Four stat tiles: Bookings today · Collected today · Booked value today ·
   Still owing. Label 11px uppercase, number 28px `tabular-nums`, sub-line 12px.
   **Every tile is a link.**
2. Two wide tiles: Online vs offline (count and value) · Turf Town outstanding.
3. **Next 7 days** — one row per day, label, bar, `38/54`. Bars in `--navy`,
   today's in `--gold`. Each row links to that day.
4. If `no_price` errors exist today: a `--danger-soft` strip above the tiles —
   *"3 bookings were refused because no price is set."*

**UX:** no charts beyond the bars. Every number is clickable through to the rows
behind it.

## 5.5 Book a slot — `/admin/book`

**Purpose:** walk-in. Target under 20 seconds for a returning customer.

**Content, in this order:**
1. Date (defaults today) and court selector.
2. Horizontal strip of that court's hours — free, taken, past. Click to select.
3. **Phone field first.** On a known number: name auto-fills, and a line appears —
   *"Rahul Kumar · 12 bookings · 0 no-shows"*. A blocked customer shows a
   `--danger` banner and the submit button disables.
4. Name.
5. Price from the rules, large. **Override** link reveals a field plus a
   mandatory reason.
6. Payment: two large radio cards, **Cash** and **Card**. Nothing else.
7. Primary button: **Payment received — block slot**.
8. Below, two ghost links: **Block without payment** · **Blackout this slot**.

**UX:** `Enter` submits from anywhere. On success, a toast and the form resets to
the same date and court — the desk usually takes several bookings in a row.

**Never** send an amount from the client. The server recomputes it.

## 5.6 Calendar month — `/admin/calendar`

7-column grid. Each cell: date number, `n bookings` 13px, a 4px fill bar.
Today outlined `--gold` 2px. Past dates `--ink-faint`. Click opens the day.
Header: `‹ September 2026 ›` and a **Today** button.

Nothing else on this screen. It exists to be scanned.

## 5.7 Calendar day — `/admin/calendar/[date]`

**Desktop:** courts across, hours down. Time gutter 64px sticky left, court
headers sticky top. Cells minimum 44px tall.

| Cell state | Appearance |
|---|---|
| Free | `--surface`, hairline border. Hover reveals `+ Book` |
| Booked, paid | Solid channel colour, white text |
| Booked, unpaid | Channel colour 1px outline, transparent fill, amount in `--warn` |
| Held | Dashed outline `--info`, shows minutes remaining |
| Blackout | Diagonal hatch on `--surface-2`, reason on hover |
| Past | 45% opacity, not clickable |

A multi-hour booking is **one cell spanning its rows**, not repeated.
A 2px `--gold` line marks the current time across all courts.
Legend below maps colour to channel name.

**Below 1024px** this becomes a list grouped by hour, opening at the current hour.

## 5.8 Booking panel

Sheet from right (bottom on mobile).

Reference as title. Court, date, time. Customer name and phone (tap to call on
mobile). Channel chip. Amount and payment state.

Actions: **Take payment** · **Reschedule** · **Mark no-show** · **Cancel booking**.

For a Turf Town booking, above Cancel:

> **This was booked through Turf Town.** Cancelling here frees the court but does
> **not** refund the customer. They must cancel in the Turf Town app.

For a booking with no contact details: **+ Add contact details**.

Bottom: **Activity** — the audit log. *"Cancelled by Suresh · 6 Sep 4:12pm · rain"*.

## 5.9 Search — `/admin/search`

One field in the header, `/` focuses it. Searches our reference, **Turf Town's
reference**, phone (full or last 4), and partial name. Results as rows, today
first. Empty query shows today's bookings.

## 5.10 Customers — `/admin/customers`

Table: name, phone, bookings, total spent, no-shows. A customer with 3+ no-shows
shows a `--warn` chip. Blocked customers show a `--danger` chip.

Detail page: contact, stats, notes (editable), **Block / Unblock** with reason,
and full booking history.

## 5.11 Reports — STEP 6

**`/admin/reports/source`** — date range (default this month), one row per
channel: Source, Bookings, Hours, Booked value, Collected, Commission, Net owed,
Status. Totals row. **Export to Excel** primary button.

**`/admin/reports/demand`** — from `booking_attempts`. Rows: slot, booked, turned
away. Turned-away counts of 10+ in `--warn`. A second table of non-demand
failures, with `no_price` highlighted `--danger`.

**`/admin/reports/occupancy`** — heatmap, day of week × hour. Five steps of
`--navy` opacity from 10% to 100%. Numbers listed beneath.

**`/admin/reports/settlements`** — per partner: outstanding, history, **Create
settlement**. Each settled row shows expected vs paid vs variance; a non-zero
variance is `--warn`.

## 5.12 Daily close — `/admin/close`

Date nav. Stat tiles: bookings, collected by method, expected cash. Table of the
day's bookings. **Still owing** section listing unpaid bookings with a Take
payment action on each.

## 5.13 Cash handover — `/admin/cash`

Shows expected cash for the shift. **The declared field renders empty** — never
pre-filled. On submit, variance is shown; a non-zero variance requires a note
before the button enables.

## 5.14 Settings — STEP 7

**Courts** — per court: name, active toggle, slot length, seven weekday rows with
open and close time inputs, `+ add a second period` link. Two bulk buttons:
**Copy Monday to all weekdays**, **Copy this court to all courts**. A live line
below: *"17 slots/day weekdays · 18 weekends · 363/week across 3 courts"*.
On save, if bookings now fall outside hours: list them, warn, allow.

**Pricing** — rules table with scope columns, plus a preview panel showing what a
chosen day and court resolves to, hour by hour.

**Blackouts** — date and time range, reason, **all courts** checkbox.

**Staff** — table with role. Deactivate is confirmed and reversible. The last
active owner cannot be deactivated.

**Partners** — Turf Town card: connection (key prefix, reissue, revoke, last
call, requests today), commission (one percentage field with a live worked
example), money (outstanding, last settlement).

**Venue** — name, timezone, business day start, hold TTL, booking window,
cancellation policy, **online payment mode** (`pay_at_venue` / `gateway` / `off`),
max unpaid per customer.

## 5.15 Theme preview — `/admin/_theme` — STEP 3

Every component in every state on one page. Owner only, not in the nav. Build it
**before** the screens: it is how a token change is verified in one look.

---

# 6. Public site

Ground ivory. Hero and footer `--navy`. Gold for CTAs.

## 6.1 Shell — STEP 8

**Header** 72px, `--surface` with `--border` bottom, sticky. Wordmark navy left,
34px tall. Nav right: Book · About · Contact · My bookings. Primary gold button
**Book a court**. Below `md`: monogram left, hamburger right, full-screen drawer.

**Footer** `--navy`. Wordmark gold. Three columns: address and map link, hours,
legal links. Bottom line: `© 2026 The Pavilion Club`.

## 6.2 Home — `/`

1. **Hero** — full-bleed court photograph, `--navy` overlay at 55%. Wordmark in
   gold. One line of copy. Gold **Book a court** button. Below it, a live line:
   *"3 courts free this evening"*.
2. **Today's availability** — the next six free slots as cards: time, price,
   court count. Each links into `/book` pre-selected.
3. **The club** — three photographs, short paragraphs.
4. **Hours and location** — the real hours table, map, phone.
5. **Footer CTA** — navy band, gold button.

## 6.3 Booking — `/book` — STEP 9

Four steps. Each step is a URL, so back works and refresh loses nothing.

**Step 1 — date** · `/book`
Month calendar, max 420px. Under each date a dot: `--ok` free, `--warn` filling,
none if full. Full dates struck through and unclickable. Past and beyond-30-days
greyed. Footer line: *"Open 6:00 am – midnight"*.

**Step 2 — time** · `/book?date=`
Back link, date title, `3 courts` line. Groups **MORNING / AFTERNOON / EVENING**.
Each row 56px: time range left (`19:00 – 20:00`), price and `2 courts free`
right. Booked rows greyed with `Booked`, still visible. Selected rows get a
`--navy` fill with white text. Opens scrolled to the next free hour.

**Step 3 — summary bar** — sticky bottom, appears on first selection.
`Sat 6 Sep · 19:00 – 21:00 · 2 hours` / `Court 2 assigned · change` / total right
/ gold **Continue**.

**Step 4 — details** · `/book/details?…`
Phone, then **Send code**, then a 6-digit OTP field. Name. Then **Confirm
booking**. A 10-minute countdown appears once the hold exists.

**Confirmation** · `/booking/[reference]`
Big reference, court, date, time, amount. In `pay_at_venue` mode a `--accent-soft`
panel: *"Pay ₹2,400 at the venue."* Add-to-calendar link, directions link.

**Slot taken mid-flow:**
> **19:00 – 20:00 was just taken.** Still free at that time: …

Never an error dialog. Two alternatives offered, one tap each.

## 6.4 My bookings — `/my-bookings`

Phone + OTP. Upcoming and past sections. Each card: reference, court, date, time,
amount, status. **Cancel** shows the refund quote before confirming.

## 6.5 About, Contact, Legal — STEP 10

**About** — the club, the courts, facilities, photographs.
**Contact** — address, embedded map, phone (tap to call), hours table.
**Legal** — `/terms`, `/privacy`, `/cancellation-policy`. Content specified in
`../system/07-public-site.md` §Legal pages. Required before Razorpay approval.

---

# 7. Every screen needs these — STEP 11

| State | Rule |
|---|---|
| Loading | Skeleton in the content region; shell renders instantly; nothing under 300ms |
| Empty | One sentence + one action. No illustration |
| No results | Different message, plus a widening action |
| Error | Inline; **never lose typed form data** |
| Denied | *"You don't have access to this page."* + Back |

## 7.1 Mobile-as-app checklist

- `font-size: 16px` on every input
- `100dvh`, never `100vh`
- `env(safe-area-inset-bottom)` on the tab bar and summary bar
- `:active` states, never `:hover`
- `-webkit-tap-highlight-color: transparent`
- `inputmode="numeric"` and `autocomplete="tel"` on phone fields
- 44px minimum tap target, 56px for booking rows

## 7.2 PWA

`manifest.json`: name `The Pavilion Club`, short name `Pavilion`,
`start_url: /admin`, `display: standalone`, `background_color: #F9F6ED`,
`theme_color: #0f1e2e`, monogram icons at 192/512 plus maskable.

**No service worker that caches availability or queues a booking write.**

## 7.3 Accessibility

- Colour is never the only signal — every channel chip carries its name.
- **Gold is never text on a light ground.** See §1.2.
- Visible focus ring on everything.
- The booking flow completable by keyboard alone.
- Slot cells announce *"Court 2, 7pm, booked, Rahul Kumar, 1,200 rupees, unpaid"*.

---

# 8. Definition of done

```
- [ ] No hex colour outside globals.css — lint enforces it
- [ ] Gold appears as text only on navy grounds
- [ ] Montserrat loads; money columns align with tabular figures
- [ ] Logo used only in approved lockups, safezone respected
- [ ] /admin/_theme renders every component in every state
- [ ] Every screen has all five states
- [ ] No horizontally scrolling table below md
- [ ] Booking flow completable one-handed at 360px
- [ ] iOS Safari does not zoom on input focus
- [ ] Installs to home screen, opens without browser chrome
- [ ] axe reports no critical violations on Now, Dashboard, Day, Book
```
