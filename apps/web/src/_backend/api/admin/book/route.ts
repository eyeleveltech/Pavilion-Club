import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  hasPermission,
  createBooking,
  recordAuditLog,
  customers,
  bookings,
  payments,
  blackouts,
  eq,
  sql,
} from '@pavilion/db';
import { businessDate, IST_OFFSET_MINUTES } from '@pavilion/core';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) {
      return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });
    }

    // Require booking:write permission
    try {
      requirePermission(validated.user, 'booking:write');
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: Insufficient permissions to book slots' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      courtId,
      startsAt,
      endsAt,
      customerPhone,
      customerName,
      paymentMode, // 'cash' | 'card' | 'none'
      priceOverridePaise,
      overrideReason,
      isBlackout,
      blackoutReason,
    } = body;

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    const todayYmd = businessDate(new Date(), IST_OFFSET_MINUTES, 5);

    // 1. Handle Blackout action
    if (isBlackout) {
      await db.insert(blackouts).values({
        courtId,
        startsAt: startDate,
        endsAt: endDate,
        reason: blackoutReason || 'Maintenance',
        createdBy: validated.user.id,
      });

      await recordAuditLog(db, {
        actorUserId: validated.user.id,
        action: 'blackout:create',
        entity: 'blackout',
        reason: blackoutReason || 'Maintenance',
      });

      return NextResponse.json({
        ok: true,
        isBlackout: true,
        message: 'Slot successfully blacked out for maintenance',
      });
    }

    // 2. Validate price override if present
    if (priceOverridePaise !== undefined && priceOverridePaise !== null) {
      if (!hasPermission(validated.user.role, 'pricing:override')) {
        return NextResponse.json(
          { ok: false, error: 'Forbidden: Pricing override permission required' },
          { status: 403 }
        );
      }
      if (!overrideReason || typeof overrideReason !== 'string' || !overrideReason.trim()) {
        return NextResponse.json(
          { ok: false, error: 'A mandatory reason is required for price override' },
          { status: 400 }
        );
      }
    }

    // 3. Normalize & Find/Upsert Customer
    if (!customerPhone || customerPhone.trim().length < 5) {
      return NextResponse.json(
        { ok: false, error: 'Valid customer phone number is required' },
        { status: 400 }
      );
    }

    const cleanedPhone = customerPhone.replace(/[^\d+]/g, '');
    let customerId: string | undefined;

    const existingCust = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, cleanedPhone))
      .limit(1);

    if (existingCust.length > 0) {
      customerId = existingCust[0]!.id;
      if (customerName && customerName.trim() && existingCust[0]!.name !== customerName.trim()) {
        await db
          .update(customers)
          .set({ name: customerName.trim(), updatedAt: new Date() })
          .where(eq(customers.id, customerId));
      }
    } else {
      const newCust = await db
        .insert(customers)
        .values({
          phone: cleanedPhone,
          name: customerName?.trim() || 'Walk-in Guest',
        })
        .returning({ id: customers.id });
      customerId = newCust[0]?.id;
    }

    // 4. Create Booking using engine write path with retries
    const bookingResult = await createBooking(db, {
      courtId,
      channelCode: 'walkin',
      startsAt: startDate,
      endsAt: endDate,
      actor: 'desk',
      customerId,
      bookedByUserId: validated.user.id,
      status: 'confirmed',
      phone: cleanedPhone,
    });

    if (!bookingResult.ok) {
      let message = 'Slot is no longer available';
      if (bookingResult.reason === 'JUST_TAKEN') {
        message = 'Slot was just taken by another player';
      } else if (bookingResult.reason === 'CLOSED') {
        message = 'Court is closed at this hour';
      }
      return NextResponse.json({ ok: false, error: message, reason: bookingResult.reason }, { status: 409 });
    }

    const bookingId = bookingResult.bookingId;
    const reference = bookingResult.reference;

    // 5. Apply price override if specified
    if (priceOverridePaise !== undefined && priceOverridePaise !== null) {
      await db
        .update(bookings)
        .set({
          amountPaise: priceOverridePaise,
          priceOverrideReason: overrideReason.trim(),
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      await recordAuditLog(db, {
        actorUserId: validated.user.id,
        action: 'pricing:override',
        entity: 'booking',
        entityId: bookingId,
        reason: overrideReason.trim(),
        after: { amountPaise: priceOverridePaise },
      });
    }

    // Fetch final booked amount
    const bookingRow = await db
      .select({ amountPaise: bookings.amountPaise })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    const finalAmount = bookingRow[0]?.amountPaise ?? 0;

    // 6. Record Payment if Cash or Card received
    if (paymentMode === 'cash' || paymentMode === 'card') {
      await db.insert(payments).values({
        bookingId,
        amountPaise: finalAmount,
        method: paymentMode,
        status: 'captured',
        receivedBy: validated.user.id,
        receivedOn: todayYmd,
      });
    }

    // 7. Audit log booking creation
    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: 'booking:create_walkin',
      entity: 'booking',
      entityId: bookingId,
      after: {
        reference,
        amountPaise: finalAmount,
        paymentMode: paymentMode || 'none',
        customerPhone: cleanedPhone,
      },
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      reference,
      amountPaise: finalAmount,
      isPaid: paymentMode === 'cash' || paymentMode === 'card',
      paymentMode,
    });
  } catch (err) {
    console.error('Walk-in booking error:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to complete booking' },
      { status: 500 }
    );
  }
}
