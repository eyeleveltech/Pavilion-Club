import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  recordAuditLog,
  getVenueGeneralSettings,
  updateVenueGeneralSettings,
} from '@pavilion/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    const venue = await getVenueGeneralSettings(db);
    return NextResponse.json({ ok: true, venue, userRole: validated.user.role });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch venue settings' }, { status: 500 });
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

    requirePermission(validated.user, 'settings:write');

    const body = await request.json();
    await updateVenueGeneralSettings(db, body);

    await recordAuditLog(db, {
      actorUserId: validated.user.id,
      action: 'venue:update_settings',
      entity: 'venue_settings',
      after: body,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to update venue settings' }, { status: 500 });
  }
}
