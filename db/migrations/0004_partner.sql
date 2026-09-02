-- ============================================================================
-- 0004 — Partner API
-- API keys are never user sessions. Separate table, separate middleware.
-- ============================================================================

CREATE TABLE api_keys (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id          uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  name                text NOT NULL,
  -- SHA-256 + pepper, NOT argon2: this is verified on every partner request,
  -- so it must be fast. Passwords are the opposite case.
  key_hash            text NOT NULL UNIQUE,
  key_prefix          text NOT NULL,
  scopes              text[] NOT NULL DEFAULT '{}',
  is_sandbox          boolean NOT NULL DEFAULT false,
  requests_per_minute integer NOT NULL DEFAULT 120,
  -- Counter lives on the row so the limit is shared across processes. A
  -- per-process counter is wrong the moment there are two containers.
  rate_window_start   timestamptz,
  rate_count          integer NOT NULL DEFAULT 0,
  last_used_at        timestamptz,
  revoked_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX api_keys_active ON api_keys (channel_id) WHERE revoked_at IS NULL;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_api_key_fk
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL;

-- Outbound events. Signed over "timestamp.body", retried to 8 attempts with
-- backoff, then dead-lettered. Keeps a partner's listing fresh when the desk
-- blocks a slot.
CREATE TABLE webhook_outbox (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  event        text NOT NULL,
  payload      jsonb NOT NULL,
  url          text NOT NULL,
  status       text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sending','sent','failed','dead')),
  attempts     smallint NOT NULL DEFAULT 0,
  leased_until timestamptz,
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz
);

CREATE INDEX webhook_outbox_pending ON webhook_outbox (created_at)
  WHERE status IN ('queued','failed');
