import { randomBytes, createHash, createHmac } from 'node:crypto';
import type { Database } from '../client.js';
import { apiKeys, webhookOutbox } from '../schema/partner.js';
import { channels } from '../schema/channels.js';
import { bookings } from '../schema/bookings.js';
import { courts, courtHours } from '../schema/courts.js';
import { priceRules } from '../schema/bookings.js';
import { blackouts } from '../schema/ops.js';
import { customers } from '../schema/customers.js';
import { venueSettings } from '../schema/settings.js';
import { sql, eq, and, gt, desc } from 'drizzle-orm';
import {
  businessDate,
  generateReference,
  IST_OFFSET_MINUTES,
  minutesToLabel,
  localMinutes,
} from '@pavilion/core';

const API_KEY_PEPPER = process.env.API_KEY_PEPPER || 'pavilion_partner_api_pepper_2026';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key + API_KEY_PEPPER).digest('hex');
}

export async function issueApiKey(
  db: Database,
  input: {
    channelId: string;
    name: string;
    isSandbox?: boolean;
    scopes?: string[];
    requestsPerMinute?: number;
  }
): Promise<{ id: string; rawKey: string; keyPrefix: string; name: string }> {
  const prefix = input.isSandbox ? 'pc_test_' : 'pc_live_';
  const secretPart = randomBytes(24).toString('hex');
  const rawKey = `${prefix}${secretPart}`;
  const keyPrefix = rawKey.slice(0, 16);
  const keyHash = hashApiKey(rawKey);

  const defaultScopes = ['availability:read', 'bookings:write', 'bookings:read', 'bookings:cancel'];

  const rows = await db
    .insert(apiKeys)
    .values({
      channelId: input.channelId,
      name: input.name,
      keyPrefix,
      keyHash,
      scopes: input.scopes || defaultScopes,
      isSandbox: input.isSandbox ?? false,
      requestsPerMinute: input.requestsPerMinute || 120,
    })
    .returning();

  return {
    id: rows[0]!.id,
    rawKey,
    keyPrefix,
    name: rows[0]!.name,
  };
}

export interface AuthenticatePartnerResult {
  ok: boolean;
  statusCode?: number;
  errorCode?: string;
  errorMessage?: string;
  channel?: any;
  apiKey?: any;
  scopes?: string[];
}

export async function authenticatePartnerRequest(
  db: Database,
  authHeader: string | null,
  requiredScope?: string
): Promise<AuthenticatePartnerResult> {
  if (!authHeader) {
    return {
      ok: false,
      statusCode: 401,
      errorCode: 'missing_key',
      errorMessage: 'No API key provided in Authorization or X-Api-Key header',
    };
  }

  let rawKey = authHeader.trim();
  if (rawKey.startsWith('Bearer ')) {
    rawKey = rawKey.slice(7).trim();
  }

  const keyHash = hashApiKey(rawKey);

  const rows = await db
    .select({
      apiKey: apiKeys,
      channel: channels,
    })
    .from(apiKeys)
    .innerJoin(channels, eq(apiKeys.channelId, channels.id))
    .where(and(eq(apiKeys.keyHash, keyHash), sql`${apiKeys.revokedAt} IS NULL`))
    .limit(1);

  const item = rows[0];
  if (!item || !item.channel.isActive) {
    return {
      ok: false,
      statusCode: 401,
      errorCode: 'invalid_key',
      errorMessage: 'API key is unknown, revoked, or the partner channel is inactive',
    };
  }

  const { apiKey, channel } = item;

  // Rate Limiting: 1-minute fixed window stored in api_keys table
  const now = new Date();
  const windowStart = apiKey.rateWindowStart ? new Date(apiKey.rateWindowStart) : null;
  const isExpiredWindow = !windowStart || now.getTime() - windowStart.getTime() > 60000;

  let currentCount = isExpiredWindow ? 1 : apiKey.rateCount + 1;
  let newWindowStart = isExpiredWindow ? now : windowStart;

  if (!isExpiredWindow && currentCount > apiKey.requestsPerMinute) {
    return {
      ok: false,
      statusCode: 429,
      errorCode: 'rate_limited',
      errorMessage: `Rate limit exceeded. Maximum ${apiKey.requestsPerMinute} requests per minute.`,
    };
  }

  // Update key usage
  await db
    .update(apiKeys)
    .set({
      rateCount: currentCount,
      rateWindowStart: newWindowStart,
      lastUsedAt: now,
    })
    .where(eq(apiKeys.id, apiKey.id));

  // Scope check
  if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
    return {
      ok: false,
      statusCode: 403,
      errorCode: 'missing_scope',
      errorMessage: `Key lacks the required scope '${requiredScope}'. Granted scopes: [${apiKey.scopes.join(', ')}]`,
      scopes: apiKey.scopes,
    };
  }

  return {
    ok: true,
    channel,
    apiKey,
    scopes: apiKey.scopes,
  };
}

