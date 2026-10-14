import { NextResponse } from 'next/server';
import { createDb, getPublicMonthAvailability } from '@pavilion/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || '', 10) || now.getFullYear();
    const month = parseInt(searchParams.get('month') || '', 10) || now.getMonth() + 1;

    const db = createDb();
    const days = await getPublicMonthAvailability(db, year, month);

    return NextResponse.json({ ok: true, year, month, days });
  } catch (err) {
    console.error('Month availability error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch month availability' }, { status: 500 });
  }
}
