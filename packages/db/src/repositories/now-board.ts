import type { Database } from '../client.js';
import { courts } from '../schema/courts.js';
import { bookings } from '../schema/bookings.js';
import { customers } from '../schema/customers.js';
import { channels } from '../schema/channels.js';
import {
  IST_OFFSET_MINUTES,
  businessDate,
  localDate,
  localMinutes,
  minutesToLabel,
} from '@pavilion/core';
import { eq, sql } from 'drizzle-orm';

export interface NowCourtSlot {
  courtId: string;
  courtName: string;
  timeLabel: string;
  isFree: boolean;
  bookingId?: string;
  reference?: string;
  customerName?: string;
  phoneOrRef?: string;
  amountPaise?: number;
  paidStatus?: 'PAID' | 'UNPAID' | 'PARTNER';
  channelCode?: string;
  channelName?: string;
}

export interface LaterHourSlot {
  hourLabel: string;
  startMinutes: number;
  bookedCount: number;
  totalCourts: number;
}

export interface UnpaidBooking {
  bookingId: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  courtName: string;
  timeLabel: string;
  amountPaise: number;
  duePaise: number;
}

export interface NowBoardData {
  currentTimeFormatted: string;
  businessDate: string;
  currentSlotLabel: string;
  nextSlotLabel: string;
  onCourtNow: NowCourtSlot[];
  nextUp: NowCourtSlot[];
  laterToday: LaterHourSlot[];
  toCollect: {
    totalDuePaise: number;
    unpaidCount: number;
    unpaidBookings: UnpaidBooking[];
  };
}

