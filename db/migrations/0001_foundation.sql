-- ============================================================================
-- 0001 — Foundation
-- Settings, courts, opening hours, channels, users, customers.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;   -- required by 0002's exclusion constraint
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()

-- Single-row settings. Single-tenant by decision D1, so venue-wide values live
-- here rather than in a tenants table.
CREATE TABLE venue_settings (
  id                        smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name                      text NOT NULL,
  timezone                  text NOT NULL DEFAULT 'Asia/Kolkata',
  -- The hour a business day starts. A 00:30 booking reports against the
  -- previous date, so the daily close covers one whole night.
  business_day_start_hour   smallint NOT NULL DEFAULT 5 CHECK (business_day_start_hour BETWEEN 0 AND 12),
  hold_ttl_minutes          smallint NOT NULL DEFAULT 10,
  booking_window_days       smallint NOT NULL DEFAULT 30,
  cancellation_cutoff_hours smallint NOT NULL DEFAULT 24,
  cancellation_refund_pct   smallint NOT NULL DEFAULT 100 CHECK (cancellation_refund_pct BETWEEN 0 AND 100),

  -- How the public site takes money. Razorpay is deferred (Q20), so we launch
  -- on pay_at_venue and flip to gateway with one settings change.
  online_payment_mode       text NOT NULL DEFAULT 'pay_at_venue'
    CHECK (online_payment_mode IN ('gateway','pay_at_venue','off')),
  -- Cap on unpaid future bookings per phone. Without payment, a free booking is
  -- a free way to hold a Saturday court.
  max_unpaid_per_customer   smallint NOT NULL DEFAULT 2,

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
-- runs past midnight: 06:00-02:00 is open=360, close=1560. Normal, not an edge
-- case.
--
-- The key includes open_minutes so a day may have MORE THAN ONE period — a
-- venue that shuts midday is two rows. Adding that later would mean migrating
-- live opening hours.
CREATE TABLE court_hours (
  court_id      uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  weekday       smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0 = Sunday
  open_minutes  smallint NOT NULL CHECK (open_minutes BETWEEN 0 AND 1439),
  close_minutes smallint NOT NULL CHECK (close_minutes BETWEEN 1 AND 1800),
  updated_at    timestamptz NOT NULL DEFAULT now(),
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
  code           text NOT NULL UNIQUE,
  name           text NOT NULL,
  kind           channel_kind NOT NULL,
  colour_hex     text NOT NULL DEFAULT '#0D5F52',
  is_online      boolean NOT NULL,
  settles_later  boolean NOT NULL DEFAULT false,
  -- Their commission, if any. We do NOT model how they calculate it; this is
  -- only so the settlement screen can show an expected figure.
  commission_bps integer NOT NULL DEFAULT 0 CHECK (commission_bps BETWEEN 0 AND 10000),
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('owner', 'manager', 'desk');

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  phone          text NOT NULL UNIQUE,
  email          text UNIQUE,
  password_hash  text,
  role           user_role NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz
);

-- Phone is the identity. A regular must not be recreated every visit.
CREATE TABLE customers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone          text NOT NULL UNIQUE,
  name           text,
  email          text,
  notes          text,
  no_show_count  integer NOT NULL DEFAULT 0,
  is_blocked     boolean NOT NULL DEFAULT false,
  blocked_reason text,
  blocked_at     timestamptz,
  -- Erasure under the DPDP Act: strip the PII, keep the financial record.
  anonymised_at  timestamptz,
  created_via    uuid REFERENCES channels(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
