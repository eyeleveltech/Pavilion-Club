import { NextResponse } from 'next/server';
import { createDb, getPublicDaySlots } from '@pavilion/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]!;

    const db = createDb();
    const data = await getPublicDaySlots(db, date);

    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    console.error('Public day slots error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch slots' }, { status: 500 });
  }
}
