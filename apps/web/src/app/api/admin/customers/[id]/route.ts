import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  recordAuditLog,
  getCustomerDetail,
  setCustomerBlocked,
  updateCustomerNotes,
} from '@pavilion/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const data = await getCustomerDetail(db, id);
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('Customer detail API error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch customer detail' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // 1. Block / Unblock action
    if (typeof body.isBlocked === 'boolean') {
      await setCustomerBlocked(db, id, body.isBlocked, body.reason);
      await recordAuditLog(db, {
        actorUserId: validated.user.id,
        action: body.isBlocked ? 'customer:block' : 'customer:unblock',
        entity: 'customer',
        entityId: id,
        reason: body.reason || undefined,
        after: { isBlocked: body.isBlocked },
      });
    }

    // 2. Update Notes
    if (typeof body.notes === 'string') {
      await updateCustomerNotes(db, id, body.notes);
      await recordAuditLog(db, {
        actorUserId: validated.user.id,
        action: 'customer:update_notes',
        entity: 'customer',
        entityId: id,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Customer update API error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to update customer' }, { status: 500 });
  }
}
