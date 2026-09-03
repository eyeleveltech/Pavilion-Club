import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateSession, getActivePriceRules, getBookableCourts } from '@pavilion/db';
import { resolvePrice, minutesToLabel } from '@pavilion/core';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    const rules = await getActivePriceRules(db);
    const courts = await getBookableCourts(db);

    return NextResponse.json({
      ok: true,
      rules: rules.map((r) => {
        const fromMin = r.fromMinutes ?? 0;
        const toMin = r.toMinutes ?? 1440;
        return {
          id: r.id,
          name: r.name,
          courtId: r.courtId,
          courtName: courts.find((c) => c.id === r.courtId)?.name || 'All Courts',
          weekdays: r.weekdays,
          fromMinutes: fromMin,
          toMinutes: toMin,
          fromLabel: r.fromMinutes !== null ? minutesToLabel(r.fromMinutes) : '00:00',
          toLabel: r.toMinutes !== null ? minutesToLabel(r.toMinutes) : '24:00',
          priority: r.priority,
          pricePaise: r.pricePaise,
          priceRupees: r.pricePaise / 100,
          isActive: r.isActive,
        };
      }),
      courts: courts.map((c) => ({ id: c.id, name: c.name })),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch price rules' }, { status: 500 });
  }
}
