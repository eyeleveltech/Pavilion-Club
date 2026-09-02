---
id: 04-data-model
title: Data model
status: draft
audience: ai-agent
priority: load-before-any-schema-or-query-work
---

# 04 — Data model

Complete schema. The DDL here is the specification, not illustration. Migrations
are numbered, forward-only, plain SQL in `db/migrations/`.

## Migration order

| File | Contains |
|---|---|
| `0001_foundation.sql` | extensions, `venue_settings`, `courts`, `court_hours`, `channels`, `users`, `customers` |
| `0002_bookings.sql` | `price_rules`, `bookings`, the exclusion constraint, `expire_stale_holds()` |
| `0003_money.sql` | `payments`, `refunds`, `settlements`, `cash_handovers` |
| `0004_partner.sql` | `api_keys`, `webhook_outbox` |
| `0005_ops.sql` | `audit_log`, `blackouts`, `message_outbox`, `otp_codes`, `sessions` |

---

## 0001 — Foundation

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- required by the exclusion constraint
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()

-- Single-row settings. Single-tenant by decision D1, so venue-wide values live
-- here rather than in a tenants table.
CREATE TABLE venue_settings (
  id                        smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name                      text NOT NULL,
  timezone                  text NOT NULL DEFAULT 'Asia/Kolkata',
  -- The hour a business day starts. A booking at 00:30 reports against the
  -- previous calendar date. See 05-booking-engine.md, Business date.
  business_day_start_hour   smallint NOT NULL DEFAULT 5 CHECK (business_day_start_hour BETWEEN 0 AND 12),
  hold_ttl_minutes          smallint NOT NULL DEFAULT 10,
  booking_window_days       smallint NOT NULL DEFAULT 30,
  cancellation_cutoff_hours smallint NOT NULL DEFAULT 24,
  cancellation_refund_pct   smallint NOT NULL DEFAULT 100 CHECK (cancellation_refund_pct BETWEEN 0 AND 100),

  -- How the public website takes money. The gateway is deferred (Q20), so the
  -- site launches on 'pay_at_venue' and flips to 'gateway' with one settings
  -- change once Razorpay is live. Also the switch to reach for if the gateway
  -- ever goes down on a Saturday evening.
  --   gateway       -> hold, pay online, webhook confirms  (R3)
  --   pay_at_venue  -> hold, OTP verify, confirm unpaid, settle at the desk
  --   off           -> no public booking at all; desk and partners only
  online_payment_mode       text NOT NULL DEFAULT 'pay_at_venue'
    CHECK (online_payment_mode IN ('gateway','pay_at_venue','off')),

  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE courts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  slot_minutes smallint NOT NULL DEFAULT 60 CHECK (slot_minutes IN (30, 60)),
  sort_order   smallint NOT NULL DEFAULT 0,
  is_bookable  boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Opening hours as minutes from midnight. close_minutes > 1440 means the court
-- runs past midnight: 06:00 to 02:00 is open=360, close=1560. This is normal,
-- not an edge case.
--
-- The key is (court, weekday, open_minutes), NOT (court, weekday) — so a day
-- can have MORE THAN ONE opening period. A venue that shuts midday for cleaning
-- or heat is two rows: 06:00-11:00 and 16:00-23:00. Costs one column in the key
-- now; adding it later would mean migrating live opening hours. The admin UI
-- shows a single period by default and only reveals "add a second period" when
-- asked, so the capability is invisible until it is needed.
CREATE TABLE court_hours (
  court_id      uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  weekday       smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0 = Sunday
  open_minutes  smallint NOT NULL CHECK (open_minutes BETWEEN 0 AND 1439),
  close_minutes smallint NOT NULL CHECK (close_minutes BETWEEN 1 AND 1800),
  PRIMARY KEY (court_id, weekday, open_minutes),
  CHECK (close_minutes > open_minutes)
);

-- Two periods on the same day must not overlap.
ALTER TABLE court_hours ADD CONSTRAINT court_hours_no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    weekday  WITH =,
    int4range(open_minutes, close_minutes, '[)') WITH &&
  );

