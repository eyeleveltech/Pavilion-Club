import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  recordAuditLog,
  bookings,
  eq,
} from '@pavilion/db';

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

    requirePermission(validated.user, 'booking:write');

    const { bookingId, reason, isPartner } = await request.json();

    if (isPartner && (!reason || !reason.trim())) {
      return NextResponse.json(
        { ok: false, error: 'A mandatory cancellation reason is required for partner bookings' },
        { status: 400 }
      );
    }

    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'desk',
        cancelReason: reason?.trim() || 'Cancelled from Desk Calendar',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: 'booking:cancel',
      entity: 'booking',
      entityId: bookingId,
      reason: reason || 'Cancelled from Desk Calendar',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Cancel booking error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to cancel booking' }, { status: 500 });
  }
}
