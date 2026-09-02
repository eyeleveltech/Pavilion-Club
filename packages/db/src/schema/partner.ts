import { boolean, integer, jsonb, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { channels } from './channels.js';

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  scopes: text('scopes').array().notNull().default([]),
  isSandbox: boolean('is_sandbox').notNull().default(false),
  requestsPerMinute: integer('requests_per_minute').notNull().default(120),
  rateWindowStart: timestamp('rate_window_start', { withTimezone: true, mode: 'date' }),
  rateCount: integer('rate_count').notNull().default(0),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' }),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const webhookOutbox = pgTable('webhook_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  payload: jsonb('payload').notNull(),
  url: text('url').notNull(),
  status: text('status').notNull().default('queued'),
  attempts: smallint('attempts').notNull().default(0),
  leasedUntil: timestamp('leased_until', { withTimezone: true, mode: 'date' }),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type WebhookOutboxItem = typeof webhookOutbox.$inferSelect;
