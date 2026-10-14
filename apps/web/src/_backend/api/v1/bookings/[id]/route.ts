import { NextResponse } from 'next/server';
import { createDb, authenticatePartnerRequest, getPartnerBookingDetail } from '@pavilion/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization') || request.headers.get('X-Api-Key');
    const db = createDb();

    const auth = await authenticatePartnerRequest(db, authHeader, 'bookings:read');
    if (!auth.ok) {
      return NextResponse.json(
        { error: { code: auth.errorCode, message: auth.errorMessage } },
        { status: auth.statusCode || 401, headers: CORS_HEADERS }
      );
    }

    const booking = await getPartnerBookingDetail(db, id, auth.channel.id);
    if (!booking) {
      // 404 not_found for a booking not created by your key (docs/system/08-partner-api.md)
      return NextResponse.json(
        { error: { code: 'not_found', message: 'No such booking, or not created by your key' } },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(booking, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Partner get booking error:', err);
    return NextResponse.json(
      { error: { code: 'internal', message: 'Internal server error' } },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
