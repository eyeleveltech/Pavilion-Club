-- ============================================================================
-- Pavilion Club — seed
-- Confirmed with the client 2026-09-01. Idempotent: safe to re-run.
-- ============================================================================

INSERT INTO venue_settings
  (id, name, timezone, business_day_start_hour, hold_ttl_minutes,
   booking_window_days, cancellation_cutoff_hours, cancellation_refund_pct,
   online_payment_mode, max_unpaid_per_customer)
VALUES
  (1, 'Pavilion Club', 'Asia/Kolkata', 5, 10, 30, 24, 100, 'pay_at_venue', 2)
ON CONFLICT (id) DO NOTHING;

-- R6: every booking source is a row. A second marketplace is one more INSERT.
INSERT INTO channels (code, name, kind, is_online, settles_later, colour_hex) VALUES
  ('website',  'Website',   'website', true,  false, '#0D5F52'),
  ('walkin',   'Walk-in',   'desk',    false, false, '#CFE3DC'),
  ('phone',    'Phone',     'phone',   false, false, '#9AA8A3'),
  ('admin',    'Admin',     'admin',   false, false, '#7E8E88'),
  -- Amber, because it is the one channel whose money is not ours yet.
  ('turftown', 'Turf Town', 'partner', true,  true,  '#B5822A')
ON CONFLICT (code) DO NOTHING;

INSERT INTO courts (name, slug, slot_minutes, sort_order) VALUES
  ('Court 1', 'court-1', 60, 1),
  ('Court 2', 'court-2', 60, 2),
  ('Court 3', 'court-3', 60, 3)
ON CONFLICT (slug) DO NOTHING;

-- Mon-Fri 06:00-23:00  -> 360 to 1380  (17 slots)
-- Sat-Sun 06:00-00:00  -> 360 to 1440  (18 slots)
-- weekday: 0 = Sunday, 6 = Saturday
INSERT INTO court_hours (court_id, weekday, open_minutes, close_minutes)
SELECT c.id,
       d.weekday,
       360,
       CASE WHEN d.weekday IN (0, 6) THEN 1440 ELSE 1380 END
  FROM courts c
  CROSS JOIN generate_series(0, 6) AS d(weekday)
ON CONFLICT (court_id, weekday, open_minutes) DO NOTHING;

-- Placeholder pricing until the real grid arrives (Q16). No rule matching a
-- slot REFUSES the booking rather than sending a court out free, so these
-- exist to make development possible, not to be right.
INSERT INTO price_rules (name, court_id, weekdays, from_minutes, to_minutes, price_paise, priority)
VALUES
  ('Base rate',        NULL, NULL,          NULL, NULL,  80000, 0),
  ('Evening peak',     NULL, NULL,          1080, 1380, 100000, 0),
  ('Weekend evening',  NULL, ARRAY[0,6],    1080, 1380, 120000, 1)
ON CONFLICT DO NOTHING;
