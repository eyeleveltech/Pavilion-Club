import { randomBytes, createHash } from 'node:crypto';
import type { Database } from '../client.js';
import { courts, courtHours } from '../schema/courts.js';
import { bookings } from '../schema/bookings.js';
import { customers } from '../schema/customers.js';
import { users } from '../schema/users.js';
import { channels } from '../schema/channels.js';
import { apiKeys } from '../schema/partner.js';
import { blackouts } from '../schema/ops.js';
import { venueSettings } from '../schema/settings.js';
import { priceRules } from '../schema/bookings.js';
import { sql, eq, and, desc } from 'drizzle-orm';
import { hashPassword } from '../auth/password.js';
import { businessDate, IST_OFFSET_MINUTES, localMinutes, minutesToLabel, weekdayOf } from '@pavilion/core';

// 1. Courts & Hours
export async function getCourtsSettings(db: Database) {
  const courtsList = await db.select().from(courts).orderBy(courts.sortOrder);
  const hoursList = await db.select().from(courtHours);

  return courtsList.map((c) => ({
    id: c.id,
    name: c.name,
    slotMinutes: c.slotMinutes,
    sortOrder: c.sortOrder,
    isBookable: c.isBookable,
    hours: hoursList
      .filter((h) => h.courtId === c.id)
      .sort((a, b) => a.weekday - b.weekday)
      .map((h) => ({
        weekday: h.weekday,
        openMinutes: h.openMinutes,
        closeMinutes: h.closeMinutes,
        openLabel: minutesToLabel(h.openMinutes),
        closeLabel: minutesToLabel(h.closeMinutes),
      })),
  }));
}

export async function saveCourtHoursWithSafetyCheck(
  db: Database,
  input: {
    courtId: string;
    isBookable?: boolean;
    hours: { weekday: number; openMinutes: number; closeMinutes: number }[];
  }
) {
  const now = new Date();
  const todayYmd = businessDate(now, IST_OFFSET_MINUTES, 5);

  // 1. Fetch active upcoming bookings on this court
  const upcomingBookings = await db.execute<{
    reference: string;
    business_date: string;
    starts_at: string;
    ends_at: string;
    customer_name: string | null;
  }>(sql`
    SELECT b.reference, b.business_date::text, b.starts_at, b.ends_at, c.name AS customer_name
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.court_id = ${input.courtId}::uuid
      AND b.business_date >= ${todayYmd}::date
      AND b.status IN ('confirmed', 'held')
  `);

  // Detect which bookings fall outside updated opening hours
  const affectedBookings: {
    reference: string;
    date: string;
    time: string;
    customerName: string;
  }[] = [];

  for (const b of upcomingBookings.rows) {
    const bDate = b.business_date.split('T')[0]!;
    const w = weekdayOf(bDate);
    const startMin = localMinutes(new Date(b.starts_at), IST_OFFSET_MINUTES);
    const endMin = localMinutes(new Date(b.ends_at), IST_OFFSET_MINUTES);

    const matchingHour = input.hours.find((h) => h.weekday === w);
    if (!matchingHour || startMin < matchingHour.openMinutes || endMin > matchingHour.closeMinutes) {
      affectedBookings.push({
        reference: b.reference,
        date: bDate,
        time: `${minutesToLabel(startMin)}–${minutesToLabel(endMin)}`,
        customerName: b.customer_name || 'Walk-in Player',
      });
    }
  }

  // 2. Update court bookable status
  if (typeof input.isBookable === 'boolean') {
    await db
      .update(courts)
      .set({ isBookable: input.isBookable })
      .where(eq(courts.id, input.courtId));
  }

  // 3. Replace hours for this court
  await db.delete(courtHours).where(eq(courtHours.courtId, input.courtId));

  for (const h of input.hours) {
    await db.insert(courtHours).values({
      courtId: input.courtId,
      weekday: h.weekday,
      openMinutes: h.openMinutes,
      closeMinutes: h.closeMinutes,
    });
  }

  return { affectedBookings };
}

