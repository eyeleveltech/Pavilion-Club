import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, authenticateStaff } from '@pavilion/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { ok: false, error: 'Phone/Email and password are required' },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0]?.trim() : '127.0.0.1';

    const db = createDb();
    const result = await authenticateStaff(db, {
      identifier: identifier.trim(),
      password,
      ip: ip || undefined,
    });

    if (!result.ok) {
      let status = 401;
      let message = 'Invalid credentials';

      if (result.error === 'ACCOUNT_LOCKED') {
        status = 429;
        message = 'Account locked for 15 minutes due to too many failed attempts.';
      } else if (result.error === 'USER_INACTIVE') {
        status = 403;
        message = 'User account has been deactivated.';
      }

      return NextResponse.json({ ok: false, error: message }, { status });
    }

    // Set secure HTTP-only cookie
    const isHttps = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';
    const cookieStore = await cookies();
    cookieStore.set('pavilion_session', result.token!, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      ok: true,
      user: result.user,
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
