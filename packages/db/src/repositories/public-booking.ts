import type { Database } from '../client.js';
import { bookings } from '../schema/bookings.js';
import { courts, courtHours } from '../schema/courts.js';
import { channels } from '../schema/channels.js';
import { customers } from '../schema/customers.js';
import { venueSettings } from '../schema/settings.js';
import { priceRules } from '../schema/bookings.js';
import { blackouts } from '../schema/ops.js';
import { payments } from '../schema/money.js';
import { sql, eq, and, gte, lte, gt, inArray, desc } from 'drizzle-orm';
import {
  businessDate,
  computeAvailability,
  generateReference,
  IST_OFFSET_MINUTES,
  minutesToLabel,
  localMinutes,
  weekdayOf,
  shiftDate,
  resolvePrice,
  type PriceRule,
} from '@pavilion/core';
import { queueNotificationMessage } from './notifications.js';

export interface PublicDaySlotItem {
  startsAt: string;
  endsAt: string;
  startMinutes: number;
  endMinutes: number;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening';
  pricePaise: number;
  priceRupees: number;
  isPeak: boolean;
  assignedCourtId: string;
  assignedCourtName: string;
  availableCourts: { id: string; name: string }[];
  isAvailable: boolean;
}

export interface PublicMonthDayAvailability {
  date: string;
  dayOfMonth: number;
  weekday: number;
  status: 'free' | 'filling' | 'sold_out' | 'past';
  slotsAvailableCount: number;
  totalSlotsCount: number;
}

// 1. Month Availability with Dots (Green / Amber / Red)
export async function getPublicMonthAvailability(
  db: Database,
  year: number,
  month: number
): Promise<PublicMonthDayAvailability[]> {
  const now = new Date();
  const todayYmd = businessDate(now, IST_OFFSET_MINUTES, 5);

  const courtsList = await db.select().from(courts).where(eq(courts.isBookable, true));
  const hoursList = await db.select().from(courtHours);

  // Days in month
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const results: PublicMonthDayAvailability[] = [];

  const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const bookedCountsQuery = await db.execute<{ business_date: string; count: number }>(sql`
    SELECT business_date::text, COUNT(id)::int AS count
    FROM bookings
    WHERE business_date >= ${startDateStr}::date AND business_date <= ${endDateStr}::date
      AND status IN ('confirmed', 'held')
    GROUP BY business_date
  `);

  const bookedMap = new Map<string, number>();
  for (const row of bookedCountsQuery.rows) {
    const ymd = row.business_date.split('T')[0]!;
    bookedMap.set(ymd, Number(row.count));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const weekday = dateObj.getUTCDay();

    // Compute total capacity across courts for this weekday
    let totalDaySlots = 0;
    for (const c of courtsList) {
      const h = hoursList.find((ch) => ch.courtId === c.id && ch.weekday === weekday);
      if (h) {
        totalDaySlots += Math.floor((h.closeMinutes - h.openMinutes) / c.slotMinutes);
      }
    }

    const taken = bookedMap.get(dateStr) || 0;
    const available = Math.max(0, totalDaySlots - taken);

    let status: 'free' | 'filling' | 'sold_out' | 'past' = 'free';
    if (dateStr < todayYmd) {
      status = 'past';
    } else if (available === 0 || totalDaySlots === 0) {
      status = 'sold_out';
    } else if (available <= totalDaySlots * 0.4) {
      status = 'filling';
    } else {
      status = 'free';
    }

    results.push({
      date: dateStr,
      dayOfMonth: day,
      weekday,
      status,
      slotsAvailableCount: available,
      totalSlotsCount: totalDaySlots,
    });
  }

  return results;
}

