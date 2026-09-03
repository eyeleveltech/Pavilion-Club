import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateCustomerSession, confirmPublicPayAtVenue } from '@pavilion/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, phone, name } = body;

    if (!reference) {
      return NextResponse.json({ ok: false, error: 'Booking reference is required' }, { status: 400 });
    }

    const db = createDb();
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_customer_session')?.value;
    const validated = token ? await validateCustomerSession(db, token) : null;

    if (!validated) {
      return NextResponse.json({ ok: false, error: 'Customer authentication required via OTP' }, { status: 401 });
    }

    const result = await confirmPublicPayAtVenue(db, {
      reference,
      customerId: validated.customer.id,
      customerName: name || validated.customer.name || 'Player',
      customerPhone: phone || validated.customer.phone,
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
