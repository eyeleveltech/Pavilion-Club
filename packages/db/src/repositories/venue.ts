import type { Database } from '../client.js';
import { venueSettings } from '../schema/settings.js';
import { courts, courtHours } from '../schema/courts.js';
import { channels } from '../schema/channels.js';
import { priceRules } from '../schema/bookings.js';
import { blackouts } from '../schema/ops.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function getVenueSettings(db: Database) {
  const rows = await db.select().from(venueSettings).where(eq(venueSettings.id, 1)).limit(1);
  if (!rows[0]) throw new Error('Venue settings not found');
  return rows[0];
}

export async function getBookableCourts(db: Database) {
  return db.select().from(courts).where(eq(courts.isBookable, true)).orderBy(courts.sortOrder);
}

export async function getCourtHours(db: Database, courtId?: string) {
  if (courtId) {
    return db.select().from(courtHours).where(eq(courtHours.courtId, courtId));
  }
  return db.select().from(courtHours);
}

export async function getActiveChannels(db: Database) {
  return db.select().from(channels).where(eq(channels.isActive, true));
}

export async function getChannelByCode(db: Database, code: string) {
  const rows = await db.select().from(channels).where(eq(channels.code, code)).limit(1);
  return rows[0] ?? null;
}

export async function getActivePriceRules(db: Database) {
  return db.select().from(priceRules).where(eq(priceRules.isActive, true));
}

export async function getOverlappingBlackouts(db: Database, start: Date, end: Date) {
  return db
    .select()
    .from(blackouts)
    .where(
      sql`tstzrange(${blackouts.startsAt}, ${blackouts.endsAt}, '[)') && tstzrange(${start.toISOString()}::timestamptz, ${end.toISOString()}::timestamptz, '[)')`
    );
}