-- R6: every booking source is a row here. Never a code branch.
CREATE TYPE channel_kind AS ENUM ('website', 'desk', 'phone', 'admin', 'partner');

CREATE TABLE channels (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE,           -- website, walkin, turftown
  name           text NOT NULL,                  -- shown on the calendar and reports
  kind           channel_kind NOT NULL,
  colour_hex     text NOT NULL DEFAULT '#0D5F52',
  is_online      boolean NOT NULL,               -- drives the dashboard online/offline split
  settles_later  boolean NOT NULL DEFAULT false, -- true = partner receivable, no payment row at booking

  -- Their commission, if they have one. We do NOT model how they calculate it —
  -- that is their arithmetic. This single number exists only so the settlement
  -- screen can show an expected figure to check their payment against. Leave it
  -- at 0 and the report shows gross, which is still enough to invoice them.
  commission_bps integer NOT NULL DEFAULT 0 CHECK (commission_bps BETWEEN 0 AND 10000),

  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

INSERT INTO channels (code, name, kind, is_online, colour_hex) VALUES
  ('website', 'Website', 'website', true,  '#0D5F52'),
  ('walkin',  'Walk-in', 'desk',    false, '#DEEBE6'),
  ('phone',   'Phone',   'phone',   false, '#B6C2B8'),
  ('admin',   'Admin',   'admin',   false, '#7C8C86');

CREATE TYPE user_role AS ENUM ('owner', 'manager', 'desk');

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  phone          text NOT NULL UNIQUE,           -- E.164, +91XXXXXXXXXX
  email          text UNIQUE,
  password_hash  text,
  role           user_role NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz
);

