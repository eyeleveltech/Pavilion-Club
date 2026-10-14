import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  recordAuditLog,
  submitCashHandover,
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

    const body = await request.json();
    const { businessDate, expectedPaise, declaredPaise, acceptedBy, note } = body;

    if (declaredPaise === undefined || declaredPaise === null || isNaN(declaredPaise)) {
      return NextResponse.json(
        { ok: false, error: 'Declared cash amount is mandatory and cannot be empty' },
        { status: 400 }
      );
    }

    const variancePaise = declaredPaise - expectedPaise;

    // A non-zero variance strictly requires a note
    if (variancePaise !== 0 && (!note || !note.trim())) {
      return NextResponse.json(
        { ok: false, error: 'A mandatory explanation note is required when there is cash variance' },
        { status: 400 }
      );
    }

    const result = await submitCashHandover(db, {
      businessDate,
      staffUserId: validated.user.id,
      expectedPaise,
      declaredPaise,
      acceptedBy,
      note: note?.trim(),
    });

    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: 'cash:handover',
      entity: 'cash_handover',
      entityId: result.id,
      reason: note?.trim() || undefined,
      after: {
        businessDate,
        expectedPaise,
        declaredPaise,
        variancePaise: result.variancePaise,
        acceptedBy,
      },
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('Cash handover submission error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to record cash handover' }, { status: 500 });
  }
}
