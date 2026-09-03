import { describe, it, expect } from 'vitest';
import { createDb } from './client.js';
import {
  getPublicMonthAvailability,
  getPublicDaySlots,
  createPublicHold,
  confirmPublicPayAtVenue,
  cancelBookingByCustomer,
  getCustomerBookingsList,
} from './repositories/public-booking.js';
import {
  generateAndSendOtp,
  verifyOtpAndCreateSession,
  validateCustomerSession,
} from './repositories/notifications.js';
import { bookings } from './schema/bookings.js';
import { otpCodes, messageOutbox } from './schema/ops.js';
import { customers } from './schema/customers.js';
import { eq, and, sql } from 'drizzle-orm';
import { generateReference } from '@pavilion/core';

describe('Phase 2: Public Site Player Booking & Anti-Abuse Verification', () => {
  const db = createDb();
  const testPhone = '+919911223344';
  const testDate = '2026-11-25';

  it('1. Fetches month dots and segmented slots with auto court assignment', async () => {
    const monthData = await getPublicMonthAvailability(db, 2026, 11);
    expect(monthData.length).toBe(30);
    const dayItem = monthData.find((d) => d.date === testDate);
    expect(dayItem).toBeDefined();
    expect(['free', 'filling', 'sold_out']).toContain(dayItem!.status);

    const daySlots = await getPublicDaySlots(db, testDate);
    expect(daySlots.slots.length).toBeGreaterThan(0);
    expect(daySlots.allCourts.length).toBeGreaterThanOrEqual(3);

    // Verify morning, afternoon, evening periods
    const periods = new Set(daySlots.slots.map((s) => s.period));
    expect(periods.has('morning')).toBe(true);
    expect(periods.has('afternoon')).toBe(true);
    expect(periods.has('evening')).toBe(true);

    // Verify assigned court is present
    const firstFree = daySlots.slots.find((s) => s.isAvailable);
    expect(firstFree).toBeDefined();
    expect(firstFree!.assignedCourtId).toBeDefined();
    expect(firstFree!.assignedCourtName).toBeDefined();
  });

  it('2. OTP generation, hashing, and 3-send rate limiting per 15 minutes', async () => {
    // Clean up test phone OTPs
    await db.delete(otpCodes).where(eq(otpCodes.phone, testPhone));

    // Request 1
    const r1 = await generateAndSendOtp(db, testPhone);
    expect(r1.ok).toBe(true);
    expect(r1.devCode).toBeDefined();

    // Request 2
    const r2 = await generateAndSendOtp(db, testPhone);
    expect(r2.ok).toBe(true);

    // Request 3
    const r3 = await generateAndSendOtp(db, testPhone);
    expect(r3.ok).toBe(true);

    // Request 4 (MUST be refused per docs/system/12-notifications.md)
    const r4 = await generateAndSendOtp(db, testPhone);
    expect(r4.ok).toBe(false);
    expect(r4.error).toContain('15 minutes');

    // Verify verifyOtp with r3 devCode
    const verifyRes = await verifyOtpAndCreateSession(db, {
      phone: testPhone,
      code: r3.devCode!,
      name: 'Rohan Sharma',
    });
    expect(verifyRes.ok).toBe(true);
    expect(verifyRes.sessionToken).toBeDefined();
    expect(verifyRes.customer?.phone).toBe(testPhone);

    // Session validation
    const sessionRes = await validateCustomerSession(db, verifyRes.sessionToken!);
    expect(sessionRes).not.toBeNull();
    expect(sessionRes?.customer.name).toBe('Rohan Sharma');
  });

  it('3. Hold creation + 10-minute TTL', async () => {
    const daySlots = await getPublicDaySlots(db, testDate);
    const slot = daySlots.slots.find((s) => s.isAvailable)!;

    const hold = await createPublicHold(db, {
      courtId: slot.assignedCourtId,
      startsAt: new Date(slot.startsAt),
      endsAt: new Date(slot.endsAt),
      pricePaise: slot.pricePaise,
    });

    expect(hold.reference).toMatch(/^PC-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
    expect(hold.holdTtlMinutes).toBe(10);
    const exp = new Date(hold.expiresAt);
    expect(exp.getTime()).toBeGreaterThan(Date.now());
  });

  it('4. Pay at Venue confirmation & Anti-Abuse Unpaid Booking Capping (Max 2 unpaid)', async () => {
    // Lookup customer
    const [cust] = await db.select().from(customers).where(eq(customers.phone, testPhone));
    expect(cust).toBeDefined();

    
    await db.execute(sql`DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE business_date = ${testDate}::date)`);
    await db.execute(sql`DELETE FROM bookings WHERE business_date = ${testDate}::date`);

    // Create and confirm Booking #1 (unpaid at venue)
    const hold1 = await createPublicHold(db, {
      courtId: (await db.query.courts.findFirst())!.id,
      startsAt: new Date(`${testDate}T14:00:00+05:30`),
      endsAt: new Date(`${testDate}T15:00:00+05:30`),
      pricePaise: 80000,
      customerId: cust!.id,
    });
    const c1 = await confirmPublicPayAtVenue(db, {
      reference: hold1.reference,
      customerId: cust!.id,
      customerName: 'Rohan Sharma',
      customerPhone: testPhone,
    });
    expect(c1.ok).toBe(true);

    // Create and confirm Booking #2 (unpaid at venue)
    const hold2 = await createPublicHold(db, {
      courtId: (await db.query.courts.findFirst())!.id,
      startsAt: new Date(`${testDate}T15:00:00+05:30`),
      endsAt: new Date(`${testDate}T16:00:00+05:30`),
      pricePaise: 80000,
      customerId: cust!.id,
    });
    const c2 = await confirmPublicPayAtVenue(db, {
      reference: hold2.reference,
      customerId: cust!.id,
      customerName: 'Rohan Sharma',
      customerPhone: testPhone,
    });
    expect(c2.ok).toBe(true);

    // Try Booking #3 (unpaid at venue) -> MUST BE REJECTED by unpaid cap!
    const hold3 = await createPublicHold(db, {
      courtId: (await db.query.courts.findFirst())!.id,
      startsAt: new Date(`${testDate}T16:00:00+05:30`),
      endsAt: new Date(`${testDate}T17:00:00+05:30`),
      pricePaise: 80000,
      customerId: cust!.id,
    });
    const c3 = await confirmPublicPayAtVenue(db, {
      reference: hold3.reference,
      customerId: cust!.id,
      customerName: 'Rohan Sharma',
      customerPhone: testPhone,
    });
    expect(c3.ok).toBe(false);
    expect(c3.error).toContain('already have 2 unpaid bookings pending at the venue');

    // 5. Verify Customer Self-Service & Cancellation
    const myList = await getCustomerBookingsList(db, cust!.id);
    expect(myList.length).toBeGreaterThanOrEqual(2);
    const firstBooking = myList[0]!;
    expect(firstBooking.isCancellable).toBe(true); // > 24 hours in the future

    const cancelRes = await cancelBookingByCustomer(db, {
      bookingId: firstBooking.id,
      customerId: cust!.id,
    });
    expect(cancelRes.ok).toBe(true);

    // After cancellation, unpaid active count drops to 1, so hold3 can now be confirmed!
    const retryC3 = await confirmPublicPayAtVenue(db, {
      reference: hold3.reference,
      customerId: cust!.id,
      customerName: 'Rohan Sharma',
      customerPhone: testPhone,
    });
    expect(retryC3.ok).toBe(true);
  });
});
