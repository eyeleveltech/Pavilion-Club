import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateCustomerSession, cancelBookingByCustomer } from '@pavilion/db';

const TURFOS_API_URL = process.env.TURFOS_API_URL || 'http://localhost:3000';
const TURFOS_API_KEY = process.env.TURFOS_API_KEY ?? '';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_customer_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateCustomerSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    const body = await request.json();
    const bookingId = body.bookingId;

    if (!bookingId) {
      return NextResponse.json({ ok: false, error: 'Booking ID is required' }, { status: 400 });
    }

    // 1. Cancel on TurfOS backend
    try {
      const res = await fetch(`${TURFOS_API_URL}/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TURFOS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Cancelled by customer via My Bookings',
          cancelled_by: 'customer',
        }),
      });

      if (res.ok) {
        return NextResponse.json({ ok: true });
      }
    } catch (err) {
      console.error('TurfOS cancel error:', err);
    }

    // 2. Fallback to local DB cancel
    const result = await cancelBookingByCustomer(db, {
      bookingId,
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
