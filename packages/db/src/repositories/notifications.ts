import { sendEmail } from '../email/smtp.js';
import { buildOtpHtmlEmail } from '../email/templates.js';
import { randomBytes, createHash } from 'node:crypto';
import type { Database } from '../client.js';
import { otpCodes, messageOutbox, sessions, loginAttempts } from '../schema/ops.js';
import { customers } from '../schema/customers.js';
import { sql, eq, and, gt, desc } from 'drizzle-orm';

export interface OtpGenerateResult {
  ok: boolean;
  error?: string | undefined;
  devCode?: string | undefined;
}

export async function generateAndSendOtp(
  db: Database,
  phoneParam: string,
  ipParam?: string,
  channelParam?: 'phone' | 'email' | 'whatsapp',
  emailParam?: string
): Promise<OtpGenerateResult> {
  const phone = phoneParam.trim();
  const email = emailParam?.trim().toLowerCase();
  const channel = channelParam === 'email' ? 'email' : 'whatsapp';
  const now = new Date();
  const ip = ipParam?.trim() || '127.0.0.1';

  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  const isDev = process.env.NODE_ENV !== 'production';
  const maxIpLimit = (isTest || isDev) ? 500 : 10;
  const maxPhoneLimit = 3;

  // 1. Rate Limiting per IP: max 10 requests per 15 min (Audit §4.2)
  if (ip) {
    const recentIpAttempts = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), gt(loginAttempts.createdAt, fifteenMinutesAgo)));

    if ((recentIpAttempts[0]?.count ?? 0) >= maxIpLimit) {
      return {
        ok: false,
        error: 'Too many OTP requests from this network. Please wait 15 minutes before requesting again.',
      };
    }
  }

  // 2. Rate Limiting per Phone: max 3 OTP sends per phone per 15 minutes
  const recentOtps = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, fifteenMinutesAgo)));

  const count = recentOtps[0]?.count ?? 0;
  if (count >= maxPhoneLimit) {
    return {
      ok: false,
      error: 'Too many OTP requests. Please wait 15 minutes before requesting again.',
    };
  }

  // Record IP attempt
  await db.insert(loginAttempts).values({
    identifier: channel === 'email' && email ? email : phone,
    ip,
    succeeded: true,
  });

  // 6-digit random code
  const codeInt = Math.floor(100000 + Math.random() * 900000);
  const codeStr = codeInt.toString();
  const codeHash = createHash('sha256').update(codeStr).digest('hex');
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5-minute validity

  await db.insert(otpCodes).values({
    phone,
    codeHash,
    expiresAt,
  });

  // Queue in message_outbox according to chosen channel (WhatsApp/SMS vs Email)
  await db.insert(messageOutbox).values({
    channel,
    toPhone: phone,
    toEmail: email || null,
    template: 'otp',
    payload: { codeHash, validMinutes: 5, target: channel === 'email' ? email : phone },
    status: 'queued',
  });

  // If channel is Email, trigger live dispatch via Gmail SMTP (or Resend fallback)
  if (channel === 'email' && email) {
    try {
      await sendEmail({
        to: email,
        subject: `Your Pavilion Club Verification Code: ${codeStr}`,
        html: buildOtpHtmlEmail(codeStr),
      });
    } catch (err) {
      console.error('[Email Dispatch Error]', err);
    }
  }

  return {
    ok: true,
    devCode: codeStr,
  };
}

export interface VerifyOtpResult {
  ok: boolean;
  error?: string | undefined;
  sessionToken?: string | undefined;
  customer?: { id: string; name: string | null; phone: string } | undefined;
}

export async function verifyOtpAndCreateSession(
  db: Database,
  input: {
    phone: string;
    code: string;
    name?: string | undefined;
    email?: string | undefined;
  }
): Promise<VerifyOtpResult> {
  const phone = input.phone.trim();
  const code = input.code.trim();
  const now = new Date();

  // Find latest active OTP for this phone
  const rows = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.expiresAt, now)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  const activeOtp = rows[0];
  if (!activeOtp || activeOtp.consumedAt) {
    return { ok: false, error: 'Invalid or expired OTP. Please request a new one.' };
  }

  if (activeOtp.attempts >= 5) {
    return { ok: false, error: 'Maximum verification attempts exceeded. Code has been burned.' };
  }

  // Check Hash
  const inputHash = createHash('sha256').update(code).digest('hex');
  if (inputHash !== activeOtp.codeHash) {
    await db
      .update(otpCodes)
      .set({ attempts: activeOtp.attempts + 1 })
      .where(eq(otpCodes.id, activeOtp.id));
    return { ok: false, error: 'Incorrect verification code.' };
  }

  // Mark OTP consumed
  await db
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(eq(otpCodes.id, activeOtp.id));

  // Find or Create Customer
  let customerRows = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .limit(1);

  let customer = customerRows[0];
  if (!customer) {
    const inserted = await db
      .insert(customers)
      .values({
        phone,
        name: input.name?.trim() || 'Pavilion Player',
        email: input.email?.trim().toLowerCase() || null,
      })
      .returning();
    customer = inserted[0]!;
  } else {
    const updates: Record<string, any> = { updatedAt: now };
    if (input.name && input.name.trim() && customer.name === 'Pavilion Player') {
      updates.name = input.name.trim();
    }
    if (input.email && input.email.trim()) {
      updates.email = input.email.trim().toLowerCase();
    }
    if (Object.keys(updates).length > 1) {
      await db
        .update(customers)
        .set(updates)
        .where(eq(customers.id, customer.id));
    }
  }

  // Create Customer Session (30-day session)
  const sessionToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
  const sessionExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    customerId: customer.id,
    tokenHash,
    expiresAt: sessionExpiresAt,
  });

  return {
    ok: true,
    sessionToken,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
    },
  };
}

export async function validateCustomerSession(
  db: Database,
  sessionToken: string
) {
  const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
  const now = new Date();

  const rows = await db
    .select({
      sessionId: sessions.id,
      customerId: sessions.customerId,
      expiresAt: sessions.expiresAt,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      isBlocked: customers.isBlocked,
    })
    .from(sessions)
    .innerJoin(customers, eq(sessions.customerId, customers.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1);

  const item = rows[0];
  if (!item || !item.customerId) return null;

  return {
    customer: {
      id: item.customerId,
      name: item.name || 'Player',
      phone: item.phone ?? '',
      email: item.email,
      isBlocked: item.isBlocked,
    },
  };
}

export async function queueNotificationMessage(
  db: Database,
  input: {
    toPhone?: string | undefined;
    toEmail?: string | undefined;
    template: string;
    payload: Record<string, unknown>;
    bookingId?: string | undefined;
  }
) {
  await db.insert(messageOutbox).values({
    channel: 'whatsapp',
    toPhone: input.toPhone || null,
    toEmail: input.toEmail || null,
    template: input.template,
    payload: input.payload,
    bookingId: input.bookingId || null,
    status: 'queued',
  });
}

export async function sendEmailWithResend(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    console.warn('[Resend] RESEND_API_KEY is not set in environment.');
    return { ok: false, error: 'RESEND_API_KEY is not configured in .env' };
  }

  const fromEmail = process.env.EMAIL_FROM || 'The Pavilion Club <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      console.error('[Resend Error]', data);
      return { ok: false, error: data.message || 'Failed to dispatch email via Resend' };
    }

    console.log(`[Resend Success] OTP Email dispatched to ${options.to} (ID: ${data.id})`);
    return { ok: true, id: data.id };
  } catch (err: any) {
    console.error('[Resend Network Error]', err);
    return { ok: false, error: err.message || 'Network error sending email via Resend' };
  }
}


