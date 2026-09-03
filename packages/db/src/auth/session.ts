import crypto from 'node:crypto';
import { and, eq, gte, sql } from 'drizzle-orm';
import type { Database } from '../client.js';
import { users } from '../schema/users.js';
import { sessions, loginAttempts } from '../schema/ops.js';
import { verifyPassword } from './password.js';

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface AuthenticateResult {
  ok: boolean;
  error?: 'ACCOUNT_LOCKED' | 'INVALID_CREDENTIALS' | 'USER_INACTIVE';
  token?: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    role: string;
  };
}

/**
 * Authenticate staff with phone/email + password.
 * Checks rate limits (5 failed attempts in 15m -> lock 15m).
 * Generates secure session token stored as SHA-256 in DB.
 */
export async function authenticateStaff(
  db: Database,
  params: {
    identifier: string; // phone or email
    password: string;
    ip?: string | undefined;
  }
): Promise<AuthenticateResult> {
  const { identifier, password, ip } = params;
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  // 1. Check failed login attempts within 15 minutes for this identifier
  const recentFailures = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier),
        eq(loginAttempts.succeeded, false),
        gte(loginAttempts.createdAt, fifteenMinutesAgo)
      )
    );

  const failCount = recentFailures[0]?.count ?? 0;
  if (failCount >= 5) {
    return { ok: false, error: 'ACCOUNT_LOCKED' };
  }

  // 2. Lookup user by phone or email
  const foundUsers = await db
    .select()
    .from(users)
    .where(
      identifier.includes('@')
        ? eq(users.email, identifier)
        : eq(users.phone, identifier)
    );

  const user = foundUsers[0];

  if (!user || !user.passwordHash) {
    // Record failure
    await db.insert(loginAttempts).values({
      identifier,
      ip: ip ?? null,
      succeeded: false,
    });
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  if (!user.isActive) {
    await db.insert(loginAttempts).values({
      identifier,
      ip: ip ?? null,
      succeeded: false,
    });
    return { ok: false, error: 'USER_INACTIVE' };
  }

  // 3. Verify Argon2id password hash
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    await db.insert(loginAttempts).values({
      identifier,
      ip: ip ?? null,
      succeeded: false,
    });
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  // 4. Record success
  await db.insert(loginAttempts).values({
    identifier,
    ip: ip ?? null,
    succeeded: true,
  });

  // 5. Generate secure session token (raw token sent to client cookie, hash in db)
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(sessions).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    ok: true,
    token: rawToken,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Validate an active session from raw cookie token.
 */
export async function validateSession(
  db: Database,
  rawToken: string
): Promise<{
  session: typeof sessions.$inferSelect;
  user: typeof users.$inferSelect;
} | null> {
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();

  const rows = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gte(sessions.expiresAt, now)));

  const result = rows[0];
  if (!result || !result.user.isActive) {
    return null;
  }

  return result;
}

/**
 * Revoke/delete a session on logout.
 */
export async function destroySession(db: Database, rawToken: string): Promise<void> {
  const tokenHash = hashSessionToken(rawToken);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}
