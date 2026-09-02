import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { channels } from './channels.js';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: text('phone').notNull().unique(),
  name: text('name'),
  email: text('email'),
  notes: text('notes'),
  noShowCount: integer('no_show_count').notNull().default(0),
  isBlocked: boolean('is_blocked').notNull().default(false),
  blockedReason: text('blocked_reason'),
  blockedAt: timestamp('blocked_at', { withTimezone: true, mode: 'date' }),
  anonymisedAt: timestamp('anonymised_at', { withTimezone: true, mode: 'date' }),
  createdVia: uuid('created_via').references(() => channels.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
