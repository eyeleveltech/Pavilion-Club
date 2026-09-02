-- ============================================================================
-- 0003 — Money
--
-- A payments row means money MOVED. Not an intention to pay. A booking with no
-- payments row has not been paid, and every screen says so.
-- ============================================================================

CREATE TYPE payment_method AS ENUM ('gateway','cash','card','partner');
CREATE TYPE payment_status AS ENUM ('captured','failed');

CREATE TABLE payments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id         uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount_paise       integer NOT NULL CHECK (amount_paise > 0),
  method             payment_method NOT NULL,
  status             payment_status NOT NULL DEFAULT 'captured',
  gateway_payment_id text,
  gateway_event_id   text,   -- R3 idempotency: a duplicate webhook changes nothing
  -- Who physically took the money. NOT bookings.created_by: the phone booking
  -- taken at noon is settled by whoever is behind the counter at 7pm.
  received_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  received_on        date,   -- business date the desk took it
  note               text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK ((method IN ('cash','card')) = (received_by IS NOT NULL))
);

CREATE UNIQUE INDEX payments_gateway_event
  ON payments (gateway_event_id) WHERE gateway_event_id IS NOT NULL;
CREATE INDEX payments_received_on ON payments (received_on, method);
CREATE INDEX payments_booking     ON payments (booking_id);

-- Written in the SAME TRANSACTION as the cancellation. A cancel that writes no
-- refund is a bug — it buried paid bookings with no record in the Turf OS build.
CREATE TABLE refunds (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  payment_id        uuid REFERENCES payments(id) ON DELETE SET NULL,
  amount_paise      integer NOT NULL CHECK (amount_paise > 0),
  method            payment_method NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  gateway_refund_id text,
  reason            text,
  created_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  sent_at           timestamptz
);

CREATE INDEX refunds_pending ON refunds (created_at) WHERE status = 'pending';

CREATE TYPE settlement_status AS ENUM ('pending','invoiced','settled','written_off');

-- A period's partner bookings invoiced as one balance. Numbers are frozen at
-- creation, so changing the rate later never rewrites an existing settlement.
CREATE TABLE settlements (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id           uuid NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
  period_start         date NOT NULL,
  period_end           date NOT NULL,
  booking_count        integer NOT NULL,
  gross_paise          integer NOT NULL,   -- OUR slot prices, never what they collected
  commission_paise     integer NOT NULL,
  net_paise            integer NOT NULL,
  status               settlement_status NOT NULL DEFAULT 'pending',
  invoiced_at          timestamptz,
  settled_at           timestamptz,
  settled_amount_paise integer,
  note                 text,
  created_by           uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, period_start, period_end),
  CHECK (period_end >= period_start)
);

ALTER TABLE bookings
  ADD CONSTRAINT bookings_settlement_fk
  FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE SET NULL;

CREATE INDEX bookings_unsettled ON bookings (channel_id, business_date)
  WHERE settlement_id IS NULL;

-- End-of-shift till reconciliation. The declared amount starts EMPTY in the UI:
-- pre-filling it with the expected amount makes every reconciliation come out
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

CREATE INDEX cash_handovers_date ON cash_handovers (business_date DESC);
