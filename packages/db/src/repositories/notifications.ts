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
  ipParam?: string
): Promise<OtpGenerateResult> {
  const phone = phoneParam.trim();
  const now = new Date();
  const ip = ipParam?.trim() || '127.0.0.1';

  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // 1. Rate Limiting per IP: max 10 requests per 15 min (Audit §4.2)
  if (ip) {
    const recentIpAttempts = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), gt(loginAttempts.createdAt, fifteenMinutesAgo)));

    if ((recentIpAttempts[0]?.count ?? 0) >= 10) {
      return {
        ok: false,
        error: 'Too many OTP requests from this network. Please wait 15 minutes before requesting again.',
      };
    }
  }

  // 2. Rate Limiting per Phone: max 3 OTP sends per phone per 15 minutes (docs/system/12-notifications.md)
  const recentOtps = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, fifteenMinutesAgo)));

  const count = recentOtps[0]?.count ?? 0;
  if (count >= 3) {
    return {
      ok: false,
      error: 'Too many OTP requests. Please wait 15 minutes before requesting again.',
    };
  }

  // Record IP attempt
  await db.insert(loginAttempts).values({
    identifier: phone,
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

  // Queue in message_outbox WITHOUT storing plaintext code in jsonb (Audit §4.1)
  await db.insert(messageOutbox).values({
    channel: 'whatsapp',
    toPhone: phone,
    template: 'otp',
    payload: { codeHash, validMinutes: 5 },
    status: 'queued',
  });

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
      })
      .returning();
    customer = inserted[0]!;
  } else if (input.name && input.name.trim() && customer.name === 'Pavilion Player') {
    await db
      .update(customers)
      .set({ name: input.name.trim(), updatedAt: now })
      .where(eq(customers.id, customer.id));
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
