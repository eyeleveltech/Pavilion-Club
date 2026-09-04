import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';
import { hasPermission, requirePermission } from './permissions.js';
import {
  authenticateStaff,
  validateSession,
  destroySession,
} from './session.js';
import { createDb } from '../client.js';
import { loginAttempts } from '../schema/ops.js';
import { eq } from 'drizzle-orm';

describe('Auth & Permission Guard', () => {
  const db = createDb();

  describe('Argon2id Password Hashing', () => {
    it('hashes and successfully verifies correct password', async () => {
      const password = 'Desk@Pavilion2026';
      const hashed = await hashPassword(password);

      expect(hashed).toMatch(/^\$argon2id\$/);
      const isMatch = await verifyPassword(password, hashed);
      expect(isMatch).toBe(true);

      const isBadMatch = await verifyPassword('WrongPassword', hashed);
      expect(isBadMatch).toBe(false);
    });
  });

  describe('The Permission Matrix (11-roles-permissions.md)', () => {
    it('grants desk role only front desk operational permissions', () => {
      const deskSession = { role: 'desk' };

      expect(hasPermission('desk', 'booking:read')).toBe(true);
      expect(hasPermission('desk', 'booking:write')).toBe(true);
      expect(hasPermission('desk', 'reports:read')).toBe(true);

      // Desk cannot backdate, read month revenue, write pricing, or write off settlements
      expect(hasPermission('desk', 'booking:backdate')).toBe(false);
      expect(hasPermission('desk', 'revenue:read')).toBe(false);
      expect(hasPermission('desk', 'pricing:write')).toBe(false);
      expect(hasPermission('desk', 'settings:write')).toBe(false);
      expect(hasPermission('desk', 'settlement:writeoff')).toBe(false);

      expect(() => requirePermission(deskSession, 'booking:read')).not.toThrow();
      expect(() => requirePermission(deskSession, 'revenue:read')).toThrow(/FORBIDDEN/);
      expect(() => requirePermission(deskSession, 'booking:backdate')).toThrow(/FORBIDDEN/);
    });

    it('grants manager role operational & override access without owner-only permissions', () => {
      const managerSession = { role: 'manager' };

      expect(hasPermission('manager', 'booking:backdate')).toBe(true);
      expect(hasPermission('manager', 'pricing:override')).toBe(true);
      expect(hasPermission('manager', 'revenue:read')).toBe(true);

      // Manager cannot edit base prices or manage staff/partners
      expect(hasPermission('manager', 'pricing:write')).toBe(false);
      expect(hasPermission('manager', 'staff:manage')).toBe(false);
      expect(hasPermission('manager', 'settings:write')).toBe(false);

      expect(() => requirePermission(managerSession, 'revenue:read')).not.toThrow();
      expect(() => requirePermission(managerSession, 'pricing:write')).toThrow(/FORBIDDEN/);
    });

    it('grants owner role full permissions', () => {
      const ownerSession = { role: 'owner' };

      expect(hasPermission('owner', 'booking:write')).toBe(true);
      expect(hasPermission('owner', 'pricing:write')).toBe(true);
      expect(hasPermission('owner', 'staff:manage')).toBe(true);
      expect(hasPermission('owner', 'settings:write')).toBe(true);
      expect(hasPermission('owner', 'settlement:writeoff')).toBe(true);

      expect(() => requirePermission(ownerSession, 'settlement:writeoff')).not.toThrow();
    });
  });

  describe('Staff Authentication & Session Lifecycle', () => {
    it('successfully logs in receptionist Suresh and validates session', async () => {
      const result = await authenticateStaff(db, {
        identifier: '+919876543210',
        password: 'Desk@Pavilion2026',
        ip: '127.0.0.1',
      });

      expect(result.ok).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user?.role).toBe('desk');
      expect(result.user?.name).toBe('Suresh Kumar');

      // Validate session
      const validated = await validateSession(db, result.token!);
      expect(validated).not.toBeNull();
      expect(validated?.user.name).toBe('Suresh Kumar');
      expect(validated?.user.role).toBe('desk');

      // Destroy session (Logout)
      await destroySession(db, result.token!);
      const afterLogout = await validateSession(db, result.token!);
      expect(afterLogout).toBeNull();
    });

    it('rejects invalid password and throttles after 5 failed attempts', async () => {
      const testPhone = `+9199999${Math.floor(10000 + Math.random() * 90000)}`;
      await db.delete(loginAttempts).where(eq(loginAttempts.identifier, testPhone));

      // 1 to 4 should return INVALID_CREDENTIALS
      for (let i = 0; i < 4; i++) {
        const attempt = await authenticateStaff(db, {
          identifier: testPhone,
          password: 'WrongPassword',
        });
        expect(attempt.ok).toBe(false);
        expect(attempt.error).toBe('INVALID_CREDENTIALS');
      }

      // 5th failed attempt
      await authenticateStaff(db, {
        identifier: testPhone,
        password: 'WrongPassword',
      });

      // 6th attempt should be LOCKED
      const lockedAttempt = await authenticateStaff(db, {
        identifier: testPhone,
        password: 'Desk@Pavilion2026',
      });
      expect(lockedAttempt.ok).toBe(false);
      expect(lockedAttempt.error).toBe('ACCOUNT_LOCKED');
    });
  });
});
