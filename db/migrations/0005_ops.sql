-- ============================================================================
-- 0005 — Operations: blackouts, audit, messaging, sessions
-- ============================================================================

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

-- Append-only. Ends the argument when a slot goes missing on a busy evening.
-- The app role has no UPDATE or DELETE here — see 0007.
CREATE TABLE audit_log (
  id               bigserial PRIMARY KEY,
  actor_user_id    uuid REFERENCES users(id)    ON DELETE SET NULL,
  actor_api_key_id uuid REFERENCES api_keys(id) ON DELETE SET NULL,
  action           text NOT NULL,
  entity           text NOT NULL,
  entity_id        uuid,
  before           jsonb,
  after            jsonb,
  reason           text,
  ip               inet,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_entity ON audit_log (entity, entity_id, created_at DESC);
CREATE INDEX audit_actor  ON audit_log (actor_user_id, created_at DESC);

CREATE TYPE message_channel AS ENUM ('whatsapp','sms','email');

-- Messages are NEVER sent inline during a request. A slow provider must not
-- slow down a booking, and an outage must not fail a payment.
CREATE TABLE message_outbox (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel      message_channel NOT NULL,
  to_phone     text,
  to_email     text,
  template     text NOT NULL,
  payload      jsonb NOT NULL,
  status       text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sending','sent','failed','dead')),
  attempts     smallint NOT NULL DEFAULT 0,
  leased_until timestamptz,
  last_error   text,
  booking_id   uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz
);

CREATE INDEX message_outbox_pending ON message_outbox (created_at)
  WHERE status IN ('queued','failed');

CREATE TABLE otp_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  code_hash   text NOT NULL,          -- never plaintext
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
  token_hash  text NOT NULL UNIQUE,   -- store the hash, never the token
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, customer_id) = 1)
);

CREATE INDEX sessions_expiry ON sessions (expires_at);
