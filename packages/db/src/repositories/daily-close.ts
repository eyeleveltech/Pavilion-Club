import type { Database } from '../client.js';
import { bookings } from '../schema/bookings.js';
import { payments, cashHandovers } from '../schema/money.js';
import { courts } from '../schema/courts.js';
import { channels } from '../schema/channels.js';
import { customers } from '../schema/customers.js';
import { users } from '../schema/users.js';
import { sql, eq, and, desc } from 'drizzle-orm';
import {
  businessDate,
  IST_OFFSET_MINUTES,
  minutesToLabel,
  localMinutes,
  shiftDate,
  formatPaise,
} from '@pavilion/core';

export interface CourtDailySummary {
  courtId: string;
  courtName: string;
  bookingCount: number;
  bookedValuePaise: number;
}

export interface PaymentMethodBreakdown {
  cashPaise: number;
  cashCount: number;
  cardPaise: number;
  cardCount: number;
  gatewayPaise: number;
  gatewayCount: number;
  totalCollectedPaise: number;
}

export interface StillOwingBookingItem {
  id: string;
  reference: string;
  courtName: string;
  timeLabel: string;
  customerName: string;
  customerPhone: string;
  amountPaise: number;
  paidPaise: number;
  balanceDuePaise: number;
}

export interface CashHandoverHistoryItem {
  id: string;
  staffName: string;
  acceptedByName: string | null;
  expectedPaise: number;
  declaredPaise: number;
  variancePaise: number;
  note: string | null;
  createdAt: string;
}

export interface DailyCloseData {
  businessDate: string;
  dateFormatted: string;
  isToday: boolean;
  prevDate: string;
  nextDate: string;
  byCourt: CourtDailySummary[];
  collection: PaymentMethodBreakdown;
  expectedCashPaise: number;
  totalBookedValuePaise: number;
  totalStillOwingPaise: number;
  stillOwingBookings: StillOwingBookingItem[];
  handovers: CashHandoverHistoryItem[];
  activeStaffList: { id: string; name: string; role: string }[];
}

