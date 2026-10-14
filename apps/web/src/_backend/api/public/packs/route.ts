import { NextResponse } from 'next/server';

const TURFOS_API_URL = process.env.TURFOS_API_URL || 'http://localhost:3000';
const TURFOS_API_KEY = process.env.TURFOS_API_KEY || 'tk_live_lfRJCbZ7byy4us4J8QaxeNH7sJaddAX0';
const TURFOS_VENUE_ID = process.env.TURFOS_VENUE_ID || '98944320-a082-427e-86d8-cbf811c83a1d';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');

    const url = new URL(`${TURFOS_API_URL}/api/v1/venues/${TURFOS_VENUE_ID}/packs`);
    if (sport) url.searchParams.set('sport', sport);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${TURFOS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: 'Failed to fetch packs from TurfOS engine', details: err },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