-- Phone is the customer identity. A walk-in regular must not be recreated
-- every visit, so the desk screen matches on phone before inserting.
CREATE TABLE customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL UNIQUE,
  name        text,
  email       text,
  notes       text,
  created_via uuid REFERENCES channels(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 0002 — Bookings

```sql
-- Price for one slot_minutes block. NULL in a scope column means "any".
-- Resolution algorithm: 05-booking-engine.md, Pricing.
CREATE TABLE price_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  court_id     uuid REFERENCES courts(id) ON DELETE CASCADE,  -- NULL = all courts
  weekdays     smallint[],                                    -- NULL = all days
  from_minutes smallint,                                      -- NULL = all day
  to_minutes   smallint,
  price_paise  integer NOT NULL CHECK (price_paise >= 0),
  priority     smallint NOT NULL DEFAULT 0,
  valid_from   date,
  valid_to     date,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (from_minutes IS NULL OR to_minutes > from_minutes)
);

CREATE TYPE booking_status AS ENUM ('held','confirmed','completed','cancelled','no_show');
CREATE TYPE cancelled_by  AS ENUM ('customer','desk','partner','system_expiry','system_admin');

CREATE TABLE bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             text NOT NULL UNIQUE,   -- human readable, e.g. PC-8FK2QD

  court_id              uuid NOT NULL REFERENCES courts(id)     ON DELETE RESTRICT,
  customer_id           uuid          REFERENCES customers(id)  ON DELETE SET NULL,
  channel_id            uuid NOT NULL REFERENCES channels(id)   ON DELETE RESTRICT,
  -- Which partner key created it. This column is what makes the source-wise
  -- invoice in 10-reports-export.md possible.
  api_key_id            uuid          REFERENCES api_keys(id)   ON DELETE SET NULL,

  starts_at             timestamptz NOT NULL,
  ends_at               timestamptz NOT NULL,
  -- Written by the application, NOT generated: AT TIME ZONE is STABLE, not
  -- IMMUTABLE, so Postgres rejects it inside GENERATED ALWAYS AS.
  business_date         date NOT NULL,

  status                booking_status NOT NULL DEFAULT 'held',
  expires_at            timestamptz,            -- set while status = held

  -- R5: recomputed server-side, snapshotted here, never read from the request.
  amount_paise          integer NOT NULL CHECK (amount_paise >= 0),
  price_rule_id         uuid REFERENCES price_rules(id) ON DELETE SET NULL,
  price_override_reason text,

  partner_reference     text,      -- the partner's own booking or payment id
  idempotency_key       text,
  settlement_id         uuid,      -- FK added in 0003, after settlements exists

  created_by            uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  confirmed_at          timestamptz,
  cancelled_at          timestamptz,
  cancelled_by          cancelled_by,
  cancel_reason         text,

  CHECK (ends_at > starts_at),
  CHECK (status <> 'held' OR expires_at IS NOT NULL),
  CHECK (price_override_reason IS NULL OR length(price_override_reason) >= 3)
);
```

### The constraint that prevents double booking (R2)

```sql
-- The single most important line in the schema.
-- The bounds matter: a booking ending 19:00 and one starting 19:00 do NOT
-- overlap, because the range is half-open.
-- The WHERE clause matters too: a cancelled booking must stop blocking.
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('held', 'confirmed'));
```

### Indexes

```sql
CREATE UNIQUE INDEX bookings_idempotency
  ON bookings (channel_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX bookings_partner_ref
  ON bookings (channel_id, partner_reference) WHERE partner_reference IS NOT NULL;

CREATE INDEX bookings_business_date ON bookings (business_date, status);
CREATE INDEX bookings_channel_date  ON bookings (channel_id, business_date);
CREATE INDEX bookings_court_starts  ON bookings (court_id, starts_at);
CREATE INDEX bookings_expiring      ON bookings (expires_at) WHERE status = 'held';
CREATE INDEX bookings_customer      ON bookings (customer_id, starts_at DESC);
```

### The sweeper

An expired hold still blocks, because the exclusion constraint cannot see
`expires_at`. Run this every ~30s from the worker. Correctness does **not**
depend on the schedule — see the `23P01` retry in `05-booking-engine.md`.

```sql
CREATE OR REPLACE FUNCTION expire_stale_holds() RETURNS integer AS $fn$
DECLARE n integer;
BEGIN
  UPDATE bookings
     SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'system_expiry'
   WHERE status = 'held' AND expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$fn$ LANGUAGE plpgsql;
```

---

## 0003 — Money

```sql
CREATE TYPE payment_method AS ENUM ('gateway','cash','card','partner');
CREATE TYPE payment_status AS ENUM ('captured','failed');

-- A payments row means money MOVED. Not an intention to pay.
-- A booking with no payments row has not been paid, and every screen says so.
CREATE TABLE payments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id         uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount_paise       integer NOT NULL CHECK (amount_paise > 0),
  method             payment_method NOT NULL,
  status             payment_status NOT NULL DEFAULT 'captured',
  gateway_payment_id text,
  gateway_event_id   text,   -- R3 idempotency
  received_by        uuid REFERENCES users(id) ON DELETE SET NULL,  -- who took it at the desk
  received_on        date,   -- business date the desk took it; may differ from the booking's
  note               text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payments_gateway_event
  ON payments (gateway_event_id) WHERE gateway_event_id IS NOT NULL;
CREATE INDEX payments_received_on ON payments (received_on, method);
CREATE INDEX payments_booking     ON payments (booking_id);

CREATE TABLE refunds (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  payment_id        uuid REFERENCES payments(id) ON DELETE SET NULL,
  amount_paise      integer NOT NULL CHECK (amount_paise > 0),
  method            payment_method NOT NULL,
  status            text NOT NULL DEFAULT 'pending',  -- pending | sent | failed
  gateway_refund_id text,
  reason            text,
  created_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  sent_at           timestamptz
);

CREATE TYPE settlement_status AS ENUM ('pending','invoiced','settled','written_off');

CREATE TABLE settlements (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id           uuid NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
  period_start         date NOT NULL,
  period_end           date NOT NULL,
  booking_count        integer NOT NULL,
  gross_paise          integer NOT NULL,
  commission_paise     integer NOT NULL,
  net_paise            integer NOT NULL,
  status               settlement_status NOT NULL DEFAULT 'pending',
  invoiced_at          timestamptz,
  settled_at           timestamptz,
  settled_amount_paise integer,
  note                 text,
  created_by           uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, period_start, period_end)
);

ALTER TABLE bookings
  ADD CONSTRAINT bookings_settlement_fk
  FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE SET NULL;

-- End-of-shift till reconciliation. The declared amount starts EMPTY.
-- Pre-filling it with the expected amount makes every reconciliation come out
-- clean and worthless.
CREATE TABLE cash_handovers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_date  date NOT NULL,
  staff_user_id  uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expected_paise integer NOT NULL,
  declared_paise integer NOT NULL,
  variance_paise integer GENERATED ALWAYS AS (declared_paise - expected_paise) STORED,
  note           text,
  accepted_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

---

## 0004 — Partner

```sql
CREATE TABLE api_keys (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id          uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  name                text NOT NULL,
  key_hash            text NOT NULL UNIQUE,   -- hashed + peppered, never stored in the clear
  key_prefix          text NOT NULL,          -- shown in the UI so keys are identifiable
  scopes              text[] NOT NULL DEFAULT '{}',
  is_sandbox          boolean NOT NULL DEFAULT false,
  requests_per_minute integer NOT NULL DEFAULT 120,
  rate_window_start   timestamptz,
  rate_count          integer NOT NULL DEFAULT 0,
  last_used_at        timestamptz,
  revoked_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX api_keys_active ON api_keys (channel_id) WHERE revoked_at IS NULL;

-- Outbound events to partners. Signed over "timestamp.body", retried to 8
-- attempts with backoff, then dead-lettered.
CREATE TABLE webhook_outbox (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  event        text NOT NULL,          -- slot.blocked | booking.cancelled | court.unavailable
  payload      jsonb NOT NULL,
  url          text NOT NULL,
  status       text NOT NULL DEFAULT 'queued',  -- queued|sending|sent|failed|dead
  attempts     smallint NOT NULL DEFAULT 0,
  leased_until timestamptz,
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz
);
```

---

## 0005 — Ops

```sql
-- Blackouts do NOT participate in the booking exclusion constraint (different
-- table). Availability subtracts them, and creating one over existing bookings
-- requires explicit confirmation and cancels them with a refund.
CREATE TABLE blackouts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id   uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  reason     text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX blackouts_court_range
  ON blackouts USING gist (court_id, tstzrange(starts_at, ends_at, '[)'));

-- Ends arguments about a slot that went missing on a busy evening.
CREATE TABLE audit_log (
  id               bigserial PRIMARY KEY,
  actor_user_id    uuid REFERENCES users(id)    ON DELETE SET NULL,
  actor_api_key_id uuid REFERENCES api_keys(id) ON DELETE SET NULL,
  action           text NOT NULL,   -- booking.cancel, price.override, staff.remove, refund.issue
  entity           text NOT NULL,
  entity_id        uuid,
  before           jsonb,
  after            jsonb,
  reason           text,
  ip               inet,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_entity ON audit_log (entity, entity_id, created_at DESC);

CREATE TYPE message_channel AS ENUM ('whatsapp','sms','email');

CREATE TABLE message_outbox (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel      message_channel NOT NULL,
  to_phone     text,
  to_email     text,
  template     text NOT NULL,
  payload      jsonb NOT NULL,
  status       text NOT NULL DEFAULT 'queued',
  attempts     smallint NOT NULL DEFAULT 0,
  leased_until timestamptz,
  last_error   text,
  booking_id   uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz
);

CREATE TABLE otp_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    smallint NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX otp_phone ON otp_codes (phone, created_at DESC);

CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id)     ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, customer_id) = 1)
);
```

---

## 0006 — Hardening

Added after a schema review. Each one closes a specific gap, not a hypothetical.

```sql
-- ---------------------------------------------------------------------------
-- updated_at. Only venue_settings had it, so "when did this price change?" was
-- answerable only by reading the audit log.
-- ---------------------------------------------------------------------------
ALTER TABLE courts      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE court_hours ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE price_rules ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE channels    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE customers   ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE bookings    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$fn$ LANGUAGE plpgsql;
-- One trigger per table above.

