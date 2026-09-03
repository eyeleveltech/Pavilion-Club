import { NextResponse } from 'next/server';
import { createDb, authenticatePartnerRequest, createPartnerHold } from '@pavilion/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('X-Api-Key');
    const db = createDb();

    const auth = await authenticatePartnerRequest(db, authHeader, 'bookings:write');
    if (!auth.ok) {
      return NextResponse.json(
        { error: { code: auth.errorCode, message: auth.errorMessage } },
        { status: auth.statusCode || 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json();
    const { court_id, starts_at, ends_at, customer } = body;

    if (!court_id || !starts_at || !ends_at) {
      return NextResponse.json(
        { error: { code: 'missing_fields', message: 'court_id, starts_at, and ends_at are required' } },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await createPartnerHold(db, {
      courtId: court_id,
      startsAt: new Date(starts_at),
      endsAt: new Date(ends_at),
      channelId: auth.channel.id,
      apiKeyId: auth.apiKey.id,
      customerPhone: customer?.phone,
      customerName: customer?.name,
    });

    return NextResponse.json(result, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    if (err.message?.includes('bookings_no_overlap')) {
      return NextResponse.json(
        { error: { code: 'slot_taken', message: 'That slot is no longer available.' } },
        { status: 409, headers: CORS_HEADERS }
      );
    }
    console.error('Partner hold error:', err);
    return NextResponse.json(
      { error: { code: 'internal', message: 'Internal server error' } },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
