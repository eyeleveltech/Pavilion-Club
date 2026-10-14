import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDb,
  validateSession,
  requirePermission,
  createSettlement,
  markSettlementSettled,
  writeOffSettlement,
  settlements,
  channels,
  eq,
  desc,
} from '@pavilion/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    requirePermission(validated.user, 'reports:read');

    const rows = await db
      .select({
        id: settlements.id,
        channelId: settlements.channelId,
        channelName: channels.name,
        periodStart: settlements.periodStart,
        periodEnd: settlements.periodEnd,
        bookingCount: settlements.bookingCount,
        grossPaise: settlements.grossPaise,
        commissionPaise: settlements.commissionPaise,
        netPaise: settlements.netPaise,
        status: settlements.status,
        invoicedAt: settlements.invoicedAt,
        settledAt: settlements.settledAt,
        settledAmountPaise: settlements.settledAmountPaise,
      })
      .from(settlements)
      .innerJoin(channels, eq(settlements.channelId, channels.id))
      .orderBy(desc(settlements.createdAt));

    return NextResponse.json({ ok: true, settlements: rows });
  } catch (err: any) {
    if (err.statusCode === 403) return NextResponse.json({ ok: false, error: err.message }, { status: 403 });
    console.error('Get settlements error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to load settlements' }, { status: 500 });
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

    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      requirePermission(validated.user, 'revenue:read');
      const item = await createSettlement(db, {
        channelId: body.channelId,
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        createdByUserId: validated.user.id,
      });
      return NextResponse.json({ ok: true, settlement: item });
    }

    if (action === 'settle') {
      requirePermission(validated.user, 'revenue:read');
      const item = await markSettlementSettled(db, {
        settlementId: body.settlementId,
        settledAmountPaise: Number(body.settledAmountPaise),
        note: body.note,
        staffUserId: validated.user.id,
      });
      return NextResponse.json({ ok: true, settlement: item });
    }

    if (action === 'writeoff') {
      requirePermission(validated.user, 'settlement:writeoff');
      const item = await writeOffSettlement(db, body.settlementId, body.note || 'Written off');
      return NextResponse.json({ ok: true, settlement: item });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    if (err.statusCode === 403) return NextResponse.json({ ok: false, error: err.message }, { status: 403 });
    console.error('Settlement action error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Settlement action failed' }, { status: 500 });
  }
}
