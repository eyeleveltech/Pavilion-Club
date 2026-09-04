import type { Database } from '../client.js';
import { settlements } from '../schema/money.js';
import { channels } from '../schema/channels.js';
import { bookings } from '../schema/bookings.js';
import { payments } from '../schema/money.js';
import { apiKeys } from '../schema/partner.js';
import { bookingAttempts } from '../schema/ops.js';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';

export interface SourceReportItem {
  channelId: string;
  channelName: string;
  kind: string;
  settlesLater: boolean;
  commissionBps: number;
  bookingsCount: number;
  hoursCount: number;
  bookedPaise: number;
  collectedPaise: number;
  commissionPaise: number;
  netOwedPaise: number;
  settlementStatus: string;
}

export async function getSourceWiseReport(
  db: Database,
  fromDate: string,
  toDate: string
): Promise<{
  period: { from: string; to: string };
  rows: SourceReportItem[];
  totals: {
    bookingsCount: number;
    hoursCount: number;
    bookedPaise: number;
    collectedPaise: number;
    commissionPaise: number;
    netOwedPaise: number;
  };
}> {
  // Query source-wise breakdown (excluding sandbox bookings per docs/system/10-reports-export.md)
  const result = await db.execute<{
    id: string;
    name: string;
    kind: string;
    settles_later: boolean;
    commission_bps: number;
    bookings: number;
    hours: number;
    booked_paise: number;
    collected_paise: number;
  }>(sql`
    SELECT 
      c.id, 
      c.name, 
      c.kind, 
      c.settles_later, 
      c.commission_bps,
      COUNT(*)::int AS bookings,
      COALESCE(SUM(EXTRACT(EPOCH FROM (b.ends_at - b.starts_at)) / 3600), 0)::float AS hours,
      COALESCE(SUM(b.amount_paise), 0)::int AS booked_paise,
      COALESCE(SUM(p.paid_paise), 0)::int AS collected_paise
    FROM bookings b
    JOIN channels c ON c.id = b.channel_id
    LEFT JOIN LATERAL (
      SELECT SUM(amount_paise) AS paid_paise
      FROM payments 
      WHERE booking_id = b.id AND status = 'captured'
    ) p ON true
    WHERE b.business_date >= ${fromDate}::date 
      AND b.business_date <= ${toDate}::date
      AND b.status IN ('confirmed', 'completed', 'no_show')
      AND NOT EXISTS (SELECT 1 FROM api_keys k WHERE k.id = b.api_key_id AND k.is_sandbox = true)
    GROUP BY c.id, c.name, c.kind, c.settles_later, c.commission_bps
    ORDER BY booked_paise DESC;
  `);

  const rows: SourceReportItem[] = [];
  let totalBookings = 0;
  let totalHours = 0;
  let totalBooked = 0;
  let totalCollected = 0;
  let totalCommission = 0;
  let totalNetOwed = 0;

  for (const r of result.rows) {
    const booked = Number(r.booked_paise);
    const collected = Number(r.collected_paise);
    const commBps = Number(r.commission_bps || 0);
    const commission = Math.round((booked * commBps) / 10000);
    const netOwed = r.settles_later ? Math.max(0, booked - commission - collected) : 0;

    const item: SourceReportItem = {
      channelId: r.id,
      channelName: r.name,
      kind: r.kind,
      settlesLater: r.settles_later,
      commissionBps: commBps,
      bookingsCount: Number(r.bookings),
      hoursCount: Math.round(Number(r.hours) * 10) / 10,
      bookedPaise: booked,
      collectedPaise: collected,
      commissionPaise: commission,
      netOwedPaise: netOwed,
      settlementStatus: r.settles_later ? (netOwed === 0 ? 'settled' : 'pending') : 'collected_direct',
    };

    rows.push(item);
    totalBookings += item.bookingsCount;
    totalHours += item.hoursCount;
    totalBooked += item.bookedPaise;
    totalCollected += item.collectedPaise;
    totalCommission += item.commissionPaise;
    totalNetOwed += item.netOwedPaise;
  }

  return {
    period: { from: fromDate, to: toDate },
    rows,
    totals: {
      bookingsCount: totalBookings,
      hoursCount: Math.round(totalHours * 10) / 10,
      bookedPaise: totalBooked,
      collectedPaise: totalCollected,
      commissionPaise: totalCommission,
      netOwedPaise: totalNetOwed,
    },
  };
}

// 2. Missed Demand Report
export async function getMissedDemandReport(
  db: Database,
  fromDate: string,
  toDate: string
) {
  // Query failure reasons
  const reasonQuery = await db.execute<{ failure_reason: string; count: number }>(sql`
    SELECT COALESCE(outcome, 'unspecified') AS failure_reason, COUNT(*)::int AS count
    FROM booking_attempts
    WHERE created_at >= ${fromDate}::date AND created_at <= (${toDate}::date + INTERVAL '1 day')
      AND outcome != 'success'
    GROUP BY outcome
    ORDER BY count DESC
  `);

  return {
    period: { from: fromDate, to: toDate },
    reasons: reasonQuery.rows.map((r) => ({
      reason: r.failure_reason,
      count: Number(r.count),
    })),
  };
}