// 2. Day Slots segmented by Morning / Afternoon / Evening with Auto Court Assignment
export async function getPublicDaySlots(
  db: Database,
  targetDate: string
): Promise<{
  date: string;
  slots: PublicDaySlotItem[];
  allCourts: { id: string; name: string }[];
}> {
  const courtsList = await db.select().from(courts).where(eq(courts.isBookable, true)).orderBy(courts.sortOrder);
  const hoursList = await db.select().from(courtHours);
  const rulesList = await db.select().from(priceRules).where(eq(priceRules.isActive, true));
  const blackoutsList = await db.select().from(blackouts);

  const [y, m, d] = targetDate.split('-').map(Number) as [number, number, number];
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const weekday = dateObj.getUTCDay();

  // Active bookings on this day
  const existingBookings = await db.execute<{
    court_id: string;
    starts_at: string;
    ends_at: string;
  }>(sql`
    SELECT court_id, starts_at, ends_at
    FROM bookings
    WHERE business_date = ${targetDate}::date
      AND status IN ('confirmed', 'held')
  `);

  // Generate distinct time slots across courts (06:00 to 23:00 / 00:00)
  const slotMinutes = 60;
  const dayStartMinutes = 360; // 06:00
  const isWeekend = weekday === 0 || weekday === 6;
  const dayEndMinutes = isWeekend ? 1440 : 1380; // 23:00 or 00:00

  const items: PublicDaySlotItem[] = [];

  for (let min = dayStartMinutes; min < dayEndMinutes; min += slotMinutes) {
    const endMin = min + slotMinutes;
    const timeLabel = `${minutesToLabel(min)} – ${minutesToLabel(endMin)}`;

    let period: 'morning' | 'afternoon' | 'evening' = 'morning';
    if (min >= 1020) period = 'evening'; // 17:00+
    else if (min >= 720) period = 'afternoon'; // 12:00-17:00

    // Construct slot start Date in IST
    const startIso = `${targetDate}T${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00+05:30`;
    const endIso = `${targetDate}T${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00+05:30`;
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    // Find which courts are open and not booked or blacked out
    const availableCourts: { id: string; name: string }[] = [];

    for (const c of courtsList) {
      const h = hoursList.find((ch) => ch.courtId === c.id && ch.weekday === weekday);
      if (!h || min < h.openMinutes || endMin > h.closeMinutes) continue;

      // Check blackout
      const isBlackout = blackoutsList.some(
        (b) => b.courtId === c.id && b.startsAt < endDate && b.endsAt > startDate
      );
      if (isBlackout) continue;

      // Check booking
      const isBooked = existingBookings.rows.some((b) => {
        if (b.court_id !== c.id) return false;
        const bStart = new Date(b.starts_at);
        const bEnd = new Date(b.ends_at);
        return bStart < endDate && bEnd > startDate;
      });
      if (isBooked) continue;

      availableCourts.push({ id: c.id, name: c.name });
    }

    const isAvailable = availableCourts.length > 0;
    const assignedCourt = availableCourts[0] || { id: courtsList[0]!.id, name: courtsList[0]!.name };

    // Price calculation
    const isPeak = isWeekend || min >= 1080; // weekend or 18:00+
    const priceRupees = isPeak ? 1000 : 800;
    const pricePaise = priceRupees * 100;

    items.push({
      startsAt: startIso,
      endsAt: endIso,
      startMinutes: min,
      endMinutes: endMin,
      timeLabel,
      period,
      pricePaise,
      priceRupees,
      isPeak,
      assignedCourtId: assignedCourt.id,
      assignedCourtName: assignedCourt.name,
      availableCourts,
      isAvailable,
    });
  }

  return {
    date: targetDate,
    slots: items,
    allCourts: courtsList.map((c) => ({ id: c.id, name: c.name })),
  };
}

// 3. Create Public Hold Reservation (10-minute hold countdown)
export async function createPublicHold(
  db: Database,
  input: {
    courtId: string;
    startsAt: Date;
    endsAt: Date;
    pricePaise: number;
    customerId?: string | undefined;
  }
): Promise<{ reference: string; expiresAt: string; holdTtlMinutes: number }> {
  const now = new Date();
  const bDate = businessDate(input.startsAt, IST_OFFSET_MINUTES, 5);

  const venue = await db.select().from(venueSettings).where(eq(venueSettings.id, 1)).limit(1);
  const holdTtlMinutes = venue[0]?.holdTtlMinutes || 10;
  const expiresAt = new Date(now.getTime() + holdTtlMinutes * 60 * 1000);

  // Online channel
  const onlineChannel = await db.select().from(channels).where(eq(channels.code, 'online')).limit(1);
  const channelId = onlineChannel[0]?.id || (await db.select().from(channels).limit(1))[0]!.id;

  const reference = generateReference();

  await db.insert(bookings).values({
    courtId: input.courtId,
    businessDate: bDate,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    amountPaise: input.pricePaise,
    channelId,
    customerId: input.customerId || null,
    reference,
    status: 'held',
    expiresAt,
  });

  return {
    reference,
    expiresAt: expiresAt.toISOString(),
    holdTtlMinutes,
  };
}

