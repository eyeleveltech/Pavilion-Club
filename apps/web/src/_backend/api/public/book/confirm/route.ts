import { NextResponse } from 'next/server';

const TURFOS_API_URL = process.env.TURFOS_API_URL || 'http://localhost:3000';
const TURFOS_API_KEY = process.env.TURFOS_API_KEY || 'tk_live_lfRJCbZ7byy4us4J8QaxeNH7sJaddAX0';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, phone, name, email } = body;

    if (!reference) {
      return NextResponse.json({ ok: false, error: 'Booking reference is required' }, { status: 400 });
    }

    // Call TurfOS confirm API
    const res = await fetch(`${TURFOS_API_URL}/api/v1/bookings/${reference}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TURFOS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_name: name || 'Player',
        customer_email: email || '',
        customer_phone: phone || '',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('TurfOS confirm error:', res.status, errText);
      return NextResponse.json(
        { ok: false, error: 'Failed to confirm booking on engine' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      ok: true,
      booking: {
        id: data.booking_id,
        reference: data.booking_id,
        status: data.status,
      },
    });
  } catch (err) {
    console.error('Confirm pay at venue error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to confirm booking' }, { status: 500 });
  }
}
