import { createHash } from 'node:crypto';
import type { Database } from '../client.js';
import { bookings } from '../schema/bookings.js';
import { bookingAttempts } from '../schema/ops.js';
import { customers } from '../schema/customers.js';
import {
  businessDate,
  computeAvailability,
  generateReference,
  validateBooking,
  IST_OFFSET_MINUTES,
  type BookingActor,
  type RefusalReason,
  type BookingLike,
  type PriceRule,
} from '@pavilion/core';
import {
  getBookableCourts,
  getCourtHours,
  getVenueSettings,
  getActivePriceRules,
  getChannelByCode,
  getActiveChannels,
  getOverlappingBlackouts,
} from '../repositories/venue.js';
import { eq, and, sql } from 'drizzle-orm';

export type CreateBookingInput = {
  courtId: string;
  channelCode: string;
  startsAt: Date;
  endsAt: Date;
  actor: BookingActor;
  customerId?: string | undefined;
  bookedByUserId?: string | undefined;
  partnerReference?: string | undefined;
  idempotencyKey?: string | undefined;
  status?: 'held' | 'confirmed' | undefined;
  notes?: string | undefined;
  now?: Date | undefined;
  ipAddress?: string | undefined;
  phone?: string | undefined;
};

export type CreateBookingResult =
  | { ok: true; bookingId: string; reference: string }
  | { ok: false; reason: RefusalReason | 'DUPLICATE' | 'ERROR' };

/** Expire an overlapping stale hold blocking this slot. Returns true if a hold was freed. */
async function expireBlockingHold(
  db: Database,
  courtId: string,
  startsAt: Date,
  endsAt: Date,
  now: Date
): Promise<boolean> {
  const result = await db.execute(sql`
    UPDATE bookings
       SET status = 'cancelled',
           cancelled_at = ${now.toISOString()}::timestamptz,
           cancelled_by = 'system_expiry'
     WHERE court_id = ${courtId}::uuid
       AND status = 'held'
       AND expires_at < ${now.toISOString()}::timestamptz
       AND tstzrange(starts_at, ends_at, '[)') && tstzrange(${startsAt.toISOString()}::timestamptz, ${endsAt.toISOString()}::timestamptz, '[)')
  `);
  return (result.rowCount ?? 0) > 0;
}

/** Log a booking attempt outside the booking transaction so failed demand is never lost. */
async function logAttempt(
  db: Database,
  input: {
    courtId: string;
    channelId: string;
    startsAt: Date;
    endsAt: Date;
    businessDate: string;
    outcome: string;
    phone?: string | undefined;
  }
) {
  try {
    const phoneHash = input.phone
      ? createHash('sha256').update(input.phone).digest('hex').slice(0, 32)
      : null;

    await db.insert(bookingAttempts).values({
      courtId: input.courtId,
      channelId: input.channelId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      businessDate: input.businessDate,
      outcome: input.outcome,
      phoneHash,
    });
  } catch (err) {
    // Logging failure must never fail the booking flow
    console.error('Failed to log booking attempt:', err);
  }
}

