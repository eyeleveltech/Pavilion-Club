import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, verifyOtpAndCreateSession } from '@pavilion/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code, name } = body;

    if (!phone || !code) {
      return NextResponse.json({ ok: false, error: 'Phone and OTP code are required' }, { status: 400 });
    }

    const db = createDb();
    const result = await verifyOtpAndCreateSession(db, { phone, code, name });

    if (!result.ok || !result.sessionToken) {
      return NextResponse.json({ ok: false, error: result.error || 'Verification failed' }, { status: 400 });
    }

    const isHttps = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';

    const cookieStore = await cookies();
    cookieStore.set('pavilion_customer_session', result.sessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      ok: true,
      sessionToken: result.sessionToken,
      customer: result.customer,
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    return NextResponse.json({ ok: false, error: 'Verification error' }, { status: 500 });
  }
}
