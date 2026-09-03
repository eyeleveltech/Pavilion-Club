import type { Database } from '../client.js';
import { courts, courtHours } from '../schema/courts.js';
import { bookings } from '../schema/bookings.js';
import { customers } from '../schema/customers.js';
import { channels } from '../schema/channels.js';
import { blackouts } from '../schema/ops.js';
import { payments } from '../schema/money.js';
import {
  IST_OFFSET_MINUTES,
  businessDate,
  localDate,
  localMinutes,
  minutesToLabel,
  shiftDate,
  weekdayOf,
  formatPaise,
  computeAvailability,
} from '@pavilion/core';
import { eq, and, sql } from 'drizzle-orm';
import { getBookableCourts, getCourtHours, getActivePriceRules } from './venue.js';

export interface MonthDayCell {
  date: string;
  dayOfMonth: number;
  weekday: number;
  bookedCount: number;
  capacity: number;
  percentage: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export interface MonthCalendarData {
  yearMonth: string;
  monthTitle: string;
  days: MonthDayCell[];
  prevMonth: string;
  nextMonth: string;
}

export interface DaySlotBooking {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  channelCode: string;
  channelName: string;
  isOnline: boolean;
  isPartner: boolean;
  partnerReference: string | null;
  amountPaise: number;
  paidPaise: number;
  isPaid: boolean;
  status: string;
}

export interface DaySlotCell {
  courtId: string;
  courtName: string;
  startMinutes: number;
  endMinutes: number;
  timeLabel: string;
  state: 'free' | 'held' | 'booked' | 'blackout' | 'closed';
  isPast: boolean;
  pricePaise: number;
  priceFormatted: string;
  booking?: DaySlotBooking | undefined;
  blackoutReason?: string | undefined;
}

export interface DayHourRow {
  hourLabel: string;
  startMinutes: number;
  slotsByCourt: Record<string, DaySlotCell>;
}

export interface DayCalendarData {
  date: string;
  dateFormatted: string;
  courts: { id: string; name: string }[];
  hours: DayHourRow[];
  currentIstMinutes: number;
  isToday: boolean;
  prevDate: string;
  nextDate: string;
}

export async function getMonthCalendarData(
  db: Database,
  yearMonthParam?: string
): Promise<MonthCalendarData> {
  const now = new Date();
  const todayYmd = businessDate(now, IST_OFFSET_MINUTES, 5);
  const currentYm = todayYmd.slice(0, 7); // e.g. "2026-09"
  const ym = yearMonthParam || currentYm;

  const [yearStr, monthStr] = ym.split('-');
  const year = parseInt(yearStr || '2026', 10);
  const month = parseInt(monthStr || '9', 10); // 1-12

  // Month title e.g. "September 2026"
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthTitle = `${monthNames[month - 1]} ${year}`;

  // Prev / Next month strings
  const prevDateObj = new Date(Date.UTC(year, month - 2, 1));
  const nextDateObj = new Date(Date.UTC(year, month, 1));
  const prevMonth = `${prevDateObj.getUTCFullYear()}-${String(prevDateObj.getUTCMonth() + 1).padStart(2, '0')}`;
  const nextMonth = `${nextDateObj.getUTCFullYear()}-${String(nextDateObj.getUTCMonth() + 1).padStart(2, '0')}`;

  // Courts & hours for capacity
  const bookableCourts = await getBookableCourts(db);
  const allHours = await getCourtHours(db);

  function getCapacity(dateStr: string): number {
    const w = weekdayOf(dateStr);
    let count = 0;
    for (const c of bookableCourts) {
      const h = allHours.find((hour) => hour.courtId === c.id && hour.weekday === w);
      if (h) {
        count += Math.floor((h.closeMinutes - h.openMinutes) / c.slotMinutes);
      }
    }
    return Math.max(count, 0);
  }

  // Fetch bookings in this month range
  const monthStart = `${ym}-01`;
  const lastDayNumber = new Date(year, month, 0).getDate();
  const monthEnd = `${ym}-${String(lastDayNumber).padStart(2, '0')}`;

  const bookingsCountQuery = await db.execute<{ business_date: string; count: string }>(sql`
    SELECT business_date::text, COUNT(*)::int AS count
    FROM bookings
    WHERE business_date >= ${monthStart}::date AND business_date <= ${monthEnd}::date
      AND status IN ('confirmed', 'held', 'completed')
    GROUP BY business_date
  `);

  const countsMap = new Map<string, number>();
  for (const row of bookingsCountQuery.rows) {
    const dStr = row.business_date.split('T')[0]!;
    countsMap.set(dStr, Number(row.count));
  }

  // Days array (Monday-aligned grid)
  const days: MonthDayCell[] = [];
  const firstDayWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sun
  const mondayOffset = (firstDayWeekday + 6) % 7; // 0 = Mon, 6 = Sun

  // Prepend padding days from previous month
  for (let p = mondayOffset - 1; p >= 0; p--) {
    const padDateObj = new Date(Date.UTC(year, month - 1, 1 - p - 1));
    const padYmd = padDateObj.toISOString().split('T')[0]!;
    days.push({
      date: padYmd,
      dayOfMonth: padDateObj.getUTCDate(),
      weekday: padDateObj.getUTCDay(),
      bookedCount: 0,
      capacity: getCapacity(padYmd),
      percentage: 0,
      isToday: padYmd === todayYmd,
      isCurrentMonth: false,
    });
  }

  // Month days
  for (let d = 1; d <= lastDayNumber; d++) {
    const dStr = `${ym}-${String(d).padStart(2, '0')}`;
    const bCount = countsMap.get(dStr) || 0;
    const cap = getCapacity(dStr);
    const pct = cap > 0 ? Math.round((bCount / cap) * 100) : 0;

    days.push({
      date: dStr,
      dayOfMonth: d,
      weekday: weekdayOf(dStr),
      bookedCount: bCount,
      capacity: cap,
      percentage: pct,
      isToday: dStr === todayYmd,
      isCurrentMonth: true,
    });
  }

  return {
    yearMonth: ym,
    monthTitle,
    days,
    prevMonth,
    nextMonth,
  };
}

export async function getDayCalendarData(
  db: Database,
  dateParam?: string
): Promise<DayCalendarData> {
  const now = new Date();
  const todayYmd = businessDate(now, IST_OFFSET_MINUTES, 5);
  const targetDate = dateParam || todayYmd;
  const isToday = targetDate === todayYmd;
  const currentIstMin = localMinutes(now, IST_OFFSET_MINUTES);

  // Date label formatting: "Thursday 3 September 2026"
  const [y, m, d] = targetDate.split('-').map(Number) as [number, number, number];
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dateFormatted = `${dayNames[dateObj.getUTCDay()]} ${d} ${monthNames[dateObj.getUTCMonth()]} ${y}`;

  const prevDate = shiftDate(targetDate, -1);
  const nextDate = shiftDate(targetDate, 1);

  // 1. Fetch bookable courts & hours
  const courtsList = await getBookableCourts(db);
  const hoursList = await getCourtHours(db);
  const priceRulesList = await getActivePriceRules(db);

  // 2. Fetch all bookings for target date with customer, channel & payment details
  const bookingsQuery = await db.execute<{
    id: string;
    reference: string;
    court_id: string;
    starts_at: string;
    ends_at: string;
    status: string;
    amount_paise: number;
    partner_reference: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    channel_code: string;
    channel_name: string;
    is_online: boolean;
    settles_later: boolean;
    paid_paise: number;
    is_paid: boolean;
  }>(sql`
    SELECT 
      b.id,
      b.reference,
      b.court_id,
      b.starts_at,
      b.ends_at,
      b.status,
      b.amount_paise,
      b.partner_reference,
      c.name AS customer_name,
      c.phone AS customer_phone,
      ch.code AS channel_code,
      ch.name AS channel_name,
      ch.is_online,
      ch.settles_later,
      COALESCE(bal.paid_paise, 0)::int AS paid_paise,
      COALESCE(bal.is_paid, false) AS is_paid
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN channels ch ON b.channel_id = ch.id
    LEFT JOIN booking_balances bal ON b.id = bal.booking_id
    WHERE b.business_date = ${targetDate}::date
      AND b.status IN ('held', 'confirmed', 'completed')
  `);

  const existingBookings = bookingsQuery.rows;
  const existingBlackouts = await db.select().from(blackouts);

  // 3. Compute slots using Core Engine
  const computedSlots = computeAvailability({
    date: targetDate,
    courts: courtsList.map((c) => ({
      id: c.id,
      name: c.name,
      slotMinutes: c.slotMinutes,
      sortOrder: c.sortOrder,
      isBookable: c.isBookable,
    })),
    hours: hoursList.map((h) => ({
      courtId: h.courtId,
      weekday: h.weekday,
      openMinutes: h.openMinutes,
      closeMinutes: h.closeMinutes,
    })),
    priceRules: priceRulesList.map((r) => ({
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
    })),
    bookings: existingBookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      courtId: b.court_id,
      startsAt: new Date(b.starts_at),
      endsAt: new Date(b.ends_at),
      status: b.status as 'held' | 'confirmed',
      expiresAt: null,
      channelCode: b.channel_code,
      channelName: b.channel_name,
      channelColourHex: '#000000',
      customerName: b.customer_name,
      customerPhone: b.customer_phone,
      partnerReference: b.partner_reference,
      amountPaise: b.amount_paise,
      paidPaise: b.paid_paise,
    })),
    blackouts: existingBlackouts.map((bl) => ({
      id: bl.id,
      courtId: bl.courtId,
      startsAt: bl.startsAt,
      endsAt: bl.endsAt,
      reason: bl.reason,
    })),
    now,
    offsetMinutes: IST_OFFSET_MINUTES,
  });

  // Helper to match booking info
  function getBookingForSlot(courtId: string, startMin: number) {
    return existingBookings.find((b) => {
      if (b.court_id !== courtId) return false;
      const bMin = localMinutes(new Date(b.starts_at), IST_OFFSET_MINUTES);
      return bMin === startMin;
    });
  }

  // 4. Build Hour Rows (06:00 to 23:00 / 00:00)
  const hourRowsMap = new Map<number, DayHourRow>();

  for (const s of computedSlots) {
    const startMin = s.startMinutes;
    const endMin = s.startMinutes + 60;
    const hourLabel = minutesToLabel(startMin);

    if (!hourRowsMap.has(startMin)) {
      hourRowsMap.set(startMin, {
        hourLabel,
        startMinutes: startMin,
        slotsByCourt: {},
      });
    }

    const row = hourRowsMap.get(startMin)!;
    const court = courtsList.find((c) => c.id === s.courtId);
    const bMatch = getBookingForSlot(s.courtId, startMin);

    const isPast = isToday ? startMin + 60 <= currentIstMin : targetDate < todayYmd;

    let slotBooking: DaySlotCell['booking'] | undefined;
    if (bMatch) {
      slotBooking = {
        id: bMatch.id,
        reference: bMatch.reference,
        customerName: bMatch.customer_name || 'Walk-in Guest',
        customerPhone: bMatch.customer_phone || '—',
        channelCode: bMatch.channel_code,
        channelName: bMatch.channel_name,
        isOnline: bMatch.is_online,
        isPartner: bMatch.settles_later,
        partnerReference: bMatch.partner_reference,
        amountPaise: bMatch.amount_paise,
        paidPaise: bMatch.paid_paise,
        isPaid: bMatch.settles_later ? true : bMatch.is_paid,
        status: bMatch.status,
      };
    }

    row.slotsByCourt[s.courtId] = {
      courtId: s.courtId,
      courtName: court ? court.name : 'Court',
      startMinutes: startMin,
      endMinutes: endMin,
      timeLabel: `${minutesToLabel(startMin)}–${minutesToLabel(endMin)}`,
      state: s.state,
      isPast,
      pricePaise: s.pricePaise ?? 80000,
      priceFormatted: s.pricePaise !== null ? formatPaise(s.pricePaise) : '—',
      booking: slotBooking,
      blackoutReason: s.blackoutReason,
    };
  }

  // Sort hour rows chronologically
  const hours = Array.from(hourRowsMap.values()).sort((a, b) => a.startMinutes - b.startMinutes);

  return {
    date: targetDate,
    dateFormatted,
    courts: courtsList.map((c) => ({ id: c.id, name: c.name })),
    hours,
    currentIstMinutes: currentIstMin,
    isToday,
    prevDate,
    nextDate,
  };
}
