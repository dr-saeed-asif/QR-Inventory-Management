export const permissionKeys = [
  'dashboard.read',
  'items.read',
  'items.create',
  'items.update',
  'items.delete',
  'items.import',
  'items.timeline.read',
  'categories.read',
  'categories.manage',
  'stock.read',
  'stock.write',
  'scan.create',
  'qr.read',
  'reports.read',
  'reports.export',
  'alerts.read',
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'roles.read',
  'roles.create',
  'roles.update',
  'roles.delete',
  'settings.read',
] as const

export type Permission = (typeof permissionKeys)[number]
export type AppRole = 'ADMIN' | 'MANAGER' | 'USER'

export const rolePermissions: Record<AppRole, Set<Permission>> = {
  ADMIN: new Set(permissionKeys),
  MANAGER: new Set<Permission>([
    'dashboard.read',
    'items.read',
    'items.create',
    'items.update',
    'items.import',
    'items.timeline.read',
    'categories.read',
    'categories.manage',
    'stock.read',
    'stock.write',
    'scan.create',
    'qr.read',
    'reports.read',
    'alerts.read',
    'settings.read',
  ]),
  USER: new Set<Permission>([
    'dashboard.read',
    'items.read',
    'items.timeline.read',
    'categories.read',
    'stock.read',
    'scan.create',
    'qr.read',
    'reports.read',
    'alerts.read',
    'settings.read',
  ]),
}

export const hasPermission = (role: string, permission: Permission) =>
  rolePermissions[role as AppRole]?.has(permission) ?? false
