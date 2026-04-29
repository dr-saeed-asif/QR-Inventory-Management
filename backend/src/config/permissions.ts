export const permissionKeys = [
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
] as const

export type Permission = (typeof permissionKeys)[number]
export type AppRole = 'ADMIN' | 'MANAGER' | 'USER'

export const rolePermissions: Record<AppRole, Set<Permission>> = {
  ADMIN: new Set(permissionKeys),
  MANAGER: new Set<Permission>([
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
  ]),
  USER: new Set<Permission>([
    'items.read',
    'items.timeline.read',
    'categories.read',
    'stock.read',
    'scan.create',
    'qr.read',
    'reports.read',
  ]),
}

export const hasPermission = (role: string, permission: Permission) =>
  rolePermissions[role as AppRole]?.has(permission) ?? false
