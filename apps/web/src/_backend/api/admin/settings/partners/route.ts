import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  recordAuditLog,
  getPartnersSettings,
  updatePartnerCommission,
  issuePartnerApiKey,
  revokePartnerApiKey,
} from '@pavilion/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    const partners = await getPartnersSettings(db);
    return NextResponse.json({ ok: true, partners, userRole: validated.user.role });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch partners' }, { status: 500 });
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

    requirePermission(validated.user, 'partner:manage');

    const body = await request.json();

    if (body.action === 'commission') {
      await updatePartnerCommission(db, body.channelId, body.commissionPercent);
      await recordAuditLog(db, {
        actorUserId: validated.user.id,
        action: 'partner:update_commission',
        entity: 'channel',
        entityId: body.channelId,
        after: { commissionPercent: body.commissionPercent },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'issue_key') {
      const keyData = await issuePartnerApiKey(db, {
        channelId: body.channelId,
        name: body.name || 'API Key',
      });
      await recordAuditLog(db, {
        actorUserId: validated.user.id,
        action: 'partner:issue_api_key',
        entity: 'api_key',
        after: { channelId: body.channelId, prefix: keyData.keyPrefix },
      });
      return NextResponse.json({ ok: true, ...keyData });
    }

    if (body.action === 'revoke_key') {
      await revokePartnerApiKey(db, body.keyId);
      await recordAuditLog(db, {
        actorUserId: validated.user.id,
        action: 'partner:revoke_api_key',
        entity: 'api_key',
        entityId: body.keyId,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to process partner action' }, { status: 500 });
  }
}
