import { NextResponse } from 'next/server';
import { createDb, generateAndSendOtp } from '@pavilion/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = body.phone;

    if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    const db = createDb();
    const result = await generateAndSendOtp(db, phone);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
    }

    return NextResponse.json({ ok: true, devCode: result.devCode });
  } catch (err) {
    console.error('OTP send error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}
