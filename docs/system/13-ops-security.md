---
id: 13-ops-security
title: Hosting, backup, security
status: draft
audience: ai-agent, devops
---

# 13 — Operations and security

## Hosting

One VPS (4 vCPU / 8–16 GB / NVMe), Docker Compose, Caddy for TLS.

```
caddy      -> TLS, reverse proxy, automatic certificates
web        -> Next.js app
worker     -> sweeper, outbox drain, nightly jobs
postgres   -> PostgreSQL 16+
```

Scheduled jobs in the worker:

| Job | Interval | Does |
|---|---|---|
| Hold sweeper | 30s | `expire_stale_holds()` |
| Message outbox | 15s | Drain queued messages |
| Webhook outbox | 15s | Drain queued partner webhooks |
| Refund drain | 5m | Send pending gateway refunds |
| Completion | Hourly | Mark past confirmed bookings `completed` |
| Reminders | 09:00 IST | Queue same-day reminders |
| Daily summary | 23:45 IST | Owner summary |
| Backup | 02:00 IST | Base backup to off-box storage |

## Backup and restore

- Nightly base backup **plus continuous WAL archiving** to off-box storage
  (Cloudflare R2 or Backblaze). Not the same machine.
- **A restore rehearsal onto a clean box before go-live.** An untested backup is
  not a backup. Repeat it quarterly.
- A written runbook: restore-to-new-server, with an agreed recovery time.
- Record who owns the server day to day.

One VPS is one point of failure, and Saturday 8pm is simultaneously the peak and
the worst possible time to be recovering.

```
ACCEPTANCE — blocks go-live
- a restore rehearsal brings the database back on a clean box, verified by
  comparing booking counts and a money total against the source
```

## Security

### Two database roles

The application must not be able to drop a table or delete a booking. This is
one of the cheapest controls available and it survives any application bug.

```sql
-- Owns the schema. Used ONLY by the migration runner, never by the app.
CREATE ROLE pavilion_migrate LOGIN PASSWORD '...';

-- What DATABASE_URL points at.
CREATE ROLE pavilion_app LOGIN PASSWORD '...';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO pavilion_app;

-- Money and history are append-and-amend, never destroy.
REVOKE DELETE ON bookings, payments, refunds, settlements, audit_log
  FROM pavilion_app;
-- The audit log is append-only, enforced by the grant rather than by a promise.
REVOKE UPDATE ON audit_log FROM pavilion_app;
```

A cancelled booking is `status = 'cancelled'`, never a deleted row. The schema
now enforces that rather than trusting every future code path to remember.

### Hashing — different jobs, different algorithms

Getting this backwards is a classic and costly mistake.

| Secret | Algorithm | Why |
|---|---|---|
| Staff passwords | **argon2id**, slow by design | Checked once per login. Slowness is the protection |
| API keys | **SHA-256 + pepper**, fast, constant-time compare | Checked on *every* partner request. argon2 here would cap throughput at a few requests a second |
| OTP codes | SHA-256 + pepper | Same reasoning, and they live 5 minutes |
| Session tokens | SHA-256 | Store the hash, never the token |

The pepper lives in `API_KEY_PEPPER`, outside the database — so a stolen database
dump alone does not yield working keys.

### Login and session

- **Throttle and lock out.** 5 failed attempts for one identifier in 15 minutes
  locks it for 15 minutes, counted in `login_attempts`. Per-IP limiting on top.
- **Rotate the session token** on login and on any privilege change.
- **Absolute expiry** of 30 days and an idle timeout of 12 hours, whichever
  comes first. Desk terminals get left logged in.
- Deactivating a user MUST delete their sessions in the same transaction.
- Cookies `httpOnly`, `secure`, `sameSite=lax`.

### Personal data

- **Scrub PII from error reports.** Sentry captures request bodies by default,
  which means customer phone numbers leave the country in plaintext. Configure
  `beforeSend` to redact `phone`, `email`, `name`, `otp`, and every `Authorization`
  header. Do this before the first deploy, not after the first incident.
- **Never log a full phone number.** Mask to the last four digits in application
  logs. The UI shows it in full — the desk needs it — but logs do not.
- **Erasure on request:** set `customers.anonymised_at`, replace `phone` with a
  one-way hash, null `name` and `email`. Bookings and payments survive intact for
  tax purposes, and repeat-customer matching still works on the hash.
- Full-disk encryption on the VPS. Backups encrypted **before** they leave the box.

### The rest

- HTTPS everywhere, HSTS on. HTTP redirects to HTTPS.
- Secrets outside the repository and outside the database. `API_KEY_PEPPER` and
  `SESSION_SECRET` are the highest-value; plan rotation.
- Rate limit OTP send and verify, login, booking creation per IP, and every
  `/api/v1` endpoint.
- Every gateway webhook signature verified before the body is trusted. Store the
  raw event, then process.
- No card data ever touches our servers. Card at the desk is the venue's own
  machine.
- Parameterised SQL only — Drizzle for CRUD, tagged templates for raw SQL. No
  string interpolation into a query, anywhere.
- Permission checked server-side on every route (see `11-roles-permissions.md`).
- Dependency audit in CI; fail the build on a known critical advisory.

## Monitoring

- Sentry for errors, with a release marker on each deploy.
- Uptime monitoring on `/` and `/api/health`, alerting to a phone.
- Alert conditions worth waking someone for: webhook handler failing, outbox
  dead-letter growing, database connections exhausted, disk above 80%.
- A weekly reconciliation job: gateway settlements against `payments` rows,
  reporting any mismatch.

## Pre-go-live checklist

Each is a single observable event. None of them is "the code looks right".

```
- [ ] A real gateway test payment creates an order, fires a webhook to our
      endpoint, passes signature verification, and confirms exactly one booking
- [ ] A duplicate delivery of that same webhook changes nothing
- [ ] A real refund on that booking returns money and marks the refund sent
- [ ] A real WhatsApp confirmation arrives on a phone
- [ ] A deliberately failed WhatsApp send falls back to SMS and the SMS arrives
- [ ] A real outbound webhook reaches a receiver that verifies our signature
- [ ] The partner completes a booking end to end against sandbox keys
- [ ] A restore rehearsal brings the database back on a clean box
- [ ] The 100-concurrent-bookings test passes in CI
- [ ] The permission matrix test passes in CI
```

Until every line above is ticked, the honest description of the product is
"the desk works; the money path is untested". Do not describe the payment path
as working to the client before then.
