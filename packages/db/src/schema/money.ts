import { date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { bookings } from './bookings.js';
import { channels } from './channels.js';
import { users } from './users.js';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  amountPaise: integer('amount_paise').notNull(),
  method: text('method').notNull(),
  status: text('status').notNull().default('captured'),
  gatewayPaymentId: text('gateway_payment_id'),
  gatewayEventId: text('gateway_event_id'),
  receivedBy: uuid('received_by').references(() => users.id, { onDelete: 'set null' }),
  receivedOn: date('received_on', { mode: 'string' }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
  amountPaise: integer('amount_paise').notNull(),
  method: text('method').notNull(),
  status: text('status').notNull().default('pending'),
  gatewayRefundId: text('gateway_refund_id'),
  reason: text('reason'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
});

export const settlements = pgTable('settlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'restrict' }),
  periodStart: date('period_start', { mode: 'string' }).notNull(),
  periodEnd: date('period_end', { mode: 'string' }).notNull(),
  bookingCount: integer('booking_count').notNull(),
  grossPaise: integer('gross_paise').notNull(),
  commissionPaise: integer('commission_paise').notNull(),
  netPaise: integer('net_paise').notNull(),
  status: text('status').notNull().default('pending'),
  invoicedAt: timestamp('invoiced_at', { withTimezone: true, mode: 'date' }),
  settledAt: timestamp('settled_at', { withTimezone: true, mode: 'date' }),
  settledAmountPaise: integer('settled_amount_paise'),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const cashHandovers = pgTable('cash_handovers', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessDate: date('business_date', { mode: 'string' }).notNull(),
  staffUserId: uuid('staff_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  expectedPaise: integer('expected_paise').notNull(),
  declaredPaise: integer('declared_paise').notNull(),
  variancePaise: integer('variance_paise'),
  note: text('note'),
  acceptedBy: uuid('accepted_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type Refund = typeof refunds.$inferSelect;
export type Settlement = typeof settlements.$inferSelect;
export type CashHandover = typeof cashHandovers.$inferSelect;