// 1. Partner Availability
export async function getPartnerAvailability(
  db: Database,
  dateStr: string,
  courtIdParam?: string
) {
  let courtsList = await db.select().from(courts).where(eq(courts.isBookable, true)).orderBy(courts.sortOrder);
  if (courtIdParam) {
    courtsList = courtsList.filter((c) => c.id === courtIdParam);
  }

  const hoursList = await db.select().from(courtHours);
  const blackoutsList = await db.select().from(blackouts);

  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const weekday = dateObj.getUTCDay();

  const existingBookings = await db.execute<{
    court_id: string;
    starts_at: string;
    ends_at: string;
  }>(sql`
    SELECT court_id, starts_at, ends_at
    FROM bookings
    WHERE business_date = ${dateStr}::date
      AND status IN ('confirmed', 'held')
  `);

  const courtsResult = [];

  for (const court of courtsList) {
    const h = hoursList.find((ch) => ch.courtId === court.id && ch.weekday === weekday);
    if (!h) continue;

    const slots = [];
    const isWeekend = weekday === 0 || weekday === 6;

    for (let min = h.openMinutes; min < h.closeMinutes; min += court.slotMinutes) {
      const endMin = min + court.slotMinutes;
      const startIso = `${dateStr}T${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00+05:30`;
      const endIso = `${dateStr}T${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00+05:30`;
      const startDate = new Date(startIso);
      const endDate = new Date(endIso);

      const isBlackout = blackoutsList.some(
        (b) => b.courtId === court.id && b.startsAt < endDate && b.endsAt > startDate
      );
      if (isBlackout) continue;

      const isBooked = existingBookings.rows.some(
        (b) => b.court_id === court.id && new Date(b.starts_at) < endDate && new Date(b.ends_at) > startDate
      );
      if (isBooked) continue;

      const isPeak = isWeekend || min >= 1080;
      const pricePaise = (isPeak ? 1000 : 800) * 100;

      slots.push({
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        price_paise: pricePaise,
      });
    }

    courtsResult.push({
      court_id: court.id,
      name: court.name,
      slot_minutes: court.slotMinutes,
      slots,
    });
  }

  return {
    date: dateStr,
    timezone: 'Asia/Kolkata',
    courts: courtsResult,
  };
}

// 2. Partner Hold Creation
export async function createPartnerHold(
  db: Database,
  input: {
    courtId: string;
    startsAt: Date;
    endsAt: Date;
    channelId: string;
    apiKeyId: string;
    customerPhone?: string;
    customerName?: string;
  }
) {
  const now = new Date();
  const bDate = businessDate(input.startsAt, IST_OFFSET_MINUTES, 5);

  const venue = await db.select().from(venueSettings).where(eq(venueSettings.id, 1)).limit(1);
  const holdTtlMinutes = venue[0]?.holdTtlMinutes || 10;
  const expiresAt = new Date(now.getTime() + holdTtlMinutes * 60 * 1000);

  // Lookup or create customer if provided
  let customerId: string | null = null;
  if (input.customerPhone) {
    const custRows = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, input.customerPhone))
      .limit(1);
    if (custRows[0]) {
      customerId = custRows[0].id;
    } else {
      const inserted = await db
        .insert(customers)
        .values({
          phone: input.customerPhone,
          name: input.customerName || 'Partner Player',
          createdVia: input.channelId,
        })
        .returning();
      customerId = inserted[0]!.id;
    }
  }

  // Calculate resolved price
  const [y, m, d] = bDate.split('-').map(Number) as [number, number, number];
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const startMin = localMinutes(input.startsAt, IST_OFFSET_MINUTES);
  const isPeak = weekday === 0 || weekday === 6 || startMin >= 1080;
  const resolvedPricePaise = (isPeak ? 1000 : 800) * 100;

  const reference = generateReference();

  const [booking] = await db
    .insert(bookings)
    .values({
      courtId: input.courtId,
      businessDate: bDate,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      amountPaise: resolvedPricePaise,
      channelId: input.channelId,
      customerId,
      apiKeyId: input.apiKeyId,
      reference,
      status: 'held',
      expiresAt,
    })
    .returning();

  return {
    booking_id: booking!.id,
    reference: booking!.reference,
    status: 'held',
    expires_at: expiresAt.toISOString(),
    amount_paise: resolvedPricePaise,
  };
}

