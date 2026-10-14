import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  recordAuditLog,
  getCourtsSettings,
  saveCourtHoursWithSafetyCheck,
} from '@pavilion/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    const courts = await getCourtsSettings(db);
    return NextResponse.json({ ok: true, courts, userRole: validated.user.role });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch courts settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    requirePermission(validated.user, 'pricing:write');

    const body = await request.json();
    const result = await saveCourtHoursWithSafetyCheck(db, body);

    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: 'courts:update_hours',
      entity: 'court',
      entityId: body.courtId,
      after: { hoursCount: body.hours?.length, affectedBookings: result.affectedBookings.length },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('Save court hours error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to save court hours' }, { status: 500 });
  }
}
