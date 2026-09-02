import { boolean, pgTable, primaryKey, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const courts = pgTable('courts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  slotMinutes: smallint('slot_minutes').notNull().default(60),
  sortOrder: smallint('sort_order').notNull().default(0),
  isBookable: boolean('is_bookable').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const courtHours = pgTable(
  'court_hours',
  {
    courtId: uuid('court_id')
      .notNull()
      .references(() => courts.id, { onDelete: 'cascade' }),
    weekday: smallint('weekday').notNull(),
    openMinutes: smallint('open_minutes').notNull(),
    closeMinutes: smallint('close_minutes').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.courtId, table.weekday, table.openMinutes] }),
  ]
);

export type Court = typeof courts.$inferSelect;
export type CourtHours = typeof courtHours.$inferSelect;
