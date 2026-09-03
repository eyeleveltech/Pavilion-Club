import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  recordAuditLog,
  getStaffUsersList,
  createStaffUserAccount,
  toggleStaffUserActive,
} from '@pavilion/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    const staff = await getStaffUsersList(db);
    return NextResponse.json({ ok: true, staff, currentUserId: validated.user.id, userRole: validated.user.role });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch staff' }, { status: 500 });
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

    requirePermission(validated.user, 'staff:manage');

    const body = await request.json();
    const result = await createStaffUserAccount(db, body);

    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: 'staff:create',
      entity: 'user',
      entityId: result.id,
      after: { name: body.name, phone: body.phone, role: body.role },
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('Create staff error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to create staff account' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    requirePermission(validated.user, 'staff:manage');

    const body = await request.json();
    await toggleStaffUserActive(db, body.userId, body.isActive);

    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: body.isActive ? 'staff:activate' : 'staff:deactivate',
      entity: 'user',
      entityId: body.userId,
      after: { isActive: body.isActive },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to update staff status' }, { status: 500 });
  }
}
