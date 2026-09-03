import type { Database } from '../client.js';
import { bookings } from '../schema/bookings.js';
import { customers } from '../schema/customers.js';
import { courts } from '../schema/courts.js';
import { channels } from '../schema/channels.js';
import { sql } from 'drizzle-orm';
import { businessDate, IST_OFFSET_MINUTES, minutesToLabel, localMinutes } from '@pavilion/core';

export interface SearchBookingResult {
  id: string;
  reference: string;
  partnerReference: string | null;
  businessDate: string;
  startsAt: string;
  endsAt: string;
  timeLabel: string;
  dateFormatted: string;
  courtId: string;
  courtName: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  channelCode: string;
  channelName: string;
  isOnline: boolean;
  isPartner: boolean;
  amountPaise: number;
  paidPaise: number;
  isPaid: boolean;
  status: string;
  isToday: boolean;
}

export async function searchBookings(
  db: Database,
  rawQuery?: string
): Promise<SearchBookingResult[]> {
  const q = rawQuery?.trim() || '';
  const now = new Date();
  const todayYmd = businessDate(now, IST_OFFSET_MINUTES, 5);

  let whereClause = sql`b.status IN ('confirmed', 'held', 'completed')`;

  if (q.length > 0) {
    const term = `%${q}%`;
    const cleanPhoneDigits = q.replace(/[^\d]/g, '');
    const phoneTerm = cleanPhoneDigits.length >= 3 ? `%${cleanPhoneDigits}%` : term;

    whereClause = sql`${whereClause} AND (
      b.reference ILIKE ${term}
      OR b.partner_reference ILIKE ${term}
      OR c.name ILIKE ${term}
      OR c.phone ILIKE ${phoneTerm}
    )`;
  }

  const query = await db.execute<{
    id: string;
    reference: string;
    partner_reference: string | null;
    business_date: string;
    starts_at: string;
    ends_at: string;
    court_id: string;
    court_name: string;
    customer_id: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    channel_code: string;
    channel_name: string;
    is_online: boolean;
    settles_later: boolean;
    amount_paise: number;
    paid_paise: number;
    is_paid: boolean;
    status: string;
  }>(sql`
    SELECT 
      b.id,
      b.reference,
      b.partner_reference,
      b.business_date::text,
      b.starts_at,
      b.ends_at,
      ct.id AS court_id,
      ct.name AS court_name,
      c.id AS customer_id,
      c.name AS customer_name,
      c.phone AS customer_phone,
      ch.code AS channel_code,
      ch.name AS channel_name,
      ch.is_online,
      ch.settles_later,
      b.amount_paise,
      COALESCE(bal.paid_paise, 0)::int AS paid_paise,
      COALESCE(bal.is_paid, false) AS is_paid,
      b.status
    FROM bookings b
    JOIN courts ct ON b.court_id = ct.id
    LEFT JOIN channels ch ON b.channel_id = ch.id
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN booking_balances bal ON b.id = bal.booking_id
    WHERE ${whereClause}
    ORDER BY 
      CASE 
        WHEN b.business_date = ${todayYmd}::date THEN 0
        WHEN b.business_date > ${todayYmd}::date THEN 1
        ELSE 2
      END ASC,
      b.starts_at DESC
    LIMIT 30
  `);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return query.rows.map((row) => {
    const bDate = row.business_date.split('T')[0]!;
    const [y, m, d] = bDate.split('-').map(Number) as [number, number, number];
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dateFormatted = `${dayNames[dateObj.getUTCDay()]} ${d} ${monthNames[dateObj.getUTCMonth()]}`;

    const startMin = localMinutes(new Date(row.starts_at), IST_OFFSET_MINUTES);
    const endMin = localMinutes(new Date(row.ends_at), IST_OFFSET_MINUTES);
    const timeLabel = `${minutesToLabel(startMin)}–${minutesToLabel(endMin)}`;

    return {
      id: row.id,
      reference: row.reference,
      partnerReference: row.partner_reference,
      businessDate: bDate,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      timeLabel,
      dateFormatted,
      courtId: row.court_id,
      courtName: row.court_name,
      customerId: row.customer_id,
      customerName:
        row.customer_name ||
        (row.partner_reference ? `Turf Town · ${row.partner_reference}` : 'Walk-in Guest'),
      customerPhone: row.customer_phone || '—',
      channelCode: row.channel_code,
      channelName: row.channel_name,
      isOnline: row.is_online,
      isPartner: row.settles_later,
      amountPaise: row.amount_paise,
      paidPaise: row.paid_paise,
      isPaid: row.settles_later ? true : row.is_paid,
      status: row.status,
      isToday: bDate === todayYmd,
    };
  });
}
