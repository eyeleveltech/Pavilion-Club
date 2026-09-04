import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateCustomerSession, confirmPublicPayAtVenue, customers, eq } from '@pavilion/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, phone, name, sessionToken } = body;

    if (!reference) {
      return NextResponse.json({ ok: false, error: 'Booking reference is required' }, { status: 400 });
    }

    const db = createDb();
    const cookieStore = await cookies();
    const token =
      sessionToken ||
      request.headers.get('Authorization')?.replace('Bearer ', '') ||
      cookieStore.get('pavilion_customer_session')?.value;

    const validated = token ? await validateCustomerSession(db, token) : null;

    // Resilient Customer Resolution (works even if plain HTTP dropped the cookie)
    let customerId = validated?.customer?.id;
    let customerName = name || validated?.customer?.name || 'Player';
    let customerPhone = phone || validated?.customer?.phone;

    if (!customerId && phone) {
      const cleanPhone = phone.trim();
      const existing = await db.select().from(customers).where(eq(customers.phone, cleanPhone)).limit(1);
      if (existing[0]) {
        customerId = existing[0].id;
        customerName = name || existing[0].name || 'Player';
        customerPhone = cleanPhone;
      } else {
        const [inserted] = await db
          .insert(customers)
          .values({
            phone: cleanPhone,
            name: name || 'Player',
          })
          .returning();
        customerId = inserted!.id;
        customerPhone = cleanPhone;
      }
    }

    if (!customerId) {
      return NextResponse.json({ ok: false, error: 'Customer authentication required via OTP' }, { status: 401 });
    }

    const result = await confirmPublicPayAtVenue(db, {
      reference,
      customerId,
      customerName,
      customerPhone,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, booking: result.booking });
  } catch (err) {
    console.error('Confirm pay at venue error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to confirm booking' }, { status: 500 });
  }
}
