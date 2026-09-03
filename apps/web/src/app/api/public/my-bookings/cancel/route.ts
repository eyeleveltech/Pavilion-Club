import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateCustomerSession, cancelBookingByCustomer } from '@pavilion/db';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_customer_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateCustomerSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    const body = await request.json();
    const result = await cancelBookingByCustomer(db, {
      bookingId: body.bookingId,
      customerId: validated.customer.id,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Cancel booking error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to cancel booking' }, { status: 500 });
  }
}