// 3. Confirm Partner Booking (supports hold confirmation OR direct confirmation)
export async function confirmPartnerBooking(
  db: Database,
  input: {
    bookingId?: string | undefined;
    courtId?: string | undefined;
    startsAt?: Date | undefined;
    endsAt?: Date | undefined;
    channelId: string;
    apiKeyId: string;
    partnerReference: string;
    amountCollectedPaise: number;
    customerPhone?: string | undefined;
    customerName?: string | undefined;
  }
) {
  const now = new Date();

  // Idempotency: check if already confirmed with this partnerReference on this channel
  const existingPartnerBooking = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.channelId, input.channelId),
        eq(bookings.partnerReference, input.partnerReference)
      )
    )
    .limit(1);

  if (existingPartnerBooking[0]) {
    return {
      booking_id: existingPartnerBooking[0].id,
      reference: existingPartnerBooking[0].reference,
      status: existingPartnerBooking[0].status,
    };
  }

  // Case A: Confirming an existing hold
  if (input.bookingId) {
    const rows = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, input.bookingId), eq(bookings.channelId, input.channelId)))
      .limit(1);

    const b = rows[0];
    if (!b) return { error: { code: 'not_found', message: 'Booking hold not found' }, status: 404 };

    if (b.status === 'confirmed') {
      return { booking_id: b.id, reference: b.reference, status: 'confirmed' };
    }

    if (b.status !== 'held' || (b.expiresAt && b.expiresAt < now)) {
      return {
        error: { code: 'hold_expired', message: 'The hold expired before you confirmed' },
        status: 409,
      };
    }

    const [updated] = await db
      .update(bookings)
      .set({
        status: 'confirmed',
        partnerReference: input.partnerReference,
        confirmedAt: now,
        expiresAt: null,
        updatedAt: now,
      })
      .where(eq(bookings.id, b.id))
      .returning();

    return {
      booking_id: updated!.id,
      reference: updated!.reference,
      status: 'confirmed',
    };
  }

  // Case B: Direct confirmation without prior hold
  if (!input.courtId || !input.startsAt || !input.endsAt) {
    return {
      error: { code: 'missing_fields', message: 'court_id, starts_at, and ends_at required for direct booking' },
      status: 400,
    };
  }

  const bDate = businessDate(input.startsAt, IST_OFFSET_MINUTES, 5);
  const reference = generateReference();

  let customerId: string | null = null;
  if (input.customerPhone) {
    const custRows = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, input.customerPhone))
      .limit(1);
    if (custRows[0]) {
      customerId = custRows[0].id;
    } else {
      const inserted = await db
        .insert(customers)
        .values({
          phone: input.customerPhone,
          name: input.customerName || 'Partner Player',
          createdVia: input.channelId,
        })
        .returning();
      customerId = inserted[0]!.id;
    }
  }

  const [b] = await db
    .insert(bookings)
    .values({
      courtId: input.courtId,
      businessDate: bDate,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      amountPaise: input.amountCollectedPaise || 80000,
      channelId: input.channelId,
      customerId,
      apiKeyId: input.apiKeyId,
      reference,
      partnerReference: input.partnerReference,
      status: 'confirmed',
      confirmedAt: now,
    })
    .returning();

  return {
    booking_id: b!.id,
    reference: b!.reference,
    status: 'confirmed',
  };
}

// 4. Read Booking by Partner
export async function getPartnerBookingDetail(
  db: Database,
  bookingId: string,
  channelId: string
) {
  const rows = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      amountPaise: bookings.amountPaise,
      partnerReference: bookings.partnerReference,
      courtId: courts.id,
      courtName: courts.name,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(bookings)
    .innerJoin(courts, eq(bookings.courtId, courts.id))
    .leftJoin(customers, eq(bookings.customerId, customers.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.channelId, channelId)))
    .limit(1);

  const b = rows[0];
  if (!b) return null;

  return {
    booking_id: b.id,
    reference: b.reference,
    status: b.status,
    court: { id: b.courtId, name: b.courtName },
    starts_at: b.startsAt.toISOString(),
    ends_at: b.endsAt.toISOString(),
    amount_paise: b.amountPaise,
    customer: { phone: b.customerPhone, name: b.customerName },
    partner_reference: b.partnerReference,
  };
}

// 5. Cancel Partner Booking
export async function cancelPartnerBooking(
  db: Database,
  bookingId: string,
  channelId: string,
  reason?: string
) {
  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.channelId, channelId)))
    .limit(1);

  const b = rows[0];
  if (!b) return { status: 404, error: { code: 'not_found', message: 'Booking not found' } };

  if (b.status === 'cancelled') {
    return { status: 409, error: { code: 'already_cancelled', message: 'Booking is already cancelled' } };
  }

  const now = new Date();
  await db
    .update(bookings)
    .set({
      status: 'cancelled',
      cancelledAt: now,
      cancelledBy: 'partner',
      cancelReason: reason || 'Cancelled by partner API',
      updatedAt: now,
    })
    .where(eq(bookings.id, b.id));

  return {
    status: 200,
    booking_id: b.id,
    booking_status: 'cancelled',
    refund_due_paise: 0, // Partner refunds their own customer per doc
  };
}

// 6. Outbound Webhook Queue Helper
export async function queuePartnerWebhook(
  db: Database,
  input: {
    channelId: string;
    event: string;
    payload: Record<string, unknown>;
    url: string;
  }
) {
  await db.insert(webhookOutbox).values({
    channelId: input.channelId,
    event: input.event,
    payload: input.payload,
    url: input.url,
    status: 'queued',
  });
}
