import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  recordAuditLog,
  getBlackoutsList,
  createBlackouts,
  deleteBlackout,
  getBookableCourts,
} from '@pavilion/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    const [blackoutsList, courtsList] = await Promise.all([
      getBlackoutsList(db),
      getBookableCourts(db),
    ]);

    return NextResponse.json({
      ok: true,
      blackouts: blackoutsList,
      courts: courtsList.map((c) => ({ id: c.id, name: c.name })),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch blackouts' }, { status: 500 });
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

    requirePermission(validated.user, 'booking:write');

    const body = await request.json();
    const { courtIds, startsAt, endsAt, reason } = body;

    await createBlackouts(db, {
      courtIds,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      reason,
      createdByUserId: validated.user.id,
    });

    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: 'blackouts:create',
      entity: 'blackout',
      reason,
      after: { courtCount: courtIds.length, startsAt, endsAt },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to create blackout' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    requirePermission(validated.user, 'booking:write');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'ID required' }, { status: 400 });

    await deleteBlackout(db, id);
    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: 'blackouts:delete',
      entity: 'blackout',
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to delete blackout' }, { status: 500 });
  }
}
