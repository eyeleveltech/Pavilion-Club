import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateSession, customers, bookings, eq, sql } from '@pavilion/db';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone')?.trim() || '';

    if (!rawPhone || rawPhone.length < 5) {
      return NextResponse.json({ ok: true, found: false });
    }

    // Clean phone number format
    const cleaned = rawPhone.replace(/[^\d+]/g, '');

    const query = await db.execute<{
      id: string;
      name: string | null;
      phone: string;
      booking_count: number;
    }>(sql`
      SELECT 
        c.id,
        c.name,
        c.phone,
        COUNT(b.id)::int AS booking_count
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customer_id AND b.status IN ('confirmed', 'completed')
      WHERE c.phone = ${cleaned} OR c.phone = ${'+91' + cleaned} OR c.phone LIKE ${'%' + cleaned}
      GROUP BY c.id
      LIMIT 1
    `);

    if (query.rows.length === 0) {
      return NextResponse.json({ ok: true, found: false });
    }

    const row = query.rows[0]!;
    return NextResponse.json({
      ok: true,
      found: true,
      customer: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        bookingCount: Number(row.booking_count),
      },
    });
  } catch (err) {
    console.error('Failed to lookup customer:', err);
    return NextResponse.json(
      { ok: false, error: 'Customer lookup failed' },
      { status: 500 }
    );
  }
}
