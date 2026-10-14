import { NextResponse } from 'next/server';
import { createDb, authenticatePartnerRequest, cancelPartnerBooking } from '@pavilion/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization') || request.headers.get('X-Api-Key');
    const db = createDb();

    const auth = await authenticatePartnerRequest(db, authHeader, 'bookings:cancel');
    if (!auth.ok) {
      return NextResponse.json(
        { error: { code: auth.errorCode, message: auth.errorMessage } },
        { status: auth.statusCode || 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = await cancelPartnerBooking(db, id, auth.channel.id, body.reason);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: Number(result.status) || 400, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        booking_id: result.booking_id,
        status: result.booking_status,
        refund_due_paise: result.refund_due_paise,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('Partner cancel error:', err);
    return NextResponse.json(
      { error: { code: 'internal', message: 'Internal server error' } },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
