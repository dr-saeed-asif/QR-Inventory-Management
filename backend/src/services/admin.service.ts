import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import type { UserRole } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from '../utils/api-error'
import { rolePermissions, type AppRole } from '../config/permissions'
import { activityService } from './activity.service'

const roleLabels: Record<AppRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Operations Manager',
  USER: 'Standard User',
}

type DbAdminRole = {
  id: string
  roleKey: string
  name: string
  permissions: unknown
  isSystem: number
  createdAt: Date
  updatedAt: Date
}

type DbAdminUserRole = {
  userId: string
  roleKey: string
}

const formatDate = (value?: Date | null) => value?.toISOString() ?? new Date().toISOString()
const coreRoles: UserRole[] = ['ADMIN', 'MANAGER', 'USER']

const parsePermissions = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item))
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item))
    } catch {
      return []
    }
  }
  return []
}

const moduleLabelMap: Record<string, string> = {
  items: 'Inventory',
  categories: 'Category',
  qr: 'QR Code',
  reports: 'Report',
  scan: 'Scan',
  stock: 'Stock',
}

const toPermissionAction = (permission: string) => {
  const action = permission.split('.')[1] ?? permission
  const normalized = action.toLowerCase()
  if (normalized === 'read') return 'View'
  if (normalized === 'create') return 'Create'
  if (normalized === 'update' || normalized === 'write') return 'Edit'
  if (normalized === 'delete') return 'Delete'
  if (normalized === 'manage') return 'Manage'
  if (normalized === 'import') return 'Import'
  if (normalized === 'export') return 'Export'
  return null
}

const toPermissionModule = (permission: string) => {
  const moduleKey = permission.split('.')[0] ?? permission
  return (
    moduleLabelMap[moduleKey] ??
    moduleKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  )
}

const summarizePermissionDisplay = (permissions: string[]) => ({
  actions: Array.from(
    new Set(
      permissions
        .map((permission) => toPermissionAction(permission))
        .filter(Boolean),
    ),
  ) as string[],
  modules: Array.from(new Set(permissions.map((permission) => toPermissionModule(permission)))),
})