// 3. Occupancy Report
export async function getOccupancyReport(
  db: Database,
  fromDate: string,
  toDate: string
) {
  const result = await db.execute<{
    court_name: string;
    total_bookings: number;
    total_hours: number;
  }>(sql`
    SELECT 
      ct.name AS court_name,
      COUNT(b.id)::int AS total_bookings,
      COALESCE(SUM(EXTRACT(EPOCH FROM (b.ends_at - b.starts_at)) / 3600), 0)::float AS total_hours
    FROM courts ct
    LEFT JOIN bookings b ON b.court_id = ct.id 
      AND b.business_date >= ${fromDate}::date 
      AND b.business_date <= ${toDate}::date
      AND b.status IN ('confirmed', 'completed')
    WHERE ct.is_bookable = true
    GROUP BY ct.name
    ORDER BY ct.name ASC
  `);

  return {
    period: { from: fromDate, to: toDate },
    courts: result.rows.map((r) => ({
      courtName: r.court_name,
      totalBookings: Number(r.total_bookings),
      totalHours: Math.round(Number(r.total_hours) * 10) / 10,
    })),
  };
}

// 4. Create Settlement
export async function createSettlement(
  db: Database,
  input: {
    channelId: string;
    periodStart: string;
    periodEnd: string;
    createdByUserId?: string;
  }
) {
  // Calculate bookings in period
  const query = await db.execute<{
    count: number;
    gross_paise: number;
  }>(sql`
    SELECT 
      COUNT(b.id)::int AS count,
      COALESCE(SUM(b.amount_paise), 0)::int AS gross_paise
    FROM bookings b
    WHERE b.channel_id = ${input.channelId}::uuid
      AND b.business_date >= ${input.periodStart}::date
      AND b.business_date <= ${input.periodEnd}::date
      AND b.status IN ('confirmed', 'completed', 'no_show')
      AND NOT EXISTS (SELECT 1 FROM api_keys k WHERE k.id = b.api_key_id AND k.is_sandbox = true)
  `);

  const count = Number(query.rows[0]?.count || 0);
  const grossPaise = Number(query.rows[0]?.gross_paise || 0);

  const [channel] = await db.select().from(channels).where(eq(channels.id, input.channelId));
  const commBps = channel?.commissionBps || 0;
  const commissionPaise = Math.round((grossPaise * commBps) / 10000);
  const netPaise = Math.max(0, grossPaise - commissionPaise);

  const [settlement] = await db
    .insert(settlements)
    .values({
      channelId: input.channelId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      bookingCount: count,
      grossPaise,
      commissionPaise,
      netPaise,
      status: 'invoiced',
      invoicedAt: new Date(),
      createdBy: input.createdByUserId || null,
    })
    .returning();

  return settlement!;
}

// 5. Mark Settlement Settled
export async function markSettlementSettled(
  db: Database,
  input: {
    settlementId: string;
    settledAmountPaise: number;
    note?: string;
    staffUserId?: string;
  }
) {
  const [s] = await db.select().from(settlements).where(eq(settlements.id, input.settlementId));
  if (!s) throw new Error('Settlement not found');

  const now = new Date();

  // Find all confirmed bookings for this partner in that period
  const bookingsList = await db
    .select({ id: bookings.id, amountPaise: bookings.amountPaise, businessDate: bookings.businessDate })
    .from(bookings)
    .where(
      and(
        eq(bookings.channelId, s.channelId),
        gte(bookings.businessDate, s.periodStart),
        lte(bookings.businessDate, s.periodEnd),
        eq(bookings.status, 'confirmed')
      )
    );

  // Write payment rows with method = 'partner'
  for (const b of bookingsList) {
    const existing = await db.select().from(payments).where(eq(payments.bookingId, b.id)).limit(1);
    if (!existing[0]) {
      await db.insert(payments).values({
        bookingId: b.id,
        amountPaise: b.amountPaise,
        method: 'partner',
        status: 'captured',
        receivedOn: b.businessDate,
        note: `Settled via invoice ${s.id.slice(0, 8)}`,
      });
    }
  }

  const [updated] = await db
    .update(settlements)
    .set({
      status: 'settled',
      settledAt: now,
      settledAmountPaise: input.settledAmountPaise,
      note: input.note || null,
    })
    .where(eq(settlements.id, s.id))
    .returning();

  return updated!;
}

// 6. Write off Settlement
export async function writeOffSettlement(
  db: Database,
  settlementId: string,
  note: string
) {
  const [updated] = await db
    .update(settlements)
    .set({
      status: 'written_off',
      note,
    })
    .where(eq(settlements.id, settlementId))
    .returning();

  return updated!;
}
