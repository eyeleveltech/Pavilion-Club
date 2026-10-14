import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';
import {
  createDb,
  validateSession,
  requirePermission,
  getSourceWiseReport,
  bookings,
  channels,
  courts,
  customers,
  settlements,
  sql,
  eq,
  and,
} from '@pavilion/db';
import { minutesToLabel, localMinutes, IST_OFFSET_MINUTES } from '@pavilion/core';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    requirePermission(validated.user, 'reports:export');

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const defaultFrom = `${year}-${month}-01`;
    const defaultTo = `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`;

    const fromDate = searchParams.get('from') || defaultFrom;
    const toDate = searchParams.get('to') || defaultTo;
    const channelId = searchParams.get('channel_id') || undefined;

    // 1. Fetch Source Summary
    const summaryData = await getSourceWiseReport(db, fromDate, toDate);
    const filteredRows = channelId
      ? summaryData.rows.filter((r) => r.channelId === channelId)
      : summaryData.rows;

    // Build Sheet 1: Summary
    const summaryRows: (string | number)[][] = [
      ['The Pavilion Club — Financial Settlement & Source Report'],
      [`Period: ${fromDate} to ${toDate}`],
      [`Generated At: ${now.toISOString()}`],
      [],
      ['Source', 'Bookings', 'Hours', 'Booked Value (₹)', 'Collected (₹)', 'Commission (₹)', 'Net Owed to Us (₹)', 'Settlement Status'],
    ];

    for (const r of filteredRows) {
      summaryRows.push([
        r.channelName,
        r.bookingsCount,
        r.hoursCount,
        r.bookedPaise / 100, // Numeric summable value per R4
        r.collectedPaise / 100,
        r.commissionPaise / 100,
        r.netOwedPaise / 100,
        r.settlementStatus,
      ]);
    }

    // Totals row
    summaryRows.push([
      'TOTALS',
      summaryData.totals.bookingsCount,
      summaryData.totals.hoursCount,
      summaryData.totals.bookedPaise / 100,
      summaryData.totals.collectedPaise / 100,
      summaryData.totals.commissionPaise / 100,
      summaryData.totals.netOwedPaise / 100,
      '',
    ]);

    // 2. Fetch Detailed Bookings for Sheet 2
    let bookingsQuery = sql`
      SELECT 
        b.reference,
        b.business_date::text,
        b.starts_at,
        b.ends_at,
        ct.name AS court_name,
        COALESCE(cu.name, 'Direct Player') AS customer_name,
        COALESCE(cu.phone, '') AS customer_phone,
        ch.name AS channel_name,
        COALESCE(b.partner_reference, '-') AS partner_reference,
        b.amount_paise,
        ch.commission_bps,
        b.status AS booking_status
      FROM bookings b
      JOIN channels ch ON ch.id = b.channel_id
      JOIN courts ct ON ct.id = b.court_id
      LEFT JOIN customers cu ON cu.id = b.customer_id
      WHERE b.business_date >= ${fromDate}::date 
        AND b.business_date <= ${toDate}::date
        AND b.status IN ('confirmed', 'completed', 'no_show')
        AND NOT EXISTS (SELECT 1 FROM api_keys k WHERE k.id = b.api_key_id AND k.is_sandbox = true)
        ${channelId ? sql`AND b.channel_id = ${channelId}::uuid` : sql``}
      ORDER BY b.starts_at ASC;
    `;

    const detailResult = await db.execute<{
      reference: string;
      business_date: string;
      starts_at: string;
      ends_at: string;
      court_name: string;
      customer_name: string;
      customer_phone: string;
      channel_name: string;
      partner_reference: string;
      amount_paise: number;
      commission_bps: number;
      booking_status: string;
    }>(bookingsQuery);

    // Build Sheet 2: Bookings
    const detailRows: (string | number)[][] = [
      [
        'Reference',
        'Date',
        'Time (IST)',
        'Court',
        'Customer',
        'Phone',
        'Source',
        'Their Reference',
        'Amount (₹)',
        'Commission (₹)',
        'Net Owed (₹)',
        'Status',
      ],
    ];

    for (const b of detailResult.rows) {
      const sDate = new Date(b.starts_at);
      const eDate = new Date(b.ends_at);
      const sMin = localMinutes(sDate, IST_OFFSET_MINUTES);
      const eMin = localMinutes(eDate, IST_OFFSET_MINUTES);
      const timeLabel = `${minutesToLabel(sMin)} – ${minutesToLabel(eMin)}`;

      const amtRupees = Number(b.amount_paise) / 100;
      const commRupees = Math.round((amtRupees * Number(b.commission_bps || 0))) / 10000;
      const netRupees = Math.max(0, amtRupees - commRupees);

      detailRows.push([
        b.reference,
        b.business_date.split('T')[0]!,
        timeLabel,
        b.court_name,
        b.customer_name,
        b.customer_phone,
        b.channel_name,
        b.partner_reference,
        amtRupees,
        commRupees,
        netRupees,
        b.booking_status,
      ]);
    }

    // 3. Create Workbook with 2 Sheets (SheetJS)
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    const wsBookings = XLSX.utils.aoa_to_sheet(detailRows);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsBookings, 'Bookings');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `pavilion-club-report-${fromDate}-to-${toDate}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    if (err.statusCode === 403) return NextResponse.json({ ok: false, error: err.message }, { status: 403 });
    console.error('Export error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to export spreadsheet' }, { status: 500 });
  }
}
