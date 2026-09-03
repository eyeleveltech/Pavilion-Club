import { describe, it, expect } from 'vitest';
import { createDb } from './client.js';
import { createBooking } from './booking/create-booking.js';
import { getBookableCourts } from './repositories/venue.js';
import { bookings } from './schema/bookings.js';
import { eq, and, sql } from 'drizzle-orm';

describe('The Concurrency Gate', () => {
  const db = createDb();

  it('100 concurrent bookings on one slot: exactly 1 wins, 99 JUST_TAKEN, 0 errors', async () => {
    const courtsList = await getBookableCourts(db);
    const court = courtsList.find((c) => c.name === 'Court 2') ?? courtsList[0]!;

    // Target a specific clean slot 5 days ahead, 18:00 to 19:00 IST
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 5);
    startsAt.setHours(18, 0, 0, 0);

    const endsAt = new Date(startsAt);
    endsAt.setHours(19, 0, 0, 0);

    // Clean this specific slot before running the test
    await db
      .delete(bookings)
      .where(
        and(
          eq(bookings.courtId, court.id),
          eq(bookings.startsAt, startsAt),
          eq(bookings.endsAt, endsAt)
        )
      );

    // Launch 100 simultaneous booking attempts
    const promises = Array.from({ length: 100 }, (_, i) =>
      createBooking(db, {
        courtId: court.id,
        channelCode: i % 2 === 0 ? 'website' : 'turftown',
        startsAt,
        endsAt,
        actor: i % 2 === 0 ? 'public' : 'partner',
        status: 'confirmed',
        phone: `+9199999${String(i).padStart(5, '0')}`,
      })
    );

    const results = await Promise.all(promises);

    const wins = results.filter((r) => r.ok === true);
    const justTaken = results.filter((r) => !r.ok && r.reason === 'JUST_TAKEN');
    const errors = results.filter((r) => !r.ok && r.reason !== 'JUST_TAKEN');

    expect(wins.length).toBe(1);
    expect(justTaken.length).toBe(99);
    expect(errors.length).toBe(0);

    // Verify in database: exactly 1 booking exists in the table for this court & slot
    const dbBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.courtId, court.id),
          eq(bookings.startsAt, startsAt),
          eq(bookings.endsAt, endsAt),
          eq(bookings.status, 'confirmed')
        )
      );

    expect(dbBookings.length).toBe(1);
  }, 75000);

  it('50 concurrent overlapping ranges of different lengths: no 40P01 deadlock escapes', async () => {
    const courtsList = await getBookableCourts(db);
    const court = courtsList.find((c) => c.name === 'Court 3') ?? courtsList[0]!;

    // Target date: 6 days ahead
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 6);
    baseDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Clean Court 3 for that day
    await db
      .delete(bookings)
      .where(
        and(
          eq(bookings.courtId, court.id),
          sql`starts_at >= ${baseDate.toISOString()}::timestamptz AND starts_at < ${nextDate.toISOString()}::timestamptz`
        )
      );

    // Generate 50 overlapping ranges with differing lengths (1 hr, 2 hr, 3 hr)
    const promises = Array.from({ length: 50 }, (_, i) => {
      const startHour = 17 + (i % 3); // 17, 18, 19
      const duration = 1 + (i % 2); // 1 hr or 2 hrs

      const s = new Date(baseDate);
      s.setHours(startHour, 0, 0, 0);

      const e = new Date(s);
      e.setHours(startHour + duration, 0, 0, 0);

      return createBooking(db, {
        courtId: court.id,
        channelCode: 'website',
        startsAt: s,
        endsAt: e,
        actor: 'public',
        status: 'confirmed',
        phone: `+9188888${String(i).padStart(5, '0')}`,
      });
    });

    const results = await Promise.all(promises);

    // Assert that every attempt resolved cleanly without throwing or failing with unexpected errors
    for (const res of results) {
      if (!res.ok) {
        expect(['JUST_TAKEN', 'OUTSIDE_WINDOW', 'CLOSED']).toContain(res.reason);
      } else {
        expect(res.ok).toBe(true);
      }
    }

    // Assert that no unhandled deadlock errors escaped
    const unexpected = results.filter((r) => !r.ok && r.reason === 'ERROR');
    expect(unexpected.length).toBe(0);

    // Verify in database: no two confirmed bookings overlap on this court
    const courtBookings = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.courtId, court.id), eq(bookings.status, 'confirmed')));

    for (let i = 0; i < courtBookings.length; i++) {
      for (let j = i + 1; j < courtBookings.length; j++) {
        const a = courtBookings[i]!;
        const b = courtBookings[j]!;
        const overlaps = a.startsAt < b.endsAt && b.startsAt < a.endsAt;
        expect(overlaps).toBe(false);
      }
    }
  }, 75000);
});
