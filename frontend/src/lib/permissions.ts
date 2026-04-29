import type { UserRole } from '@/types'

export const permissionKeys = [
  'Read',
  'Create',
  'Update',
  'Delete',
  'Import',
  'Read',
  'Read',
  'Manage',
  'Read',
  'Write',
  'Create',
  'Read',
  'Export',
  'Export',
] as const

export type Permission = (typeof permissionKeys)[number]

const rolePermissions: Record<UserRole, Set<Permission>> = {
  ADMIN: new Set(permissionKeys),
  MANAGER: new Set<Permission>([
    'Read',
    'Create',
    'Update',
    'Import',
    'Read',
    'Read',
    'Manage',
    'Read',
    'Write',
    'Create',
    'Read',
    'Export',
  ]),
  USER: new Set<Permission>([
    'Read',
    'Read',
    'Read',
    'Read',
    'Create',
    'Read',
    'Export',
  ]),
}

export const hasPermission = (role: UserRole | undefined, permission: Permission) =>
  role ? rolePermissions[role].has(permission) : false
