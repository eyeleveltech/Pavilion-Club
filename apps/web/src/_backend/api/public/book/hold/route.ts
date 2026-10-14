import { NextResponse } from 'next/server';

const TURFOS_API_URL = process.env.TURFOS_API_URL || 'http://localhost:3000';
const TURFOS_API_KEY = process.env.TURFOS_API_KEY || 'tk_live_lfRJCbZ7byy4us4J8QaxeNH7sJaddAX0';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courtId, startsAt, endsAt, pricePaise, phone, name } = body;

    if (!courtId || !startsAt || !endsAt || !pricePaise) {
      return NextResponse.json({ ok: false, error: 'Slot details are required' }, { status: 400 });
    }

    const durationHours = Math.max(
      1,
      Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / (3600 * 1000))
    );

    const res = await fetch(`${TURFOS_API_URL}/api/v1/holds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TURFOS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        court_id: courtId,
        starts_at: new Date(startsAt).toISOString(),
        hours: durationHours,
        customer: {
          phone: phone || '9999999999',
          name: name || 'Guest Player',
        },
      }),
    });

    if (!res.ok) {
      if (res.status === 409) {
        return NextResponse.json(
          { ok: false, error: 'That slot is already booked or held. Please choose another slot.' },
          { status: 409 }
        );
      }
      const errText = await res.text();
      console.error('TurfOS hold API error:', res.status, errText);
      return NextResponse.json(
        { ok: false, error: 'Failed to reserve hold on engine' },
        { status: res.status }
      );
    }

    const turfData = await res.json();

    return NextResponse.json({
      ok: true,
      reference: turfData.booking_id,
      holdReference: turfData.booking_id,
      bookingId: turfData.booking_id,
      expiresAt: turfData.expires_at,
      startsAt: turfData.starts_at,
      endsAt: turfData.ends_at,
      slotAmountPaise: turfData.slot_amount_paise,
      totalPaise: turfData.total_paise,
    });
  } catch (err: any) {
    console.error('Hold creation error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to reserve hold' }, { status: 500 });
  }
}
