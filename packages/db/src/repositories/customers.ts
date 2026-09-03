import type { Database } from '../client.js';
import { customers } from '../schema/customers.js';
import { bookings } from '../schema/bookings.js';
import { courts } from '../schema/courts.js';
import { channels } from '../schema/channels.js';
import { sql, eq, desc } from 'drizzle-orm';
import { businessDate, IST_OFFSET_MINUTES, minutesToLabel, localMinutes } from '@pavilion/core';

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  noShowCount: number;
  isBlocked: boolean;
  blockedReason: string | null;
  bookingCount: number;
  totalSpentPaise: number;
  createdAt: string;
}

export interface CustomerBookingHistoryItem {
  id: string;
  reference: string;
  businessDate: string;
  startsAt: string;
  endsAt: string;
  timeLabel: string;
  dateFormatted: string;
  courtName: string;
  channelName: string;
  amountPaise: number;
  status: string;
  isPaid: boolean;
}

export interface CustomerDetailData {
  customer: CustomerListItem;
  history: CustomerBookingHistoryItem[];
}

export async function getCustomersList(
  db: Database,
  searchQuery?: string
): Promise<CustomerListItem[]> {
  const q = searchQuery?.trim() || '';

  let whereClause = sql`1=1`;
  if (q.length > 0) {
    const term = `%${q}%`;
    const cleanPhoneDigits = q.replace(/[^\d]/g, '');
    const phoneTerm = cleanPhoneDigits.length >= 3 ? `%${cleanPhoneDigits}%` : term;
    whereClause = sql`c.name ILIKE ${term} OR c.phone ILIKE ${phoneTerm} OR c.email ILIKE ${term}`;
  }

  const query = await db.execute<{
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    notes: string | null;
    no_show_count: number;
    is_blocked: boolean;
    blocked_reason: string | null;
    created_at: string;
    booking_count: number;
    total_spent_paise: number;
  }>(sql`
    SELECT 
      c.id,
      c.name,
      c.phone,
      c.email,
      c.notes,
      c.no_show_count,
      c.is_blocked,
      c.blocked_reason,
      c.created_at,
      COUNT(b.id)::int AS booking_count,
      COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.amount_paise ELSE 0 END), 0)::int AS total_spent_paise
    FROM customers c
    LEFT JOIN bookings b ON c.id = b.customer_id
    WHERE ${whereClause}
    GROUP BY c.id
    ORDER BY booking_count DESC, c.created_at DESC
    LIMIT 50
  `);

  return query.rows.map((row) => ({
    id: row.id,
    name: row.name || 'Walk-in Player',
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    noShowCount: row.no_show_count,
    isBlocked: row.is_blocked,
    blockedReason: row.blocked_reason,
    bookingCount: Number(row.booking_count),
    totalSpentPaise: Number(row.total_spent_paise),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function getCustomerDetail(
  db: Database,
  customerId: string
): Promise<CustomerDetailData | null> {
  const custList = await db.execute<{
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    notes: string | null;
    no_show_count: number;
    is_blocked: boolean;
    blocked_reason: string | null;
    created_at: string;
    booking_count: number;
    total_spent_paise: number;
  }>(sql`
    SELECT 
      c.id,
      c.name,
      c.phone,
      c.email,
      c.notes,
      c.no_show_count,
      c.is_blocked,
      c.blocked_reason,
      c.created_at,
      COUNT(b.id)::int AS booking_count,
      COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.amount_paise ELSE 0 END), 0)::int AS total_spent_paise
    FROM customers c
    LEFT JOIN bookings b ON c.id = b.customer_id
    WHERE c.id = ${customerId}::uuid
    GROUP BY c.id
    LIMIT 1
  `);

  if (custList.rows.length === 0) return null;
  const row = custList.rows[0]!;

  const customer: CustomerListItem = {
    id: row.id,
    name: row.name || 'Walk-in Player',
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    noShowCount: row.no_show_count,
    isBlocked: row.is_blocked,
    blockedReason: row.blocked_reason,
    bookingCount: Number(row.booking_count),
    totalSpentPaise: Number(row.total_spent_paise),
    createdAt: new Date(row.created_at).toISOString(),
  };

  const historyQuery = await db.execute<{
    id: string;
    reference: string;
    business_date: string;
    starts_at: string;
    ends_at: string;
    court_name: string;
    channel_name: string;
    amount_paise: number;
    status: string;
    is_paid: boolean;
  }>(sql`
    SELECT 
      b.id,
      b.reference,
      b.business_date::text,
      b.starts_at,
      b.ends_at,
      ct.name AS court_name,
      COALESCE(ch.name, 'Walk-in') AS channel_name,
      b.amount_paise,
      b.status,
      COALESCE(bal.is_paid, false) AS is_paid
    FROM bookings b
    JOIN courts ct ON b.court_id = ct.id
    LEFT JOIN channels ch ON b.channel_id = ch.id
    LEFT JOIN booking_balances bal ON b.id = bal.booking_id
    WHERE b.customer_id = ${customerId}::uuid
    ORDER BY b.starts_at DESC
  `);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const history: CustomerBookingHistoryItem[] = historyQuery.rows.map((h) => {
    const bDate = h.business_date.split('T')[0]!;
    const [y, m, d] = bDate.split('-').map(Number) as [number, number, number];
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dateFormatted = `${dayNames[dateObj.getUTCDay()]} ${d} ${monthNames[dateObj.getUTCMonth()]}`;

    const startMin = localMinutes(new Date(h.starts_at), IST_OFFSET_MINUTES);
    const endMin = localMinutes(new Date(h.ends_at), IST_OFFSET_MINUTES);
    const timeLabel = `${minutesToLabel(startMin)}–${minutesToLabel(endMin)}`;

    return {
      id: h.id,
      reference: h.reference,
      businessDate: bDate,
      startsAt: h.starts_at,
      endsAt: h.ends_at,
      timeLabel,
      dateFormatted,
      courtName: h.court_name,
      channelName: h.channel_name,
      amountPaise: h.amount_paise,
      status: h.status,
      isPaid: h.is_paid,
    };
  });

  return { customer, history };
}

export async function setCustomerBlocked(
  db: Database,
  customerId: string,
  isBlocked: boolean,
  reason?: string
): Promise<void> {
  await db
    .update(customers)
    .set({
      isBlocked,
      blockedReason: isBlocked ? reason || 'Blocked by front desk' : null,
      blockedAt: isBlocked ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));
}

export async function updateCustomerNotes(
  db: Database,
  customerId: string,
  notes: string
): Promise<void> {
  await db
    .update(customers)
    .set({
      notes: notes.trim(),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));
}