const toRoleKey = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const ensureRoleTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_roles (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      roleKey VARCHAR(191) NOT NULL UNIQUE,
      name VARCHAR(191) NOT NULL,
      permissions JSON NOT NULL,
      isSystem TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

const ensureUserRoleTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_user_roles (
      userId VARCHAR(191) NOT NULL PRIMARY KEY,
      roleKey VARCHAR(191) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

const ensureSystemRoles = async () => {
  await ensureRoleTable()
  await ensureUserRoleTable()

  const existing = await prisma.$queryRaw<Pick<DbAdminRole, 'roleKey'>[]>`
    SELECT roleKey FROM admin_roles WHERE roleKey IN ('ADMIN', 'MANAGER', 'USER')
  `

  const existingKeys = new Set(existing.map((row) => row.roleKey))
  const defaults: AppRole[] = ['ADMIN', 'MANAGER', 'USER']

  for (const role of defaults) {
    if (existingKeys.has(role)) continue

    await prisma.$executeRaw`
      INSERT INTO admin_roles (id, roleKey, name, permissions, isSystem)
      VALUES (${randomUUID()}, ${role}, ${roleLabels[role]}, ${JSON.stringify(Array.from(rolePermissions[role]))}, 1)
    `
  }
}

export const adminService = {
  listUsers: async () => {
    await ensureSystemRoles()

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    const overrides = await prisma.$queryRaw<DbAdminUserRole[]>`
      SELECT userId, roleKey FROM admin_user_roles
    `
    const overrideMap = new Map(overrides.map((row) => [row.userId, row.roleKey]))
    return users.map((user) => ({
      ...user,
      role: overrideMap.get(user.id) ?? user.role,
    }))
  },

  createUser: async (
    input: { name: string; email: string; password: string; role: string },
    actorId?: string,
  ) => {
    await ensureSystemRoles()

    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw new ApiError(409, 'Email already in use')

    const passwordHash = await bcrypt.hash(input.password, 10)
    const selectedRole = input.role.trim().toUpperCase()
    const isCoreRole = coreRoles.includes(selectedRole as UserRole)
    const savedRole: UserRole = isCoreRole ? (selectedRole as UserRole) : 'USER'

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: savedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!isCoreRole) {
      await prisma.$executeRaw`
        INSERT INTO admin_user_roles (userId, roleKey)
        VALUES (${user.id}, ${selectedRole})
        ON DUPLICATE KEY UPDATE roleKey = VALUES(roleKey)
      `
    }

    await activityService.create({
      action: 'CREATE',
      entityType: 'ADMIN_USER',
      entityId: user.id,
      description: `Admin created user ${user.email}`,
      userId: actorId,
    })

    return {
      ...user,
      role: selectedRole,
    }
  },

  updateUser: async (
    userId: string,
    input: { name?: string; email?: string; password?: string; role?: string },
    actorId?: string,
  ) => {
    await ensureSystemRoles()

    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (!existing) throw new ApiError(404, 'User not found')

    if (input.email && input.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: input.email } })
      if (emailTaken) throw new ApiError(409, 'Email already in use')
    }

    const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined
    const selectedRole = input.role?.trim().toUpperCase()
    const isCoreRole = selectedRole ? coreRoles.includes(selectedRole as UserRole) : undefined

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        email: input.email,
        role: selectedRole ? (isCoreRole ? (selectedRole as UserRole) : 'USER') : undefined,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (selectedRole) {
      if (isCoreRole) {
        await prisma.$executeRaw`DELETE FROM admin_user_roles WHERE userId = ${userId}`
      } else {
        await prisma.$executeRaw`
          INSERT INTO admin_user_roles (userId, roleKey)
          VALUES (${userId}, ${selectedRole})
          ON DUPLICATE KEY UPDATE roleKey = VALUES(roleKey)
        `
      }
    }

    await activityService.create({
      action: 'UPDATE',
      entityType: 'ADMIN_USER',
      entityId: user.id,
      description: `Admin updated user ${user.email}`,
      userId: actorId,
    })

    return {
      ...user,
      role: selectedRole ?? user.role,
    }
  },

  deleteUser: async (userId: string, actorId?: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new ApiError(404, 'User not found')

    if (actorId && actorId === userId) throw new ApiError(400, 'You cannot delete your own account')

    await ensureSystemRoles()
    await prisma.$executeRaw`DELETE FROM admin_user_roles WHERE userId = ${userId}`
    await prisma.user.delete({ where: { id: userId } })

    await activityService.create({
      action: 'DELETE',
      entityType: 'ADMIN_USER',
      entityId: userId,
      description: `Admin deleted user ${user.email}`,
      userId: actorId,
    })
  },

  listRoles: async () => {
    await ensureSystemRoles()

    const rows = await prisma.$queryRaw<DbAdminRole[]>`
      SELECT id, roleKey, name, permissions, isSystem, createdAt, updatedAt
      FROM admin_roles
      ORDER BY createdAt DESC
    `

    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    })

    const userCountByRole = new Map(roleStats.map((entry) => [entry.role, entry._count._all]))

    return rows.map((row) => ({
      ...summarizePermissionDisplay(parsePermissions(row.permissions)),
      id: row.id,
      roleKey: row.roleKey,
      name: row.name,
      role: row.roleKey,
      permissions: parsePermissions(row.permissions),
      userCount: userCountByRole.get(row.roleKey as UserRole) ?? 0,
      isSystem: Boolean(row.isSystem),
      createdAt: formatDate(row.createdAt),
      updatedAt: formatDate(row.updatedAt),
    }))
  },

  createRole: async (input: { name: string; permissions: string[] }, actorId?: string) => {
    await ensureSystemRoles()

    const roleKey = toRoleKey(input.name)
    if (!roleKey) throw new ApiError(400, 'Role name is invalid')

    const existing = await prisma.$queryRaw<DbAdminRole[]>`
      SELECT id, roleKey, name, permissions, isSystem, createdAt, updatedAt
      FROM admin_roles
      WHERE roleKey = ${roleKey}
      LIMIT 1
    `

    if (existing.length > 0) throw new ApiError(409, 'Role already exists')

    const id = randomUUID()

    await prisma.$executeRaw`
      INSERT INTO admin_roles (id, roleKey, name, permissions, isSystem)
      VALUES (${id}, ${roleKey}, ${input.name.trim()}, ${JSON.stringify(input.permissions)}, 0)
    `

    await activityService.create({
      action: 'CREATE',
      entityType: 'ADMIN_ROLE',
      entityId: id,
      description: `Admin created role ${input.name}`,
      userId: actorId,
    })

    const created = await prisma.$queryRaw<DbAdminRole[]>`
      SELECT id, roleKey, name, permissions, isSystem, createdAt, updatedAt
      FROM admin_roles
      WHERE id = ${id}
      LIMIT 1
    `

    const row = created[0]

    return {
      ...summarizePermissionDisplay(parsePermissions(row.permissions)),
      id: row.id,
      roleKey: row.roleKey,
      name: row.name,
      role: row.roleKey,
      permissions: parsePermissions(row.permissions),
      userCount: 0,
      isSystem: Boolean(row.isSystem),
      createdAt: formatDate(row.createdAt),
      updatedAt: formatDate(row.updatedAt),
    }
  },

  updateRole: async (
    id: string,
    input: { name?: string; permissions?: string[] },
    actorId?: string,
  ) => {
    await ensureSystemRoles()

    const existingRows = await prisma.$queryRaw<DbAdminRole[]>`
      SELECT id, roleKey, name, permissions, isSystem, createdAt, updatedAt
      FROM admin_roles
      WHERE id = ${id}
      LIMIT 1
    `

    const existing = existingRows[0]
    if (!existing) throw new ApiError(404, 'Role not found')

    const nextName = input.name?.trim() || existing.name
    const nextPermissions = input.permissions ?? parsePermissions(existing.permissions)

    await prisma.$executeRaw`
      UPDATE admin_roles
      SET name = ${nextName}, permissions = ${JSON.stringify(nextPermissions)}
      WHERE id = ${id}
    `

    await activityService.create({
      action: 'UPDATE',
      entityType: 'ADMIN_ROLE',
      entityId: id,
      description: `Admin updated role ${nextName}`,
      userId: actorId,
    })

    const updatedRows = await prisma.$queryRaw<DbAdminRole[]>`
      SELECT id, roleKey, name, permissions, isSystem, createdAt, updatedAt
      FROM admin_roles
      WHERE id = ${id}
      LIMIT 1
    `

    const updated = updatedRows[0]
    const assignedUsers = await prisma.user.count({ where: { role: updated.roleKey as UserRole } })

    return {
      ...summarizePermissionDisplay(parsePermissions(updated.permissions)),
      id: updated.id,
      roleKey: updated.roleKey,
      name: updated.name,
      role: updated.roleKey,
      permissions: parsePermissions(updated.permissions),
      userCount: assignedUsers,
      isSystem: Boolean(updated.isSystem),
      createdAt: formatDate(updated.createdAt),
      updatedAt: formatDate(updated.updatedAt),
    }
  },

  deleteRole: async (id: string, actorId?: string) => {
    await ensureSystemRoles()

    const rows = await prisma.$queryRaw<DbAdminRole[]>`
      SELECT id, roleKey, name, permissions, isSystem, createdAt, updatedAt
      FROM admin_roles
      WHERE id = ${id}
      LIMIT 1
    `

    const role = rows[0]
    if (!role) throw new ApiError(404, 'Role not found')
    if (role.isSystem) throw new ApiError(400, 'System roles cannot be deleted')

    const assignedUsers = await prisma.user.count({ where: { role: role.roleKey as UserRole } })
    if (assignedUsers > 0) {
      throw new ApiError(400, 'This role cannot be deleted because it is assigned to users')
    }

    await prisma.$executeRaw`DELETE FROM admin_roles WHERE id = ${id}`

    await activityService.create({
      action: 'DELETE',
      entityType: 'ADMIN_ROLE',
      entityId: id,
      description: `Admin deleted role ${role.name}`,
      userId: actorId,
    })
  },
}
