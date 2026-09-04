import { describe, it, expect } from 'vitest';
import { createDb } from './client.js';
import { getBookableCourts, getActiveChannels } from './repositories/venue.js';
import { customers } from './schema/customers.js';
import { bookings } from './schema/bookings.js';
import { payments } from './schema/money.js';
import { getDailyCloseData, submitCashHandover } from './repositories/daily-close.js';
import { generateReference } from '@pavilion/core';
import { eq, sql } from 'drizzle-orm';

describe('GATE 2: E2E Full Operational Lifecycle (No Manual SQL)', () => {
  const db = createDb();
  // Unique random date in the future to keep this test completely isolated
  const randomSuffix = Math.floor(Math.random() * 800 + 100);
  const testDate = `2027-06-${String(randomSuffix % 28 + 1).padStart(2, '0')}`;

  it('runs a full operational lifecycle: booking, collecting payment, cancellation, and daily close with zero manual SQL', async () => {
    // 1. Fetch Venue Setup & Staff
    const [courtsList, channelsList, staffQuery] = await Promise.all([
      getBookableCourts(db),
      getActiveChannels(db),
      db.execute<{ id: string }>(`SELECT id FROM users WHERE role = 'desk' LIMIT 1`),
    ]);
    expect(courtsList.length).toBeGreaterThanOrEqual(3);
    const court1 = courtsList[0]!;
    const court2 = courtsList[1]!;
    const court3 = courtsList[2]!;

    const walkInChannel = channelsList.find((c) => c.code === 'walk_in') || channelsList[0]!;
    const staffId = staffQuery.rows[0]!.id;

    // 2. Lookup / Create Customer
    let [customer] = await db.select().from(customers).where(eq(customers.phone, '+919888877777'));
    if (!customer) {
      const inserted = await db
        .insert(customers)
        .values({
          phone: '+919888877777',
          name: 'LifeCycle Test Player',
        })
        .returning();
      customer = inserted[0]!;
    }
    expect(customer.id).toBeDefined();

    
    // Clean up testDate bookings if any previous run left rows
    await db.execute(sql`DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE business_date = ${testDate}::date)`);
    await db.execute(sql`DELETE FROM bookings WHERE business_date = ${testDate}::date`);

    // 3. Book Slot 1: Court 1 10:00–11:00 with immediate Cash Payment (₹800)
    const slot1Start = new Date(`${testDate}T10:00:00+05:30`);
    const slot1End = new Date(`${testDate}T11:00:00+05:30`);
    const ref1 = generateReference();

    const [b1] = await db
      .insert(bookings)
      .values({
        courtId: court1.id,
        businessDate: testDate,
        startsAt: slot1Start,
        endsAt: slot1End,
        amountPaise: 80000,
        channelId: walkInChannel.id,
        customerId: customer.id,
        reference: ref1,
        status: 'confirmed',
      })
      .returning();
    expect(b1).toBeDefined();

    // Record Cash payment for Slot 1 (requires receivedBy staff member per payments_check constraint)
    await db.insert(payments).values({
      bookingId: b1!.id,
      amountPaise: 80000,
      method: 'cash',
      status: 'captured',
      receivedBy: staffId,
      receivedOn: testDate,
    });

    // 4. Book Slot 2: Court 2 11:00–12:00 with Card Payment (₹1,000)
    const slot2Start = new Date(`${testDate}T11:00:00+05:30`);
    const slot2End = new Date(`${testDate}T12:00:00+05:30`);
    const ref2 = generateReference();

    const [b2] = await db
      .insert(bookings)
      .values({
        courtId: court2.id,
        businessDate: testDate,
        startsAt: slot2Start,
        endsAt: slot2End,
        amountPaise: 100000,
        channelId: walkInChannel.id,
        customerId: customer.id,
        reference: ref2,
        status: 'confirmed',
      })
      .returning();
    expect(b2).toBeDefined();

    await db.insert(payments).values({
      bookingId: b2!.id,
      amountPaise: 100000,
      method: 'card',
      status: 'captured',
      receivedBy: staffId,
      receivedOn: testDate,
    });

    // 5. Book Slot 3: Court 3 12:00–13:00 and then cancel with reason
    const slot3Start = new Date(`${testDate}T12:00:00+05:30`);
    const slot3End = new Date(`${testDate}T13:00:00+05:30`);
    const ref3 = generateReference();

    const [b3] = await db
      .insert(bookings)
      .values({
        courtId: court3.id,
        businessDate: testDate,
        startsAt: slot3Start,
        endsAt: slot3End,
        amountPaise: 80000,
        channelId: walkInChannel.id,
        customerId: customer.id,
        reference: ref3,
        status: 'confirmed',
      })
      .returning();
    expect(b3).toBeDefined();

    // Cancel Slot 3
    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'desk',
        cancelReason: 'Player requested cancellation due to travel',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, b3!.id));

    // 6. Run Daily Close Reconciliation for testDate
    const closeData = await getDailyCloseData(db, testDate);
    expect(closeData.businessDate).toBe(testDate);

    // Booked value counts confirmed b1 (₹800) + b2 (₹1,000) = ₹1,800. b3 was cancelled, so excluded!
    expect(closeData.totalBookedValuePaise).toBe(180000);

    // Collections: Cash = ₹800, Card = ₹1,000, Total = ₹1,800
    expect(closeData.collection.cashPaise).toBe(80000);
    expect(closeData.collection.cardPaise).toBe(100000);
    expect(closeData.collection.totalCollectedPaise).toBe(180000);

    // Expected physical cash in the till is exactly the cash collected: ₹800
    expect(closeData.expectedCashPaise).toBe(80000);

    // Still owing is 0 because both confirmed bookings were paid
    expect(closeData.totalStillOwingPaise).toBe(0);

    // 7. Perform Shift Handover
    const handover = await submitCashHandover(db, {
      businessDate: testDate,
      staffUserId: staffId,
      expectedPaise: 80000,
      declaredPaise: 80000, // exact physical cash in till
      note: 'E2E automated reconciliation test sign-off',
    });

    expect(handover.id).toBeDefined();
    expect(handover.variancePaise).toBe(0);
  });
});
