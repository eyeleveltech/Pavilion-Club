-- ============================================================================
-- 0002 — Prices and bookings
--
-- Contains the single most important line in the schema: the exclusion
-- constraint that makes double booking physically impossible.
-- ============================================================================

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
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (from_minutes IS NULL OR to_minutes > from_minutes)
);

CREATE TYPE booking_status AS ENUM ('held','confirmed','completed','cancelled','no_show');
CREATE TYPE cancelled_by  AS ENUM ('customer','desk','partner','system_expiry','system_admin');

CREATE TABLE bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             text NOT NULL UNIQUE,

  court_id              uuid NOT NULL REFERENCES courts(id)    ON DELETE RESTRICT,
  customer_id           uuid          REFERENCES customers(id) ON DELETE SET NULL,
  channel_id            uuid NOT NULL REFERENCES channels(id)  ON DELETE RESTRICT,
  -- Which partner key created it. This column is what makes the source-wise
  -- invoice possible. FK added in 0004, once api_keys exists.
  api_key_id            uuid,

  starts_at             timestamptz NOT NULL,
  ends_at               timestamptz NOT NULL,
  -- Written by the application, NOT generated: AT TIME ZONE is STABLE, not
  -- IMMUTABLE, so Postgres rejects it inside GENERATED ALWAYS AS.
  business_date         date NOT NULL,

  status                booking_status NOT NULL DEFAULT 'held',
  expires_at            timestamptz,

  -- R5: resolved server-side, snapshotted here, never read from the request.
  amount_paise          integer NOT NULL CHECK (amount_paise >= 0),
  price_rule_id         uuid REFERENCES price_rules(id) ON DELETE SET NULL,
  price_override_reason text,

  partner_reference     text,
  idempotency_key       text,
  settlement_id         uuid,      -- FK added in 0003
  notes                 text,

  created_by            uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  confirmed_at          timestamptz,
  cancelled_at          timestamptz,
  cancelled_by          cancelled_by,
  cancel_reason         text,

  CHECK (ends_at > starts_at),
  CHECK (status <> 'held' OR expires_at IS NOT NULL),
  CHECK (price_override_reason IS NULL OR length(price_override_reason) >= 3)
);

-- ---------------------------------------------------------------------------
-- THE constraint. Two bookings cannot overlap on the same court.
--
-- Half-open bounds: a booking ending 19:00 and one starting 19:00 do NOT
-- overlap. The WHERE clause matters too — a cancelled booking must stop
-- blocking.
--
-- Application logic may have a race condition and this guarantee still holds.
-- Never drop it, never make it DEFERRABLE, never work around it with advisory
-- locks.
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('held', 'confirmed'));

CREATE UNIQUE INDEX bookings_idempotency
  ON bookings (channel_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX bookings_partner_ref
  ON bookings (channel_id, partner_reference) WHERE partner_reference IS NOT NULL;

CREATE INDEX bookings_business_date ON bookings (business_date, status);
CREATE INDEX bookings_channel_date  ON bookings (channel_id, business_date);
CREATE INDEX bookings_court_starts  ON bookings (court_id, starts_at);
CREATE INDEX bookings_expiring      ON bookings (expires_at) WHERE status = 'held';
CREATE INDEX bookings_customer      ON bookings (customer_id, starts_at DESC);

-- ---------------------------------------------------------------------------
-- An expired hold still blocks, because the constraint cannot see expires_at.
-- Run every ~30s from the worker. Correctness does NOT depend on this schedule:
-- createBooking retries on 23P01 after expiring the specific blocking row.
-- ---------------------------------------------------------------------------
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