-- ---------------------------------------------------------------------------
-- Desk notes. "Corporate booking", "bring own paddles", "regular, pays monthly".
-- Without it staff keep this on paper and it is lost at shift change.
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ADD COLUMN notes text;

-- ---------------------------------------------------------------------------
-- Blocking a customer. Directly needed by pay_at_venue mode: an unpaid online
-- booking is a free way to hold a Saturday court, and a repeat no-show has to
-- be stoppable.
-- ---------------------------------------------------------------------------
ALTER TABLE customers ADD COLUMN no_show_count  integer NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN is_blocked     boolean NOT NULL DEFAULT false;
ALTER TABLE customers ADD COLUMN blocked_reason text;
ALTER TABLE customers ADD COLUMN blocked_at     timestamptz;

-- ---------------------------------------------------------------------------
-- Erasure under the DPDP Act. Financial records must be kept for tax; personal
-- data must be erasable on request. Both are satisfied by stripping the PII and
-- keeping the row: phone becomes a one-way hash so repeat-customer matching
-- still works, name and email go.
-- ---------------------------------------------------------------------------
ALTER TABLE customers ADD COLUMN anonymised_at timestamptz;

-- ---------------------------------------------------------------------------
-- Booking attempts, including the ones that FAILED.
--
-- Without this, a slot that 40 people tried and failed to book looks identical
-- to a slot nobody wanted: both show one booking. The demand is invisible.
--
-- Three uses:
--   1. Demand. "37 people wanted Saturday 7pm" is the case for a 4th court or a
--      higher peak price. Nothing else in the system can answer that.
--   2. Debugging. "Customers can't book" resolves into 40 slot_taken (popular),
--      12 outside_hours (they want 5am), 3 no_price (a real bug).
--   3. Abuse. One phone attempting 50 times in two minutes.
--
-- Written AFTER the attempt resolves, never inside the booking transaction —
-- logging must not slow down or fail a booking.
-- ---------------------------------------------------------------------------
CREATE TABLE booking_attempts (
  id            bigserial PRIMARY KEY,
  court_id      uuid REFERENCES courts(id)   ON DELETE SET NULL,
  channel_id    uuid REFERENCES channels(id) ON DELETE SET NULL,
  starts_at     timestamptz,
  ends_at       timestamptz,
  business_date date,
  outcome       text NOT NULL CHECK (outcome IN (
                  'booked','just_taken','outside_hours','outside_window',
                  'no_price','blackout','past','blocked','error')),
  -- Hashed, never raw. This is a log; the PII rules in 13-ops-security.md apply.
  phone_hash    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- The demand query: for a date and outcome, what was wanted and missed.
CREATE INDEX booking_attempts_demand
  ON booking_attempts (business_date, outcome, starts_at);
CREATE INDEX booking_attempts_abuse
  ON booking_attempts (phone_hash, created_at DESC) WHERE phone_hash IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Login throttling. There was nowhere to count failed attempts.
-- ---------------------------------------------------------------------------
CREATE TABLE login_attempts (
  id         bigserial PRIMARY KEY,
  identifier text NOT NULL,          -- phone or email, lowercased
  ip         inet,
  succeeded  boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_recent ON login_attempts (identifier, created_at DESC);

-- ---------------------------------------------------------------------------
-- One view instead of the same LATERAL join written five times across the
-- dashboard, the calendar, the daily close, the search screen and the reports.
-- Five copies of this join is five chances to get "unpaid" wrong.
-- ---------------------------------------------------------------------------
CREATE VIEW booking_balances AS
SELECT b.id AS booking_id,
       b.amount_paise,
       COALESCE(p.paid_paise, 0)                     AS paid_paise,
       b.amount_paise - COALESCE(p.paid_paise, 0)    AS due_paise,
       COALESCE(r.refunded_paise, 0)                 AS refunded_paise,
       (COALESCE(p.paid_paise, 0) >= b.amount_paise) AS is_paid
  FROM bookings b
  LEFT JOIN LATERAL (
    SELECT SUM(amount_paise) AS paid_paise FROM payments
     WHERE booking_id = b.id AND status = 'captured') p ON true
  LEFT JOIN LATERAL (
    SELECT SUM(amount_paise) AS refunded_paise FROM refunds
     WHERE booking_id = b.id AND status = 'sent') r ON true;
```

### Booking reference generation

`PC-` plus 6 characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` — digits and
letters that cannot be confused when read aloud over a phone (no `0`/`O`,
no `1`/`I`/`L`). ~887 million combinations. Insert, and on unique violation
generate a new one and retry, up to 5 times.

### Retention jobs

| Table | Keep | Why |
|---|---|---|
| `otp_codes` | 24 hours | Nothing needs them after use |
| `sessions` | until expiry + 7 days | |
| `login_attempts` | 90 days | Enough to investigate an attack |
| `booking_attempts` | 90 days | Long enough for a demand report; it is a log, not a record |
| `message_outbox` (sent) | 90 days | |
| `webhook_outbox` (sent) | 90 days | |
| `audit_log` | **forever** | Never pruned. It is the record |
| `bookings`, `payments` | **forever** | Statutory financial records |

## Seed — Pavilion Club

Confirmed with the client 2026-09-01. `db/seed/pavilion.sql`.

```sql
INSERT INTO venue_settings
  (id, name, timezone, business_day_start_hour, hold_ttl_minutes,
   booking_window_days, cancellation_cutoff_hours, cancellation_refund_pct)
VALUES
  (1, 'Pavilion Club', 'Asia/Kolkata', 5, 10, 30, 24, 100);

INSERT INTO courts (name, slug, slot_minutes, sort_order) VALUES
  ('Court 1', 'court-1', 60, 1),
  ('Court 2', 'court-2', 60, 2),
  ('Court 3', 'court-3', 60, 3);

-- Mon-Fri 06:00-23:00  -> 360 to 1380
-- Sat-Sun 06:00-00:00  -> 360 to 1440
-- weekday: 0 = Sunday, 6 = Saturday
INSERT INTO court_hours (court_id, weekday, open_minutes, close_minutes)
SELECT c.id,
       d.weekday,
       360,
       CASE WHEN d.weekday IN (0, 6) THEN 1440 ELSE 1380 END
  FROM courts c
  CROSS JOIN generate_series(0, 6) AS d(weekday);
```

### Capacity this produces

| | Slots per court | × 3 courts |
|---|---|---|
| Mon–Fri | 17 | 51 per day |
| Sat–Sun | 18 | 54 per day |
| **Per week** | **121** | **363** |

~1,570 slots a month. This is the denominator for every occupancy figure in
`10-reports-export.md` — computed from `court_hours`, never hardcoded.

### Note on the midnight close

Saturday and Sunday close at exactly 1440, so the last slot is 23:00–00:00 and
**no booking actually crosses into the next calendar day.** `business_date` is
therefore always the calendar date at present.

Do not remove the cross-midnight handling on that basis. It costs nothing, it is
load-bearing for `business_date`, and the day this venue extends to 01:00 on a
Saturday it is a single number in Settings rather than a migration.

## Invariants

Assert every one of these as an automated test.

```
ACCEPTANCE
- No two bookings with status held or confirmed overlap on the same court.
- collected(date) equals SUM(payments.amount_paise WHERE received_on = date)
- A booking on a channel with settles_later = true has no payments row until settled.
- Editing a price_rule changes no existing bookings.amount_paise.
- Every cancellation has an audit_log row naming the actor.
- No money column is real, double precision, or numeric.
- A booking with status = held always has expires_at set.
```
