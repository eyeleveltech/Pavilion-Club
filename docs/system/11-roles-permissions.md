---
id: 11-roles-permissions
title: Roles, permissions, audit
status: draft
audience: ai-agent
depends_on: [04-data-model]
---

# 11 — Roles, permissions, audit

Three staff roles. Customers are not users — they authenticate by phone + OTP
and hold a `sessions.customer_id`, never a role.

## Permission strings

| Permission | Grants |
|---|---|
| `booking:read` | See the calendar and bookings |
| `booking:write` | Create, reschedule, cancel bookings; take payment |
| `booking:backdate` | Create a booking in the past |
| `pricing:write` | Edit price rules, courts, opening hours |
| `pricing:override` | Override a price on a single booking (reason required) |
| `reports:read` | Dashboard, occupancy, daily close |
| `reports:export` | Download Excel exports |
| `revenue:read` | Statement, settlements, partner balances |
| `staff:manage` | Add, edit, deactivate users |
| `partner:manage` | Add partner channels, issue and revoke API keys |
| `settings:write` | Venue settings |
| `settlement:writeoff` | Write off a partner debt |

## The matrix

| Permission | Owner | Manager | Desk |
|---|---|---|---|
| `booking:read` | yes | yes | yes |
| `booking:write` | yes | yes | yes |
| `booking:backdate` | yes | yes | no |
| `pricing:write` | yes | no | no |
| `pricing:override` | yes | yes | no |
| `reports:read` | yes | yes | today only |
| `reports:export` | yes | yes | no |
| `revenue:read` | yes | yes | no |
| `staff:manage` | yes | no | no |
| `partner:manage` | yes | no | no |
| `settings:write` | yes | no | no |
| `settlement:writeoff` | yes | no | no |

**Desk staff see today only.** They can run the counter and cannot see the
month's revenue or export the customer list.

## Enforcement

- Checked **server-side on every request**, in the page loader or route handler.
  Hiding a nav link is presentation, not security.
- One helper, `requirePermission(session, 'booking:write')`, used everywhere.
  It throws; it does not return a boolean callers can forget to check.
- API keys carry **scopes**, never permissions, and can never resolve to a user
  session. Separate table, separate middleware — see `08-partner-api.md`.

```
ACCEPTANCE — this test blocks merge
- for every admin route and server action, a desk-role session is rejected
  wherever the matrix says no, with a 403 and no data leaked in the body
- an API key cannot access any admin route
- deactivating a user invalidates their sessions immediately
```

## Staff management

- Removal is **deactivation**, not deletion. `is_active = false`,
  `deactivated_at` set. A user who leaves must not take the record of the money
  they handled with them — `payments.received_by` stays intact.
- Deactivation MUST be confirmed in the UI and MUST be reversible. An
  unconfirmed, unrecoverable staff removal was a real defect in Turf OS.
- The last active owner cannot be deactivated.

## Audit

Every one of these writes an `audit_log` row naming the actor, with `before` and
`after` as JSON:

- booking cancelled, rescheduled, marked no-show
- price overridden (reason mandatory)
- refund issued
- price rule, court, or opening hours changed
- staff added, role changed, deactivated
- API key issued or revoked
- settlement created, marked settled, or written off
- venue settings changed

The audit log is append-only. No update, no delete, no exceptions. It is what
settles the argument when a slot goes missing on a busy evening.
