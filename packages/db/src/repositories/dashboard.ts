import type { Database } from '../client.js';
import { courts, courtHours } from '../schema/courts.js';
import { bookings } from '../schema/bookings.js';
import { channels } from '../schema/channels.js';
import { payments, settlements } from '../schema/money.js';
import { blackouts } from '../schema/ops.js';
import {
  IST_OFFSET_MINUTES,
  businessDate,
  localDate,
  localMinutes,
  shiftDate,
  weekdayOf,
  formatPaise,
} from '@pavilion/core';
import { eq, and, inArray, sql } from 'drizzle-orm';

export interface DayOccupancy {
  date: string;
  dayLabel: string;
  bookedSlots: number;
  totalSlots: number;
  percentage: number;
  isToday: boolean;
}

export interface DashboardData {
  todayDateFormatted: string;
  businessDate: string;
  bookingsToday: {
    bookedCount: number;
    capacitySlots: number;
    percentage: number;
  };
  collectedToday: {
    totalPaise: number;
    paymentsCount: number;
  };
  bookedValueToday: {
    totalPaise: number;
  };
  stillOwingToday: {
    totalPaise: number;
    unpaidCount: number;
  };
  onlineVsOffline: {
    onlineCount: number;
    onlinePaise: number;
    offlineCount: number;
    offlinePaise: number;
  };
  partnerOutstanding: {
    totalPaise: number;
    bookingCount: number;
    partnerName: string;
  };
  next7Days: DayOccupancy[];
}