export async function getDailyCloseData(
  db: Database,
  dateParam?: string
): Promise<DailyCloseData> {
  const now = new Date();
  const todayYmd = businessDate(now, IST_OFFSET_MINUTES, 5);
  const targetDate = dateParam || todayYmd;
  const isToday = targetDate === todayYmd;

  const prevDate = shiftDate(targetDate, -1);
  const nextDate = shiftDate(targetDate, 1);

  // Formatted date string
  const [y, m, d] = targetDate.split('-').map(Number) as [number, number, number];
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dateFormatted = `${dayNames[dateObj.getUTCDay()]} ${d} ${monthNames[dateObj.getUTCMonth()]} ${y}`;

  // 1. By Court Bookings and Value
  const courtSummaryQuery = await db.execute<{
    court_id: string;
    court_name: string;
    booking_count: number;
    booked_value_paise: number;
  }>(sql`
    SELECT 
      ct.id AS court_id,
      ct.name AS court_name,
      COUNT(b.id)::int AS booking_count,
      COALESCE(SUM(b.amount_paise), 0)::int AS booked_value_paise
    FROM courts ct
    LEFT JOIN bookings b ON ct.id = b.court_id 
      AND b.business_date = ${targetDate}::date
      AND b.status IN ('confirmed', 'completed', 'no_show')
    GROUP BY ct.id, ct.sort_order, ct.name
    ORDER BY ct.sort_order ASC
  `);

  const byCourt: CourtDailySummary[] = courtSummaryQuery.rows.map((row) => ({
    courtId: row.court_id,
    courtName: row.court_name,
    bookingCount: Number(row.booking_count),
    bookedValuePaise: Number(row.booked_value_paise),
  }));

  const totalBookedValuePaise = byCourt.reduce((acc, c) => acc + c.bookedValuePaise, 0);

  // 2. Collection Split by Method (payments where received_on = targetDate)
  const paymentsQuery = await db.execute<{
    method: string;
    total_paise: number;
    count: number;
  }>(sql`
    SELECT 
      p.method,
      COALESCE(SUM(p.amount_paise), 0)::int AS total_paise,
      COUNT(p.id)::int AS count
    FROM payments p
    WHERE p.received_on = ${targetDate}::date
      AND p.status = 'captured'
    GROUP BY p.method
  `);

  let cashPaise = 0;
  let cashCount = 0;
  let cardPaise = 0;
  let cardCount = 0;
  let gatewayPaise = 0;
  let gatewayCount = 0;

  for (const row of paymentsQuery.rows) {
    const pAmount = Number(row.total_paise);
    const pCount = Number(row.count);

    if (row.method === 'cash') {
      cashPaise += pAmount;
      cashCount += pCount;
    } else if (row.method === 'card') {
      cardPaise += pAmount;
      cardCount += pCount;
    } else {
      gatewayPaise += pAmount;
      gatewayCount += pCount;
    }
  }

  const totalCollectedPaise = cashPaise + cardPaise + gatewayPaise;

  const collection: PaymentMethodBreakdown = {
    cashPaise,
    cashCount,
    cardPaise,
    cardCount,
    gatewayPaise,
    gatewayCount,
    totalCollectedPaise,
  };

  // 3. Still Owing Bookings on this business date
  const owingQuery = await db.execute<{
    id: string;
    reference: string;
    court_name: string;
    starts_at: string;
    ends_at: string;
    customer_name: string | null;
    customer_phone: string | null;
    amount_paise: number;
    paid_paise: number;
  }>(sql`
    SELECT 
      b.id,
      b.reference,
      ct.name AS court_name,
      b.starts_at,
      b.ends_at,
      c.name AS customer_name,
      c.phone AS customer_phone,
      b.amount_paise,
      COALESCE(bal.paid_paise, 0)::int AS paid_paise
    FROM bookings b
    JOIN courts ct ON b.court_id = ct.id
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN channels ch ON b.channel_id = ch.id
    LEFT JOIN booking_balances bal ON b.id = bal.booking_id
    WHERE b.business_date = ${targetDate}::date
      AND b.status IN ('confirmed', 'completed')
      AND (ch.settles_later IS NULL OR ch.settles_later = false)
      AND COALESCE(bal.paid_paise, 0) < b.amount_paise
    ORDER BY b.starts_at ASC
  `);

  const stillOwingBookings: StillOwingBookingItem[] = owingQuery.rows.map((row) => {
    const startMin = localMinutes(new Date(row.starts_at), IST_OFFSET_MINUTES);
    const endMin = localMinutes(new Date(row.ends_at), IST_OFFSET_MINUTES);
    const amount = Number(row.amount_paise);
    const paid = Number(row.paid_paise);

    return {
      id: row.id,
      reference: row.reference,
      courtName: row.court_name,
      timeLabel: `${minutesToLabel(startMin)}–${minutesToLabel(endMin)}`,
      customerName: row.customer_name || 'Walk-in Guest',
      customerPhone: row.customer_phone || '—',
      amountPaise: amount,
      paidPaise: paid,
      balanceDuePaise: amount - paid,
    };
  });

  const totalStillOwingPaise = stillOwingBookings.reduce((acc, b) => acc + b.balanceDuePaise, 0);

  // 4. Past Handover Records for this date
  const handoversQuery = await db.execute<{
    id: string;
    staff_name: string;
    accepted_by_name: string | null;
    expected_paise: number;
    declared_paise: number;
    variance_paise: number;
    note: string | null;
    created_at: string;
  }>(sql`
    SELECT 
      h.id,
      u1.name AS staff_name,
      u2.name AS accepted_by_name,
      h.expected_paise,
      h.declared_paise,
      h.variance_paise,
      h.note,
      h.created_at
    FROM cash_handovers h
    JOIN users u1 ON h.staff_user_id = u1.id
    LEFT JOIN users u2 ON h.accepted_by = u2.id
    WHERE h.business_date = ${targetDate}::date
    ORDER BY h.created_at DESC
  `);

  const handovers: CashHandoverHistoryItem[] = handoversQuery.rows.map((row) => ({
    id: row.id,
    staffName: row.staff_name,
    acceptedByName: row.accepted_by_name,
    expectedPaise: Number(row.expected_paise),
    declaredPaise: Number(row.declared_paise),
    variancePaise: Number(row.variance_paise),
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
  }));

  // 5. Active Staff List for handover recipient
  const staffQuery = await db.execute<{ id: string; name: string; role: string }>(sql`
    SELECT id, name, role FROM users WHERE is_active = true ORDER BY name ASC
  `);

  return {
    businessDate: targetDate,
    dateFormatted,
    isToday,
    prevDate,
    nextDate,
    byCourt,
    collection,
    expectedCashPaise: cashPaise,
    totalBookedValuePaise,
    totalStillOwingPaise,
    stillOwingBookings,
    handovers,
    activeStaffList: staffQuery.rows.map((s) => ({ id: s.id, name: s.name, role: s.role })),
  };
}

export async function submitCashHandover(
  db: Database,
  input: {
    businessDate: string;
    staffUserId: string;
    expectedPaise: number;
    declaredPaise: number;
    acceptedBy?: string | undefined;
    note?: string | undefined;
  }
): Promise<{ id: string; variancePaise: number }> {
  const variancePaise = input.declaredPaise - input.expectedPaise;

  const inserted = await db
    .insert(cashHandovers)
    .values({
      businessDate: input.businessDate,
      staffUserId: input.staffUserId,
      expectedPaise: input.expectedPaise,
      declaredPaise: input.declaredPaise,
      acceptedBy: input.acceptedBy || null,
      note: input.note || null,
    })
    .returning({ id: cashHandovers.id, variancePaise: cashHandovers.variancePaise });

  return {
    id: inserted[0]!.id,
    variancePaise: inserted[0]!.variancePaise ?? variancePaise,
  };
}