export async function createBooking(
  db: Database,
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const now = input.now ?? new Date();

  // 1. Resolve Channel
  const channel = await getChannelByCode(db, input.channelCode);
  if (!channel) {
    return { ok: false, reason: 'ERROR' };
  }

  // 2. Resolve Venue Settings & Dates
  const settings = await getVenueSettings(db);
  const bDate = businessDate(input.startsAt, IST_OFFSET_MINUTES, settings.businessDayStartHour);
  const todayBDate = businessDate(now, IST_OFFSET_MINUTES, settings.businessDayStartHour);

  // 3. Customer checks
  let customerIsBlocked = false;
  if (input.customerId) {
    const cust = await db.select().from(customers).where(eq(customers.id, input.customerId)).limit(1);
    if (cust[0]?.isBlocked) {
      customerIsBlocked = true;
    }
  }

  // 4. Fetch data for computeAvailability
  const courtsList = await getBookableCourts(db);
  const hoursList = await getCourtHours(db);
  const allChannels = await getActiveChannels(db);
  const channelMap = new Map(allChannels.map((c) => [c.id, c]));
  const priceRulesList = await getActivePriceRules(db);
  const blackoutsList = await getOverlappingBlackouts(db, input.startsAt, input.endsAt);

  // Fetch all bookings overlapping the window that are held or confirmed
  const existingBookings = await db.select().from(bookings).where(
    and(
      sql`status IN ('held', 'confirmed')`,
      sql`tstzrange(starts_at, ends_at, '[)') && tstzrange(${input.startsAt.toISOString()}::timestamptz, ${input.endsAt.toISOString()}::timestamptz, '[)')`
    )
  );

  // Map to core engine format
  const coreBookings: BookingLike[] = existingBookings.map((b) => {
    const ch = channelMap.get(b.channelId);
    return {
      id: b.id,
      reference: b.reference,
      courtId: b.courtId,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      status: b.status as 'held' | 'confirmed',
      expiresAt: b.expiresAt,
      channelCode: ch?.code ?? input.channelCode,
      channelName: ch?.name ?? 'Unknown',
      channelColourHex: ch?.colourHex ?? '#0D5F52',
      customerName: null,
      customerPhone: null,
      partnerReference: b.partnerReference,
      amountPaise: b.amountPaise,
      paidPaise: b.status === 'confirmed' ? b.amountPaise : 0,
    };
  });

  const coreCourts = courtsList.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    slotMinutes: c.slotMinutes,
    sortOrder: c.sortOrder,
    isBookable: c.isBookable,
  }));

  const coreHours = hoursList.map((h) => ({
    courtId: h.courtId,
    weekday: h.weekday,
    openMinutes: h.openMinutes,
    closeMinutes: h.closeMinutes,
  }));

  const coreRules: PriceRule[] = priceRulesList.map((r) => ({
    id: r.id,
    name: r.name,
    courtId: r.courtId,
    weekdays: r.weekdays ? (r.weekdays as number[]) : null,
    fromMinutes: r.fromMinutes,
    toMinutes: r.toMinutes,
    validFrom: r.validFrom,
    validTo: r.validTo,
    priority: r.priority,
    pricePaise: r.pricePaise,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
  }));

  const coreBlackouts = blackoutsList.map((b) => ({
    id: b.id,
    courtId: b.courtId,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    reason: b.reason,
  }));

  // 5. Compute Availability
  const slots = computeAvailability({
    courts: coreCourts,
    hours: coreHours,
    bookings: coreBookings,
    blackouts: coreBlackouts,
    priceRules: coreRules,
    date: bDate,
    now,
    offsetMinutes: IST_OFFSET_MINUTES,
  });

  // 6. Write-path guards
  const validation = validateBooking({
    courtId: input.courtId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    slots,
    now,
    actor: input.actor,
    businessDate: bDate,
    todayBusinessDate: todayBDate,
    bookingWindowDays: settings.bookingWindowDays,
    customerIsBlocked,
  });

  if (!validation.ok) {
    await logAttempt(db, {
      courtId: input.courtId,
      channelId: channel.id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      businessDate: bDate,
      outcome: validation.reason.toLowerCase(),
      phone: input.phone,
    });
    return { ok: false, reason: validation.reason };
  }

  // 7. Generate Reference and Amount
  const reference = generateReference();
  const amountPaise = validation.amountPaise;
  const status = input.status ?? 'held';
  const expiresAt =
    status === 'held'
      ? new Date(now.getTime() + settings.holdTtlMinutes * 60 * 1000)
      : null;

  // 8. Write Path with Retries for 23P01 and 40P01
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const [inserted] = await db
        .insert(bookings)
        .values({
          reference,
          courtId: input.courtId,
          customerId: input.customerId ?? null,
          channelId: channel.id,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          businessDate: bDate,
          status,
          expiresAt,
          amountPaise,
          partnerReference: input.partnerReference ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
          notes: input.notes ?? null,
          createdBy: input.bookedByUserId ?? null,
          confirmedAt: status === 'confirmed' ? now : null,
        })
        .returning();

      if (!inserted) {
        throw new Error('Insert failed to return booking row');
      }

      // Log success
      await logAttempt(db, {
        courtId: input.courtId,
        channelId: channel.id,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        businessDate: bDate,
        outcome: 'booked',
        phone: input.phone,
      });

      return {
        ok: true,
        bookingId: inserted.id,
        reference: inserted.reference,
      };
    } catch (err: any) {
      // 23P01: exclusion_violation
      if (err.code === '23P01') {
        const freed = await expireBlockingHold(db, input.courtId, input.startsAt, input.endsAt, now);
        if (!freed) {
          await logAttempt(db, {
            courtId: input.courtId,
            channelId: channel.id,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            businessDate: bDate,
            outcome: 'just_taken',
            phone: input.phone,
          });
          return { ok: false, reason: 'JUST_TAKEN' };
        }
        // Stale hold was expired! Retry once.
        continue;
      }

      // 40P01: deadlock_detected
      if (err.code === '40P01') {
        const delay = Math.min(25 * Math.pow(2, attempt), 200) + Math.floor(Math.random() * 25);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // 23505: unique_violation (idempotency or partner_reference)
      if (err.code === '23505') {
        return { ok: false, reason: 'DUPLICATE' };
      }

      throw err;
    }
  }

  return { ok: false, reason: 'JUST_TAKEN' };
}
