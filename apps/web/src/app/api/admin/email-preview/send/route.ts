import { NextResponse } from 'next/server';
import { sendEmail } from '@pavilion/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const to = body.to?.trim();
    const subject = body.subject?.trim() || 'The Pavilion Club — Preview Email';
    const html = body.html;

    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid recipient email address' },
        { status: 400 }
      );
    }

    if (!html) {
      return NextResponse.json(
        { ok: false, error: 'Email HTML content is empty' },
        { status: 400 }
      );
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        error: result.error || 'Failed to dispatch email. Check SMTP settings.',
      });
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
    });
  } catch (err: any) {
    console.error('Email send test error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal error dispatching email' },
      { status: 500 }
    );
  }
}
