import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  colourHex: text('colour_hex').notNull().default('#0D5F52'),
  isOnline: boolean('is_online').notNull(),
  settlesLater: boolean('settles_later').notNull().default(false),
  commissionBps: integer('commission_bps').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type Channel = typeof channels.$inferSelect;
