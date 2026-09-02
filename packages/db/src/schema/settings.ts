import { pgTable, smallint, text, timestamp } from 'drizzle-orm/pg-core';

export const venueSettings = pgTable('venue_settings', {
  id: smallint('id').primaryKey().default(1),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('Asia/Kolkata'),
  businessDayStartHour: smallint('business_day_start_hour').notNull().default(5),
  holdTtlMinutes: smallint('hold_ttl_minutes').notNull().default(10),
  bookingWindowDays: smallint('booking_window_days').notNull().default(30),
  cancellationCutoffHours: smallint('cancellation_cutoff_hours').notNull().default(24),
  cancellationRefundPct: smallint('cancellation_refund_pct').notNull().default(100),
  onlinePaymentMode: text('online_payment_mode').notNull().default('pay_at_venue'),
  maxUnpaidPerCustomer: smallint('max_unpaid_per_customer').notNull().default(2),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type VenueSettings = typeof venueSettings.$inferSelect;
