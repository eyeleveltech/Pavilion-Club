-- ============================================================================
-- 0006 — Hardening
-- Added after a schema review. Each closes a specific gap.
-- ============================================================================

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER courts_touch      BEFORE UPDATE ON courts      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER court_hours_touch BEFORE UPDATE ON court_hours FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER price_rules_touch BEFORE UPDATE ON price_rules FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER channels_touch    BEFORE UPDATE ON channels    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER customers_touch   BEFORE UPDATE ON customers   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER bookings_touch    BEFORE UPDATE ON bookings    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ---------------------------------------------------------------------------
-- Booking attempts, INCLUDING the ones that failed.
--
-- Without this, a slot 40 people tried and failed to book looks identical to a
-- slot nobody wanted: both show one booking. The demand is invisible.
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
                  'booked','just_taken','closed','past','outside_window',
                  'blackout','no_price','not_contiguous','blocked','error')),
  phone_hash    text,   -- hashed, never raw: this is a log
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX booking_attempts_demand
  ON booking_attempts (business_date, outcome, starts_at);
CREATE INDEX booking_attempts_abuse
  ON booking_attempts (phone_hash, created_at DESC) WHERE phone_hash IS NOT NULL;

-- Somewhere to count failed logins for throttling.
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
-- dashboard, calendar, daily close, search and reports. Five copies is five
-- chances to get "unpaid" wrong.
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