// 2. Blackouts
export async function getBlackoutsList(db: Database) {
  const query = await db.execute<{
    id: string;
    court_id: string;
    court_name: string;
    starts_at: string;
    ends_at: string;
    reason: string;
    created_by_name: string | null;
    created_at: string;
  }>(sql`
    SELECT 
      bl.id,
      bl.court_id,
      ct.name AS court_name,
      bl.starts_at,
      bl.ends_at,
      bl.reason,
      u.name AS created_by_name,
      bl.created_at
    FROM blackouts bl
    JOIN courts ct ON bl.court_id = ct.id
    LEFT JOIN users u ON bl.created_by = u.id
    ORDER BY bl.starts_at DESC
    LIMIT 50
  `);

  return query.rows.map((row) => ({
    id: row.id,
    courtId: row.court_id,
    courtName: row.court_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
    createdByName: row.created_by_name || 'Staff',
    createdAt: row.created_at,
  }));
}

export async function createBlackouts(
  db: Database,
  input: {
    courtIds: string[];
    startsAt: Date;
    endsAt: Date;
    reason: string;
    createdByUserId: string;
  }
) {
  for (const courtId of input.courtIds) {
    await db.insert(blackouts).values({
      courtId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      reason: input.reason.trim(),
      createdBy: input.createdByUserId,
    });
  }
}

export async function deleteBlackout(db: Database, blackoutId: string) {
  await db.delete(blackouts).where(eq(blackouts.id, blackoutId));
}

// 3. Staff Users
export async function getStaffUsersList(db: Database) {
  const staff = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      deactivatedAt: users.deactivatedAt,
    })
    .from(users)
    .orderBy(desc(users.isActive), users.name);

  return staff;
}

export async function createStaffUserAccount(
  db: Database,
  input: {
    name: string;
    phone: string;
    email?: string | undefined;
    role: 'owner' | 'manager' | 'desk';
    passwordPlain: string;
  }
) {
  const passwordHash = await hashPassword(input.passwordPlain);

  const inserted = await db
    .insert(users)
    .values({
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      role: input.role,
      passwordHash,
      isActive: true,
    })
    .returning({ id: users.id });

  return inserted[0]!;
}

export async function toggleStaffUserActive(
  db: Database,
  userId: string,
  isActive: boolean
) {
  await db
    .update(users)
    .set({
      isActive,
      deactivatedAt: isActive ? null : new Date(),
    })
    .where(eq(users.id, userId));
}

// 4. Partner Channels & API Keys
export async function getPartnersSettings(db: Database) {
  const partnerChannels = await db
    .select()
    .from(channels)
    .where(eq(channels.settlesLater, true));

  const allKeys = await db.select().from(apiKeys);

  return partnerChannels.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    colourHex: p.colourHex,
    isActive: p.isActive,
    commissionPercent: (p.commissionBps ?? 0) / 100,
    apiKeys: allKeys
      .filter((k) => k.channelId === p.id)
      .map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        requestsPerMinute: k.requestsPerMinute,
        lastUsedAt: k.lastUsedAt,
        revokedAt: k.revokedAt,
      })),
  }));
}

export async function updatePartnerCommission(
  db: Database,
  channelId: string,
  commissionPercent: number
) {
  await db
    .update(channels)
    .set({
      commissionBps: Math.round(commissionPercent * 100),
      updatedAt: new Date(),
    })
    .where(eq(channels.id, channelId));
}

export async function issuePartnerApiKey(
  db: Database,
  input: {
    channelId: string;
    name: string;
  }
) {
  const randomSecret = randomBytes(24).toString('hex');
  const fullKey = `pv_live_${randomSecret}`;
  const keyPrefix = fullKey.slice(0, 12);
  const keyHash = createHash('sha256').update(fullKey).digest('hex');

  await db.insert(apiKeys).values({
    channelId: input.channelId,
    name: input.name.trim(),
    keyPrefix,
    keyHash,
    scopes: ['availability:read', 'booking:write'],
    requestsPerMinute: 120,
  });

  return { fullKey, keyPrefix };
}

export async function revokePartnerApiKey(db: Database, keyId: string) {
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}

// 5. Venue Settings
export async function getVenueGeneralSettings(db: Database) {
  const rows = await db.select().from(venueSettings).where(eq(venueSettings.id, 1)).limit(1);
  return rows[0]!;
}

export async function updateVenueGeneralSettings(
  db: Database,
  input: {
    name?: string | undefined;
    timezone?: string | undefined;
    businessDayStartHour?: number | undefined;
    holdTtlMinutes?: number | undefined;
    bookingWindowDays?: number | undefined;
  }
) {
  await db
    .update(venueSettings)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(venueSettings.id, 1));
}
