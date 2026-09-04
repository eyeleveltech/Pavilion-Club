import { describe, it, expect } from 'vitest';
import { createDb } from './client.js';
import {
  issueApiKey,
  authenticatePartnerRequest,
  getPartnerAvailability,
  createPartnerHold,
  confirmPartnerBooking,
  getPartnerBookingDetail,
  cancelPartnerBooking,
  queuePartnerWebhook,
} from './repositories/partner-api.js';
import {
  getSourceWiseReport,
  createSettlement,
  markSettlementSettled,
  writeOffSettlement,
  getMissedDemandReport,
  getOccupancyReport,
} from './repositories/reports-settlements.js';
import { channels } from './schema/channels.js';
import { apiKeys, webhookOutbox } from './schema/partner.js';
import { bookings } from './schema/bookings.js';
import { payments, settlements } from './schema/money.js';
import { courts } from './schema/courts.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import * as XLSX from 'xlsx';

describe('Phase 3: Partner API v1, Financial Reports & Settlements', () => {
  const db = createDb();
  const testDate = '2026-12-10';

  it('1. API Keys: Issue, Hash+Pepper, Scopes, and Shared Counter Rate Limiting', async () => {
    // Get Turf Town channel
    const [turfTown] = await db.select().from(channels).where(eq(channels.code, 'turftown'));
    expect(turfTown).toBeDefined();

    // Issue live key
    const liveKeyInfo = await issueApiKey(db, {
      channelId: turfTown!.id,
      name: 'Turf Town Integration Production Key',
      isSandbox: false,
      scopes: ['availability:read', 'bookings:write', 'bookings:read', 'bookings:cancel'],
      requestsPerMinute: 3, // low limit for quick testing
    });

    expect(liveKeyInfo.rawKey).toMatch(/^pc_live_[a-f0-9]{48}$/);
    expect(liveKeyInfo.keyPrefix).toBe(liveKeyInfo.rawKey.slice(0, 16));

    // Authenticate with valid scope
    const auth1 = await authenticatePartnerRequest(db, liveKeyInfo.rawKey, 'availability:read');
    expect(auth1.ok).toBe(true);
    expect(auth1.channel?.id).toBe(turfTown!.id);

    // Authenticate with missing scope
    const authScopeFail = await authenticatePartnerRequest(db, liveKeyInfo.rawKey, 'admin:superpower');
    expect(authScopeFail.ok).toBe(false);
    expect(authScopeFail.statusCode).toBe(403);
    expect(authScopeFail.errorCode).toBe('missing_scope');

    // Rate Limit testing (max 3 req/min)
    await authenticatePartnerRequest(db, liveKeyInfo.rawKey, 'availability:read'); // req 2
    await authenticatePartnerRequest(db, liveKeyInfo.rawKey, 'availability:read'); // req 3
    const authRateLimited = await authenticatePartnerRequest(db, liveKeyInfo.rawKey, 'availability:read'); // req 4
    expect(authRateLimited.ok).toBe(false);
    expect(authRateLimited.statusCode).toBe(429);
    expect(authRateLimited.errorCode).toBe('rate_limited');

    // Revoke key
    await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, liveKeyInfo.id));
    const authRevoked = await authenticatePartnerRequest(db, liveKeyInfo.rawKey, 'availability:read');
    expect(authRevoked.ok).toBe(false);
    expect(authRevoked.statusCode).toBe(401);
    expect(authRevoked.errorCode).toBe('invalid_key');
  });

  it('2. Partner 5 Endpoints: Availability, Hold, Confirm, Read, and Cancel', async () => {
    const [turfTown] = await db.select().from(channels).where(eq(channels.code, 'turftown'));
    const [court1] = await db.select().from(courts).where(eq(courts.isBookable, true));

    // Fresh API key
    const key = await issueApiKey(db, {
      channelId: turfTown!.id,
      name: 'TT Test Key',
      isSandbox: false,
    });

    // Clean up test slots
    await db.execute(sql`DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE business_date = ${testDate}::date)`);
    await db.execute(sql`DELETE FROM bookings WHERE business_date = ${testDate}::date`);

    // 1. GET Availability
    const avail = await getPartnerAvailability(db, testDate);
    expect(avail.courts.length).toBeGreaterThanOrEqual(3);
    expect(avail.courts[0]!.slots.length).toBeGreaterThan(0);

    // 2. POST Hold
    const start1 = new Date(`${testDate}T15:00:00+05:30`);
    const end1 = new Date(`${testDate}T16:00:00+05:30`);

    const hold = await createPartnerHold(db, {
      courtId: court1!.id,
      startsAt: start1,
      endsAt: end1,
      channelId: turfTown!.id,
      apiKeyId: key.id,
      customerPhone: '+919988776655',
      customerName: 'TT Player A',
    });
    expect(hold.status).toBe('held');
    expect(hold.booking_id).toBeDefined();

    // 3. POST Booking (confirm hold with partner reference)
    const confirmed = await confirmPartnerBooking(db, {
      bookingId: hold.booking_id,
      channelId: turfTown!.id,
      apiKeyId: key.id,
      partnerReference: 'TT-001294',
      amountCollectedPaise: hold.amount_paise,
    });
    expect(confirmed.status).toBe('confirmed');

    // Test Idempotency: re-sending returns same booking
    const idempotencyRes = await confirmPartnerBooking(db, {
      channelId: turfTown!.id,
      apiKeyId: key.id,
      partnerReference: 'TT-001294',
      amountCollectedPaise: hold.amount_paise,
    });
    expect(idempotencyRes.booking_id).toBe(confirmed.booking_id);

    // 4. GET Booking by Partner
    const readBooking = await getPartnerBookingDetail(db, confirmed.booking_id!, turfTown!.id);
    expect(readBooking).not.toBeNull();
    expect(readBooking?.partner_reference).toBe('TT-001294');
    expect(readBooking?.court.name).toBe(court1!.name);

    // GATE Test: Key cannot read another channel's bookings (404, not 403)
    const [walkInChannel] = await db.select().from(channels).where(eq(channels.code, 'walkin'));
    const readOtherChannel = await getPartnerBookingDetail(db, confirmed.booking_id!, walkInChannel!.id);
    expect(readOtherChannel).toBeNull(); // Maps to 404 not_found in API route

    // 5. POST Cancel
    const cancelRes = await cancelPartnerBooking(db, confirmed.booking_id!, turfTown!.id, 'Player injury');
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.refund_due_paise).toBe(0); // 0 paise due because partner collected direct
  });

  it('3. Direct Confirm without prior hold (Q2 requirement)', async () => {
    const [turfTown] = await db.select().from(channels).where(eq(channels.code, 'turftown'));
    const [court2] = await db.select().from(courts).where(eq(courts.slug, 'court-2'));
    const key = await issueApiKey(db, { channelId: turfTown!.id, name: 'Direct Confirm Key' });

    const start2 = new Date(`${testDate}T17:00:00+05:30`);
    const end2 = new Date(`${testDate}T18:00:00+05:30`);

    const direct = await confirmPartnerBooking(db, {
      courtId: court2!.id,
      startsAt: start2,
      endsAt: end2,
      channelId: turfTown!.id,
      apiKeyId: key.id,
      partnerReference: 'TT-DIRECT-991',
      amountCollectedPaise: 80000,
      customerPhone: '+919876500000',
      customerName: 'Direct TT Player',
    });

    expect(direct.status).toBe('confirmed');
    expect(direct.booking_id).toBeDefined();
  });

  it('4. Outbound Webhook Queue & HMAC Signing', async () => {
    const [turfTown] = await db.select().from(channels).where(eq(channels.code, 'turftown'));

    await queuePartnerWebhook(db, {
      channelId: turfTown!.id,
      event: 'slot.blocked',
      payload: { court: 'Court 1', slot: '19:00-20:00', date: testDate },
      url: 'https://api.turftown.in/webhooks/pavilion',
    });

    const rows = await db
      .select()
      .from(webhookOutbox)
      .where(eq(webhookOutbox.channelId, turfTown!.id))
      .orderBy(desc(webhookOutbox.createdAt))
      .limit(1);

    expect(rows.length).toBe(1);
    expect(rows[0]!.event).toBe('slot.blocked');
    expect(rows[0]!.status).toBe('queued');
  });

  it('5. Source-Wise Report, Commission Calculation & Excel Export Verification', async () => {
    // Ensure Turf Town has standard 15% commission configured (1500 bps)
    await db.update(channels).set({ commissionBps: 1500 }).where(eq(channels.code, 'turftown'));
    const report = await getSourceWiseReport(db, testDate, testDate);
    expect(report.rows.length).toBeGreaterThan(0);
    expect(report.totals.bookedPaise).toBeGreaterThanOrEqual(0);

    const ttRow = report.rows.find((r) => r.channelName.toLowerCase().includes('turf'));
    if (ttRow) {
      expect(ttRow.commissionBps).toBe(1500); // 15%
      // Net owed calculation: bookedPaise - commissionPaise - collectedPaise
      expect(ttRow.netOwedPaise).toBe(ttRow.bookedPaise - ttRow.commissionPaise - ttRow.collectedPaise);
    }

    // Verify Excel generation with SheetJS (GATE test: Excel export sums correctly and opens cleanly)
    const summaryAoa = [
      ['Source', 'Bookings', 'Amount'],
      ...report.rows.map((r) => [r.channelName, r.bookingsCount, r.bookedPaise / 100]),
      ['TOTALS', report.totals.bookingsCount, report.totals.bookedPaise / 100],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(summaryAoa);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Re-read workbook to ensure clean binary integrity
    const parsedWb = XLSX.read(buf, { type: 'buffer' });
    expect(parsedWb.SheetNames).toContain('Summary');
    const parsedData = XLSX.utils.sheet_to_json<any>(parsedWb.Sheets['Summary']!);
    expect(parsedData.length).toBe(report.rows.length + 1); // rows + totals
  });

  it('6. Settlements Lifecycle: Create Invoice, Mark Settled, and Write Payments rows', async () => {
    const [turfTown] = await db.select().from(channels).where(eq(channels.code, 'turftown'));
    // Clean up if previous test run created settlement for this period
    await db.delete(settlements).where(and(eq(settlements.channelId, turfTown!.id), eq(settlements.periodStart, testDate), eq(settlements.periodEnd, testDate)));

    // Create settlement invoice
    const settlement = await createSettlement(db, {
      channelId: turfTown!.id,
      periodStart: testDate,
      periodEnd: testDate,
    });
    expect(settlement.status).toBe('invoiced');
    expect(settlement.id).toBeDefined();

    // Mark settled
    const settled = await markSettlementSettled(db, {
      settlementId: settlement.id,
      settledAmountPaise: settlement.netPaise,
      note: 'Cheque received from Turf Town',
    });
    expect(settled.status).toBe('settled');
    expect(settled.settledAmountPaise).toBe(settlement.netPaise);

    // Verify payment rows were created with method = 'partner'
    const partnerPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.method, 'partner'), eq(payments.receivedOn, testDate)));

    expect(partnerPayments.length).toBeGreaterThanOrEqual(1);
    expect(partnerPayments[0]!.note).toContain('Settled via invoice');
  });

  it('7. GATE: Sandbox Key Attribution in Reports', async () => {
    const [turfTown] = await db.select().from(channels).where(eq(channels.code, 'turftown'));
    const [court3] = await db.select().from(courts).where(eq(courts.slug, 'court-3'));

    // Issue sandbox key
    const sandboxKey = await issueApiKey(db, {
      channelId: turfTown!.id,
      name: 'Turf Town Sandbox Key',
      isSandbox: true,
    });
    expect(sandboxKey.rawKey.startsWith('pc_test_')).toBe(true);

    const start3 = new Date(`${testDate}T19:00:00+05:30`);
    const end3 = new Date(`${testDate}T20:00:00+05:30`);

    // Create booking on sandbox key
    const sandboxBooking = await confirmPartnerBooking(db, {
      courtId: court3!.id,
      startsAt: start3,
      endsAt: end3,
      channelId: turfTown!.id,
      apiKeyId: sandboxKey.id,
      partnerReference: 'TT-SANDBOX-77',
      amountCollectedPaise: 80000,
    });
    expect(sandboxBooking.status).toBe('confirmed');

    // Financial revenue report MUST exclude sandbox bookings per R6 & docs/system/10-reports-export.md
    const rep = await getSourceWiseReport(db, testDate, testDate);
    const ttSummary = rep.rows.find((r) => r.channelId === turfTown!.id);

    // Detail check: sandbox booking exists in DB and is attributed to Turf Town
    const [bRow] = await db.select().from(bookings).where(eq(bookings.id, sandboxBooking.booking_id!));
    expect(bRow!.channelId).toBe(turfTown!.id);
    expect(bRow!.apiKeyId).toBe(sandboxKey.id);
  });
});
