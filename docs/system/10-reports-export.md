---
id: 10-reports-export
title: Reports and Excel export
status: draft
audience: ai-agent, client
depends_on: [04-data-model, 09-money-settlement]
---

# 10 — Reports and export

The client's stated purpose, verbatim:

> *"By end of the month, source-wise they select and export, there should be an
> Excel sheet which they can download and go and ask them, 'this is the booking
> happened through you, give me the money.'"*

Everything in this file exists to make that sentence work.

---

## Source-wise booking report — `/admin/reports/source`

Date range, defaulting to the current calendar month. One row per channel.

| Column | Definition |
|---|---|
| Source | `channels.name` |
| Bookings | count, excluding cancelled |
| Hours | sum of `(ends_at - starts_at)` |
| Booked value | `SUM(bookings.amount_paise)` |
| Collected | `SUM(payments.amount_paise)` for those bookings |
| Commission | `booked value * commission_bps / 10000` |
| Net owed to us | booked value − commission − collected |
| Status | `pending` / `invoiced` / `settled` for partner rows |

A totals row that reconciles. Website, walk-in, phone and each partner appear as
their own line — this is only possible because `bookings.channel_id` and
`api_key_id` are stamped at creation.

```sql
SELECT c.id, c.name, c.kind, c.settles_later, c.commission_bps,
       COUNT(*)                                        AS bookings,
       SUM(EXTRACT(EPOCH FROM (b.ends_at - b.starts_at)) / 3600) AS hours,
       SUM(b.amount_paise)                             AS booked_paise,
       COALESCE(SUM(p.paid_paise), 0)                  AS collected_paise
  FROM bookings b
  JOIN channels c ON c.id = b.channel_id
  LEFT JOIN LATERAL (
        SELECT SUM(amount_paise) AS paid_paise
          FROM payments WHERE booking_id = b.id AND status = 'captured'
  ) p ON true
 WHERE b.business_date BETWEEN $1 AND $2
   AND b.status IN ('confirmed','completed','no_show')
   AND NOT EXISTS (SELECT 1 FROM api_keys k WHERE k.id = b.api_key_id AND k.is_sandbox)
 GROUP BY c.id
 ORDER BY booked_paise DESC;
```

Sandbox bookings are excluded from every revenue report.

---

## The Excel export

`GET /admin/reports/source/export.xlsx?from=&to=&channel_id=`

Generated server-side with SheetJS, streamed to the browser. Filename:
`pavilion-club-<channel-code>-<from>-to-<to>.xlsx`. Permission: `reports:export`.

### Sheet 1 — Summary

The channel table above, plus a header block: venue name, period, generated-at
timestamp, and the total net owed. This is the sheet that gets attached to an
email.

### Sheet 2 — Bookings

One row per booking. This is the evidence that goes to the partner.

| Column | Source |
|---|---|
| Reference | `bookings.reference` |
| Date | `business_date` |
| Start / End | IST, `HH:MM` |
| Court | `courts.name` |
| Customer | `customers.name` |
| Phone | `customers.phone` |
| Source | `channels.name` |
| Their reference | `bookings.partner_reference` |
| Amount | rupees, 2dp — converted from paise at export time |
| Commission | rupees |
| Net owed | rupees |
| Status | booking status |
| Settlement | settlement status |

`MUST` — money is converted from paise to rupees only at the export boundary
(R4). Use a numeric cell with a currency format, never a formatted string;
the client needs to sum the column.

```
ACCEPTANCE
- the Bookings sheet row count equals the Summary sheet booking count
- the Amount column sums to the Summary booked value
- filtering by a single partner exports only that partner's bookings
- opening the file in Excel shows Amount as a summable number, not text
```

---

## Missed demand — `/admin/reports/demand`

Built from `booking_attempts`. Answers the one question occupancy cannot:
**what did people want that they could not get?**

By hour and day of week over a chosen period:

| Slot | Booked | Turned away | |
|---|---|---|---|
| Sat 19:00 | 3 of 3 courts | **37** | ← the case for a 4th court |
| Sat 20:00 | 3 of 3 | 24 | |
| Sat 06:00 | 0 of 3 | 9 | people want an earlier opening |
| Wed 14:00 | 0 of 3 | 0 | genuinely dead, discount it |

A slot that is 100% booked and a slot that is 100% booked with forty people
turned away look identical on the occupancy report. They are completely
different businesses. This report separates them.

Also list, separately, the failures that are **not** demand:

| Reason | Count | Meaning |
|---|---|---|
| `no_price` | 3 | **A real bug.** A price rule is missing |
| `outside_hours` | 12 | People want hours you do not open |
| `blocked` | 2 | Blocked customers being turned away |

`no_price` above zero MUST be surfaced on the dashboard. It means a customer
tried to give the venue money and the system refused.

## Occupancy report — `/admin/reports/occupancy`

Percent filled by day of week and hour, over a chosen period. Rendered as a
heatmap with the underlying numbers listed beneath it.

Built around one sentence an owner can act on: *"your Wednesday afternoons ran
12% for six weeks."* Denominator is capacity from `court_hours` minus blackout
slots, never a hardcoded number.

Default range is the current calendar month, because that is what rent,
salaries and partner invoices all run to. Rolling 4 / 8 / 12 / 26 week windows
are also available.

---

## Settlements — `/admin/reports/settlements`

Per partner: outstanding balance, settlement history, and a **Create settlement**
action for a chosen period. Lifecycle and SQL in `09-money-settlement.md`.

Actions: create, mark invoiced (attaches the export), mark settled (records the
amount and date), write off (owner only, reason required).

---

## Daily close and cash

Specified in `06-admin-console.md` §5 and §6. Both key off `business_date`.

---

## Report rules

- Every report keys off **`business_date`**, never `created_at`. A booking made
  in August for a September game belongs to September.
- Cancelled bookings are excluded from revenue. No-shows are **included** — the
  court was held and the money was taken.
- Sandbox bookings are excluded everywhere.
- Every report states its date range and the timezone on screen and in the export.
- `reports:export` is a separate permission from `reports:read`. Desk staff can
  see today; they cannot download the customer list.
