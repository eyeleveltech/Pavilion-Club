import { NextResponse } from 'next/server';
import { createDb, authenticatePartnerRequest, confirmPartnerBooking } from '@pavilion/db';

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
    const { booking_id, partner_reference, amount_collected_paise, court_id, starts_at, ends_at, customer } = body;

    if (!partner_reference) {
      return NextResponse.json(
        { error: { code: 'missing_fields', message: 'partner_reference is required' } },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await confirmPartnerBooking(db, {
      bookingId: booking_id,
      courtId: court_id,
      startsAt: starts_at ? new Date(starts_at) : undefined,
      endsAt: ends_at ? new Date(ends_at) : undefined,
      channelId: auth.channel.id,
      apiKeyId: auth.apiKey.id,
      partnerReference: partner_reference,
      amountCollectedPaise: Number(amount_collected_paise) || 80000,
      customerPhone: customer?.phone,
      customerName: customer?.name,
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: Number(result.status) || 400, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err: any) {
    if (err.message?.includes('bookings_no_overlap')) {
      return NextResponse.json(
        { error: { code: 'slot_taken', message: 'That slot is no longer available.' } },
        { status: 409, headers: CORS_HEADERS }
      );
    }
    console.error('Partner confirm error:', err);
    return NextResponse.json(
      { error: { code: 'internal', message: 'Internal server error' } },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
