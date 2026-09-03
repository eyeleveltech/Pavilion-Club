import { describe, it, expect } from 'vitest';
import { hasPermission, requirePermission, type PermissionString as StaffPermission } from './permissions.js';

describe('GATE 1: Permission Matrix CI Guard (docs/system/11-roles-permissions.md)', () => {
  const deskUser = { id: 'desk-user-1', name: 'Suresh', role: 'desk' as const };
  const managerUser = { id: 'mgr-user-1', name: 'Anand', role: 'manager' as const };
  const ownerUser = { id: 'owner-user-1', name: 'Jayaraman', role: 'owner' as const };

  const allRestrictedForDesk: StaffPermission[] = [
    'booking:backdate',
    'pricing:write',
    'pricing:override',
    'reports:export',
    'revenue:read',
    'staff:manage',
    'partner:manage',
    'settings:write',
    'settlement:writeoff',
  ];

  it('strictly rejects desk role on every single restricted permission in the matrix', () => {
    for (const perm of allRestrictedForDesk) {
      expect(hasPermission(deskUser.role, perm)).toBe(false);
      expect(() => requirePermission(deskUser, perm)).toThrow(/FORBIDDEN/);
    }
  });

  it('allows desk role only front-counter operational permissions', () => {
    expect(hasPermission(deskUser.role, 'booking:read')).toBe(true);
    expect(hasPermission(deskUser.role, 'booking:write')).toBe(true);
    expect(hasPermission(deskUser.role, 'reports:read')).toBe(true);

    expect(() => requirePermission(deskUser, 'booking:read')).not.toThrow();
    expect(() => requirePermission(deskUser, 'booking:write')).not.toThrow();
    expect(() => requirePermission(deskUser, 'reports:read')).not.toThrow();
  });

  it('enforces manager boundaries: can override price & read revenue, but cannot touch owner settings', () => {
    // Manager CAN override and read revenue
    expect(hasPermission(managerUser.role, 'pricing:override')).toBe(true);
    expect(hasPermission(managerUser.role, 'revenue:read')).toBe(true);
    expect(hasPermission(managerUser.role, 'booking:backdate')).toBe(true);
    expect(hasPermission(managerUser.role, 'reports:export')).toBe(true);

    // Manager CANNOT edit base prices or manage staff/partners/venue
    const ownerOnlyPerms: StaffPermission[] = [
      'pricing:write',
      'staff:manage',
      'partner:manage',
      'settings:write',
      'settlement:writeoff',
    ];

    for (const perm of ownerOnlyPerms) {
      expect(hasPermission(managerUser.role, perm)).toBe(false);
      expect(() => requirePermission(managerUser, perm)).toThrow(/FORBIDDEN/);
    }
  });

  it('grants owner full operational, financial, and administrative permissions', () => {
    const allPermissions: StaffPermission[] = [
      'booking:read',
      'booking:write',
      'booking:backdate',
      'pricing:write',
      'pricing:override',
      'reports:read',
      'reports:export',
      'revenue:read',
      'staff:manage',
      'partner:manage',
      'settings:write',
      'settlement:writeoff',
    ];

    for (const perm of allPermissions) {
      expect(hasPermission(ownerUser.role, perm)).toBe(true);
      expect(() => requirePermission(ownerUser, perm)).not.toThrow();
    }
  });
});
