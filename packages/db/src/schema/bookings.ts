import { boolean, date, integer, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courts } from './courts.js';
import { channels } from './channels.js';
import { customers } from './customers.js';
import { users } from './users.js';

export const priceRules = pgTable('price_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  courtId: uuid('court_id').references(() => courts.id, { onDelete: 'cascade' }),
  weekdays: smallint('weekdays').array(),
  fromMinutes: smallint('from_minutes'),
  toMinutes: smallint('to_minutes'),
  validFrom: date('valid_from', { mode: 'string' }),
  validTo: date('valid_to', { mode: 'string' }),
  priority: smallint('priority').notNull().default(0),
  pricePaise: integer('price_paise').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  reference: text('reference').notNull().unique(),
  courtId: uuid('court_id')
    .notNull()
    .references(() => courts.id, { onDelete: 'restrict' }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'restrict' }),
  apiKeyId: uuid('api_key_id'),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'date' }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true, mode: 'date' }).notNull(),
  businessDate: date('business_date', { mode: 'string' }).notNull(),
  status: text('status').notNull().default('held'),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  amountPaise: integer('amount_paise').notNull(),
  priceRuleId: uuid('price_rule_id').references(() => priceRules.id, { onDelete: 'set null' }),
  priceOverrideReason: text('price_override_reason'),
  partnerReference: text('partner_reference'),
  idempotencyKey: text('idempotency_key'),
  settlementId: uuid('settlement_id'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'date' }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'date' }),
  cancelledBy: text('cancelled_by'),
  cancelReason: text('cancel_reason'),
});

export type PriceRule = typeof priceRules.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