export async function getDashboardData(
  db: Database,
  at: Date = new Date()
): Promise<DashboardData> {
  const venueStartHour = 5;
  const todayYmd = businessDate(at, IST_OFFSET_MINUTES, venueStartHour);

  // Wall clock date formatting (e.g. Saturday 6 September)
  const wallClock = new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const todayDateFormatted = `${dayNames[wallClock.getUTCDay()]} ${wallClock.getUTCDate()} ${monthNames[wallClock.getUTCMonth()]}`;

  // 1. Fetch courts and opening hours for capacity calculation
  const bookableCourts = await db
    .select()
    .from(courts)
    .where(eq(courts.isBookable, true))
    .orderBy(courts.sortOrder);

  const allCourtHours = await db.select().from(courtHours);

  // Helper to get capacity for any given date
  function getCapacityForDate(dateStr: string): number {
    const weekday = weekdayOf(dateStr);
    let totalSlots = 0;
    for (const c of bookableCourts) {
      const hours = allCourtHours.find((h) => h.courtId === c.id && h.weekday === weekday);
      if (hours) {
        const slotsForCourt = Math.floor((hours.closeMinutes - hours.openMinutes) / c.slotMinutes);
        totalSlots += Math.max(0, slotsForCourt);
      }
    }
    return totalSlots;
  }

  const todayCapacity = getCapacityForDate(todayYmd);

  // 2. Tile 1: Bookings Today (COUNT where business_date = today and status IN ('confirmed','completed','no_show'))
  const todayBookingsQuery = await db.execute<{
    count: string;
    total_booked_paise: string;
  }>(sql`
    SELECT 
      COUNT(*)::int AS count,
      COALESCE(SUM(amount_paise), 0)::bigint AS total_booked_paise
    FROM bookings
    WHERE business_date = ${todayYmd}
      AND status IN ('confirmed', 'completed', 'no_show')
  `);

  const bookedCount = Number(todayBookingsQuery.rows[0]?.count ?? 0);
  const bookedValuePaise = Number(todayBookingsQuery.rows[0]?.total_booked_paise ?? 0);
  const fillPercentage = todayCapacity > 0 ? Math.round((bookedCount / todayCapacity) * 100) : 0;

  // 3. Tile 2: Collected Today (SUM payments received_on = today)
  const todayPaymentsQuery = await db.execute<{
    total_collected_paise: string;
    payments_count: string;
  }>(sql`
    SELECT 
      COALESCE(SUM(amount_paise), 0)::bigint AS total_collected_paise,
      COUNT(*)::int AS payments_count
    FROM payments
    WHERE received_on = ${todayYmd}
      AND status = 'captured'
  `);

  const collectedTodayPaise = Number(todayPaymentsQuery.rows[0]?.total_collected_paise ?? 0);
  const paymentsCount = Number(todayPaymentsQuery.rows[0]?.payments_count ?? 0);

  // 4. Tile 4: Still Owing (Confirmed bookings today with due balance on non-settles_later channels)
  const stillOwingQuery = await db.execute<{
    still_owing_paise: string;
    unpaid_count: string;
  }>(sql`
    SELECT 
      COALESCE(SUM(bal.due_paise), 0)::bigint AS still_owing_paise,
      COUNT(*)::int AS unpaid_count
    FROM bookings b
    JOIN channels ch ON b.channel_id = ch.id
    JOIN booking_balances bal ON b.id = bal.booking_id
    WHERE b.business_date = ${todayYmd}
      AND b.status = 'confirmed'
      AND ch.settles_later = false
      AND bal.due_paise > 0
  `);

  const stillOwingPaise = Number(stillOwingQuery.rows[0]?.still_owing_paise ?? 0);
  const unpaidCount = Number(stillOwingQuery.rows[0]?.unpaid_count ?? 0);

  // 5. Online vs Offline breakdown for today
  const onlineOfflineQuery = await db.execute<{
    is_online: boolean;
    count: string;
    total_paise: string;
  }>(sql`
    SELECT 
      ch.is_online,
      COUNT(b.id)::int AS count,
      COALESCE(SUM(b.amount_paise), 0)::bigint AS total_paise
    FROM bookings b
    JOIN channels ch ON b.channel_id = ch.id
    WHERE b.business_date = ${todayYmd}
      AND b.status IN ('confirmed', 'completed', 'no_show')
    GROUP BY ch.is_online
  `);

  let onlineCount = 0;
  let onlinePaise = 0;
  let offlineCount = 0;
  let offlinePaise = 0;

  for (const row of onlineOfflineQuery.rows) {
    if (row.is_online) {
      onlineCount = Number(row.count);
      onlinePaise = Number(row.total_paise);
    } else {
      offlineCount = Number(row.count);
      offlinePaise = Number(row.total_paise);
    }
  }

  // 6. Partner Outstanding (Turf Town): Bookings on settles_later with settlement_id IS NULL
  const partnerQuery = await db.execute<{
    partner_paise: string;
    partner_bookings_count: string;
  }>(sql`
    SELECT 
      COALESCE(SUM(b.amount_paise), 0)::bigint AS partner_paise,
      COUNT(b.id)::int AS partner_bookings_count
    FROM bookings b
    JOIN channels ch ON b.channel_id = ch.id
    LEFT JOIN settlements s ON b.settlement_id = s.id
    WHERE ch.settles_later = true
      AND b.status IN ('confirmed', 'completed')
      AND (b.settlement_id IS NULL OR s.status != 'settled')
  `);

  const partnerOutstandingPaise = Number(partnerQuery.rows[0]?.partner_paise ?? 0);
  const partnerBookingsCount = Number(partnerQuery.rows[0]?.partner_bookings_count ?? 0);

  // 7. Next 7 Days Occupancy Strip
  const next7Days: DayOccupancy[] = [];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const targetDate = shiftDate(todayYmd, i);
    const dateObj = new Date(targetDate + 'T00:00:00Z');
    const dayNameShort = shortDays[weekdayOf(targetDate)];
    const dayOfMonth = dateObj.getUTCDate();
    const capacity = getCapacityForDate(targetDate);

    // Count bookings on target date
    const dayQuery = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::int AS count
      FROM bookings
      WHERE business_date = ${targetDate}
        AND status IN ('confirmed', 'held', 'completed')
    `);

    const dayBookedCount = Number(dayQuery.rows[0]?.count ?? 0);
    const dayPct = capacity > 0 ? Math.round((dayBookedCount / capacity) * 100) : 0;

    next7Days.push({
      date: targetDate,
      dayLabel: `${dayNameShort} ${dayOfMonth}`,
      bookedSlots: dayBookedCount,
      totalSlots: capacity,
      percentage: dayPct,
      isToday: i === 0,
    });
  }

  return {
    todayDateFormatted,
    businessDate: todayYmd,
    bookingsToday: {
      bookedCount,
      capacitySlots: todayCapacity,
      percentage: fillPercentage,
    },
    collectedToday: {
      totalPaise: collectedTodayPaise,
      paymentsCount,
    },
    bookedValueToday: {
      totalPaise: bookedValuePaise,
    },
    stillOwingToday: {
      totalPaise: stillOwingPaise,
      unpaidCount,
    },
    onlineVsOffline: {
      onlineCount,
      onlinePaise,
      offlineCount,
      offlinePaise,
    },
    partnerOutstanding: {
      totalPaise: partnerOutstandingPaise,
      bookingCount: partnerBookingsCount,
      partnerName: 'Turf Town',
    },
    next7Days,
  };
}