function formatHourAmPm(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(norm / 60);
  const mins = norm % 60;
  const period = hours24 >= 12 ? 'pm' : 'am';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return mins === 0
    ? `${hours12}:00 ${period}`
    : `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}

export async function getNowBoardData(
  db: Database,
  at: Date = new Date()
): Promise<NowBoardData> {
  const venueStartHour = 5;
  const bDate = businessDate(at, IST_OFFSET_MINUTES, venueStartHour);
  const currentMin = localMinutes(at, IST_OFFSET_MINUTES);

  const currentSlotStart = Math.floor(currentMin / 60) * 60;
  const currentSlotEnd = currentSlotStart + 60;
  const nextSlotStart = currentSlotEnd;
  const nextSlotEnd = nextSlotStart + 60;

  const wallClock = new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000);
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dayName = dayNames[wallClock.getUTCDay()];
  const monthName = monthNames[wallClock.getUTCMonth()];
  const dayNum = wallClock.getUTCDate();
  const timeStr = formatHourAmPm(currentMin);
  const currentTimeFormatted = `${dayName} ${dayNum} ${monthName} · ${timeStr}`;

  const activeCourts = await db
    .select({
      id: courts.id,
      name: courts.name,
      sortOrder: courts.sortOrder,
    })
    .from(courts)
    .where(eq(courts.isBookable, true))
    .orderBy(courts.sortOrder);

  const todayBookingsQuery = await db.execute<{
    booking_id: string;
    reference: string;
    court_id: string;
    starts_at: string;
    ends_at: string;
    business_date: string;
    status: string;
    amount_paise: number;
    partner_reference: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    channel_code: string;
    channel_name: string;
    settles_later: boolean;
    paid_paise: number;
    due_paise: number;
    is_paid: boolean;
  }>(sql`
    SELECT 
      b.id AS booking_id,
      b.reference,
      b.court_id,
      b.starts_at,
      b.ends_at,
      b.business_date,
      b.status,
      b.amount_paise,
      b.partner_reference,
      c.name AS customer_name,
      c.phone AS customer_phone,
      ch.code AS channel_code,
      ch.name AS channel_name,
      ch.settles_later,
      COALESCE(bal.paid_paise, 0)::int AS paid_paise,
      COALESCE(bal.due_paise, b.amount_paise)::int AS due_paise,
      COALESCE(bal.is_paid, false) AS is_paid
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN channels ch ON b.channel_id = ch.id
    LEFT JOIN booking_balances bal ON b.id = bal.booking_id
    WHERE b.business_date = ${bDate}
      AND b.status IN ('confirmed', 'held', 'completed', 'no_show')
    ORDER BY b.starts_at ASC
  `);

  const todayBookings = todayBookingsQuery.rows;

  function findBookingForSlot(courtId: string, slotStartMin: number) {
    return todayBookings.find((b) => {
      if (b.court_id !== courtId) return false;
      const bStartUtc = new Date(b.starts_at);
      const bStartMin = localMinutes(bStartUtc, IST_OFFSET_MINUTES);
      return bStartMin === slotStartMin;
    });
  }

  const onCourtNow: NowCourtSlot[] = activeCourts.map((c) => {
    const b = findBookingForSlot(c.id, currentSlotStart);
    if (!b) {
      return {
        courtId: c.id,
        courtName: c.name,
        timeLabel: `${minutesToLabel(currentSlotStart)}–${minutesToLabel(currentSlotEnd)}`,
        isFree: true,
      };
    }

    const isPartner = b.settles_later;
    let paidStatus: 'PAID' | 'UNPAID' | 'PARTNER' = 'UNPAID';
    if (isPartner) {
      paidStatus = 'PARTNER';
    } else if (b.is_paid) {
      paidStatus = 'PAID';
    }

    return {
      courtId: c.id,
      courtName: c.name,
      timeLabel: `${minutesToLabel(currentSlotStart)}–${minutesToLabel(currentSlotEnd)}`,
      isFree: false,
      bookingId: b.booking_id,
      reference: b.reference,
      customerName: isPartner
        ? b.channel_name
        : b.customer_name || 'Walk-in Guest',
      phoneOrRef: isPartner
        ? b.partner_reference || 'TT-Booking'
        : b.customer_phone || '—',
      amountPaise: b.amount_paise,
      paidStatus,
      channelCode: b.channel_code,
      channelName: b.channel_name,
    };
  });

  const nextUp: NowCourtSlot[] = activeCourts.map((c) => {
    const b = findBookingForSlot(c.id, nextSlotStart);
    if (!b) {
      return {
        courtId: c.id,
        courtName: c.name,
        timeLabel: `${minutesToLabel(nextSlotStart)}–${minutesToLabel(nextSlotEnd)}`,
        isFree: true,
      };
    }

    const isPartner = b.settles_later;
    let paidStatus: 'PAID' | 'UNPAID' | 'PARTNER' = 'UNPAID';
    if (isPartner) {
      paidStatus = 'PARTNER';
    } else if (b.is_paid) {
      paidStatus = 'PAID';
    }

    return {
      courtId: c.id,
      courtName: c.name,
      timeLabel: `${minutesToLabel(nextSlotStart)}–${minutesToLabel(nextSlotEnd)}`,
      isFree: false,
      bookingId: b.booking_id,
      reference: b.reference,
      customerName: isPartner
        ? b.channel_name
        : b.customer_name || 'Walk-in Guest',
      phoneOrRef: isPartner
        ? b.partner_reference || 'TT-Booking'
        : b.customer_phone || '—',
      amountPaise: b.amount_paise,
      paidStatus,
      channelCode: b.channel_code,
      channelName: b.channel_name,
    };
  });

  const laterToday: LaterHourSlot[] = [];
  const venueClosingMinute = 23 * 60;
  const startHourMin = nextSlotEnd;

  for (let min = startHourMin; min < venueClosingMinute; min += 60) {
    let bookedCount = 0;
    for (const c of activeCourts) {
      if (findBookingForSlot(c.id, min)) {
        bookedCount++;
      }
    }
    laterToday.push({
      hourLabel: formatHourAmPm(min),
      startMinutes: min,
      bookedCount,
      totalCourts: activeCourts.length,
    });
  }

  const unpaidBookings: UnpaidBooking[] = [];
  let totalDuePaise = 0;

  for (const b of todayBookings) {
    if (!b.settles_later && b.due_paise > 0 && b.status === 'confirmed') {
      totalDuePaise += b.due_paise;
      const bCourt = activeCourts.find((c) => c.id === b.court_id);
      const bStartUtc = new Date(b.starts_at);
      const bStartMin = localMinutes(bStartUtc, IST_OFFSET_MINUTES);
      const slotTime = `${minutesToLabel(bStartMin)}–${minutesToLabel(bStartMin + 60)}`;

      unpaidBookings.push({
        bookingId: b.booking_id,
        reference: b.reference,
        customerName: b.customer_name || 'Walk-in Guest',
        customerPhone: b.customer_phone || '—',
        courtName: bCourt ? bCourt.name : 'Court',
        timeLabel: slotTime,
        amountPaise: b.amount_paise,
        duePaise: b.due_paise,
      });
    }
  }

  return {
    currentTimeFormatted,
    businessDate: bDate,
    currentSlotLabel: `${formatHourAmPm(currentSlotStart)} – ${formatHourAmPm(currentSlotEnd)}`,
    nextSlotLabel: formatHourAmPm(nextSlotStart),
    onCourtNow,
    nextUp,
    laterToday,
    toCollect: {
      totalDuePaise,
      unpaidCount: unpaidBookings.length,
      unpaidBookings,
    },
  };
}