// 4. Confirm Public Booking with Pay At Venue (Enforces Unpaid Limit <= 2)
export async function confirmPublicPayAtVenue(
  db: Database,
  input: {
    reference: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
  }
): Promise<{ ok: boolean; error?: string | undefined; booking?: any }> {
  const now = new Date();
  const todayYmd = businessDate(now, IST_OFFSET_MINUTES, 5);

  // 1. Fetch hold booking
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.reference, input.reference))
    .limit(1);

  const booking = rows[0];
  if (!booking) {
    return { ok: false, error: 'Booking reservation not found.' };
  }

  if (booking.status === 'confirmed') {
    return { ok: true, booking };
  }

  if (booking.status !== 'held' || (booking.expiresAt && booking.expiresAt < now)) {
    return { ok: false, error: 'Your hold reservation has expired. Please select a slot again.' };
  }

  // 2. Anti-Abuse Check: Cap unpaid future bookings per customer (default 2)
  const venue = await db.select().from(venueSettings).where(eq(venueSettings.id, 1)).limit(1);
  const maxUnpaidAllowed = venue[0]?.maxUnpaidPerCustomer || 2;

  const unpaidCountQuery = await db.execute<{ count: number }>(sql`
    SELECT COUNT(b.id)::int AS count
    FROM bookings b
    LEFT JOIN booking_balances bal ON b.id = bal.booking_id
    WHERE b.customer_id = ${input.customerId}::uuid
      AND b.business_date >= ${todayYmd}::date
      AND b.status = 'confirmed'
      AND COALESCE(bal.paid_paise, 0) < b.amount_paise
  `);

  const activeUnpaidCount = Number(unpaidCountQuery.rows[0]?.count || 0);
  if (activeUnpaidCount >= maxUnpaidAllowed) {
    return {
      ok: false,
      error: `You already have ${activeUnpaidCount} unpaid bookings pending at the venue. Please pay for your existing games at the desk before booking more.`,
    };
  }

  // 3. Confirm Booking
  await db
    .update(bookings)
    .set({
      status: 'confirmed',
      customerId: input.customerId,
      confirmedAt: now,
      expiresAt: null,
      updatedAt: now,
    })
    .where(eq(bookings.id, booking.id));

  // 4. Queue WhatsApp / SMS Confirmation Message
  await queueNotificationMessage(db, {
    toPhone: input.customerPhone,
    template: 'booking_confirmed',
    bookingId: booking.id,
    payload: {
      reference: booking.reference,
      date: booking.businessDate,
      startsAt: booking.startsAt.toISOString(),
      amountRupees: booking.amountPaise / 100,
      customerName: input.customerName,
      venueName: 'The Pavilion Club',
    },
  });

  return {
    ok: true,
    booking: {
      ...booking,
      status: 'confirmed',
    },
  };
}

// 5. Customer Self-Service: List My Bookings
export async function getCustomerBookingsList(
  db: Database,
  customerId: string
) {
  const query = await db.execute<{
    id: string;
    reference: string;
    court_name: string;
    business_date: string;
    starts_at: string;
    ends_at: string;
    amount_paise: number;
    paid_paise: number;
    status: string;
    created_at: string;
  }>(sql`
    SELECT 
      b.id,
      b.reference,
      ct.name AS court_name,
      b.business_date::text,
      b.starts_at,
      b.ends_at,
      b.amount_paise,
      COALESCE(bal.paid_paise, 0)::int AS paid_paise,
      b.status,
      b.created_at
    FROM bookings b
    JOIN courts ct ON b.court_id = ct.id
    LEFT JOIN booking_balances bal ON b.id = bal.booking_id
    WHERE b.customer_id = ${customerId}::uuid
      AND b.status IN ('confirmed', 'completed', 'cancelled')
    ORDER BY b.starts_at DESC
  `);

  const now = new Date();

  return query.rows.map((b) => {
    const startDate = new Date(b.starts_at);
    const endDate = new Date(b.ends_at);
    const startMin = localMinutes(startDate, IST_OFFSET_MINUTES);
    const endMin = localMinutes(endDate, IST_OFFSET_MINUTES);

    const hoursUntilMatch = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isCancellable = b.status === 'confirmed' && hoursUntilMatch >= 24;

    return {
      id: b.id,
      reference: b.reference,
      courtName: b.court_name,
      businessDate: b.business_date.split('T')[0]!,
      timeLabel: `${minutesToLabel(startMin)} – ${minutesToLabel(endMin)}`,
      amountRupees: Number(b.amount_paise) / 100,
      paidRupees: Number(b.paid_paise) / 100,
      isPaid: Number(b.paid_paise) >= Number(b.amount_paise),
      status: b.status,
      isCancellable,
      hoursUntilMatch: Math.round(hoursUntilMatch),
    };
  });
}

// 6. Customer Self-Service: Cancel Booking (> 24 hrs rule)
export async function cancelBookingByCustomer(
  db: Database,
  input: {
    bookingId: string;
    customerId: string;
  }
): Promise<{ ok: boolean; error?: string | undefined }> {
  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, input.bookingId), eq(bookings.customerId, input.customerId)))
    .limit(1);

  const booking = rows[0];
  if (!booking) return { ok: false, error: 'Booking not found.' };

  if (booking.status !== 'confirmed') {
    return { ok: false, error: 'Only confirmed bookings can be cancelled.' };
  }

  const now = new Date();
  const hoursUntilMatch = (booking.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilMatch < 24) {
    return {
      ok: false,
      error: 'Cancellations within 24 hours of match time are not eligible for self-cancellation per club policy.',
    };
  }

  await db
    .update(bookings)
    .set({
      status: 'cancelled',
      cancelledAt: now,
      cancelledBy: 'customer',
      cancelReason: 'Cancelled by player from self-service portal',
      updatedAt: now,
    })
    .where(eq(bookings.id, booking.id));

  return { ok: true };
}
