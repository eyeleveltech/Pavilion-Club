export type StaffRole = 'owner' | 'manager' | 'desk';

export type PermissionString =
  | 'booking:read'
  | 'booking:write'
  | 'booking:backdate'
  | 'pricing:write'
  | 'pricing:override'
  | 'reports:read'
  | 'reports:export'
  | 'revenue:read'
  | 'staff:manage'
  | 'partner:manage'
  | 'settings:write'
  | 'settlement:writeoff';

const ROLE_PERMISSIONS: Record<StaffRole, readonly PermissionString[]> = {
  owner: [
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
  ],
  manager: [
    'booking:read',
    'booking:write',
    'booking:backdate',
    'pricing:override',
    'reports:read',
    'reports:export',
    'revenue:read',
  ],
  desk: [
    'booking:read',
    'booking:write',
    'reports:read', // Desk staff see today only
  ],
};

/**
 * Checks if a given role possesses a specific permission
 */
export function hasPermission(role: string, permission: PermissionString): boolean {
  const permissions = ROLE_PERMISSIONS[role as StaffRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Enforces permission check server-side. Throws an error if permission is missing.
 * Does not return a boolean callers could forget to check.
 */
export function requirePermission(
  session: { role: string },
  permission: PermissionString
): void {
  if (!hasPermission(session.role, permission)) {
    throw new Error(`FORBIDDEN: Role '${session.role}' lacks required permission '${permission}'`);
  }
}
