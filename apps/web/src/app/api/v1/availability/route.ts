import { NextResponse } from 'next/server';
import { createDb, authenticatePartnerRequest, getPartnerAvailability } from '@pavilion/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('X-Api-Key');
    const db = createDb();

    const auth = await authenticatePartnerRequest(db, authHeader, 'availability:read');
    if (!auth.ok) {
      return NextResponse.json(
        { error: { code: auth.errorCode, message: auth.errorMessage } },
        { status: auth.statusCode || 401, headers: CORS_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) {
      return NextResponse.json(
        { error: { code: 'missing_fields', message: 'Query parameter ?date=YYYY-MM-DD is required' } },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const courtId = searchParams.get('court_id') || undefined;
    const data = await getPartnerAvailability(db, date, courtId);

    return NextResponse.json(data, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Partner availability error:', err);
    return NextResponse.json(
      { error: { code: 'internal', message: 'Internal server error' } },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
