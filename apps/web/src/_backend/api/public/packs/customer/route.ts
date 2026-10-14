import { NextResponse } from 'next/server';

const TURFOS_API_URL = process.env.TURFOS_API_URL || 'http://localhost:3000';
const TURFOS_API_KEY = process.env.TURFOS_API_KEY || 'tk_live_lfRJCbZ7byy4us4J8QaxeNH7sJaddAX0';
const TURFOS_VENUE_ID = process.env.TURFOS_VENUE_ID || '98944320-a082-427e-86d8-cbf811c83a1d';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone parameter required' }, { status: 400 });
    }

    const res = await fetch(
      `${TURFOS_API_URL}/api/v1/venues/${TURFOS_VENUE_ID}/customers/${encodeURIComponent(phone)}/packs`,
      {
        headers: {
          Authorization: `Bearer ${TURFOS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
