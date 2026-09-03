import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  recordAuditLog,
  bookings,
  payments,
  eq,
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

    requirePermission(validated.user, 'booking:write');

    const { bookingId, amountPaise, method } = await request.json();
    const todayYmd = businessDate(new Date(), IST_OFFSET_MINUTES, 5);

    await db.insert(payments).values({
      bookingId,
      amountPaise,
      method: method || 'cash',
      status: 'captured',
      receivedBy: validated.user.id,
      receivedOn: todayYmd,
    });

    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: 'payment:record',
      entity: 'booking',
      entityId: bookingId,
      after: { amountPaise, method: method || 'cash' },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Record payment error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to record payment' }, { status: 500 });
  }
}
