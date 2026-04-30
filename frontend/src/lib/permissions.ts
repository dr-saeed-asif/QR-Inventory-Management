import type { UserRole } from '@/types'

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

const rolePermissions: Record<UserRole, Set<Permission>> = {
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
    'settings.read',
  ]),
}

export const hasPermission = (role: UserRole | undefined, permission: Permission) =>
  role ? rolePermissions[role].has(permission) : false
