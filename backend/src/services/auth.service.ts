import bcrypt from 'bcrypt'
import type { UserRole } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from '../utils/api-error'
import { signToken } from '../utils/jwt'
import { rolePermissions } from '../config/permissions'
import { activityService } from './activity.service'

type DbAdminRoleRow = {
  permissions: unknown
}

type DbAdminUserRoleRow = {
  roleKey: string
}

const ensureRoleTables = async () => {
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
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_user_roles (
      userId VARCHAR(191) NOT NULL PRIMARY KEY,
      roleKey VARCHAR(191) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

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

const resolveUserPermissions = async (userId: string, role: UserRole) => {
  await ensureRoleTables()
  const defaultPermissions = Array.from(rolePermissions[role])
  const overrideRows = await prisma.$queryRaw<DbAdminUserRoleRow[]>`
    SELECT roleKey
    FROM admin_user_roles
    WHERE userId = ${userId}
    LIMIT 1
  `

  const overrideRoleKey = overrideRows[0]?.roleKey
  if (!overrideRoleKey) return defaultPermissions

  const roleRows = await prisma.$queryRaw<DbAdminRoleRow[]>`
    SELECT permissions
    FROM admin_roles
    WHERE roleKey = ${overrideRoleKey}
    LIMIT 1
  `

  const rolePermissionsFromDb = parsePermissions(roleRows[0]?.permissions)
  return rolePermissionsFromDb.length > 0 ? rolePermissionsFromDb : defaultPermissions
}

export const authService = {
  register: async (input: { name: string; email: string; password: string; role?: UserRole }) => {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } })
    if (existingUser) throw new ApiError(409, 'Email already in use')

    const passwordHash = await bcrypt.hash(input.password, 10)
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role ?? 'USER',
      },
    })

    await activityService.create({
      action: 'REGISTER',
      entityType: 'USER',
      entityId: user.id,
      description: 'User registered',
      userId: user.id,
    })

    const permissions = await resolveUserPermissions(user.id, user.role)
    const token = signToken({ userId: user.id, role: user.role, permissions })
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions,
      },
    }
  },

  login: async (input: { email: string; password: string }) => {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) throw new ApiError(401, 'Invalid email or password')

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) throw new ApiError(401, 'Invalid email or password')

    await activityService.create({
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      description: 'User logged in',
      userId: user.id,
    })

    const permissions = await resolveUserPermissions(user.id, user.role)
    const token = signToken({ userId: user.id, role: user.role, permissions })
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions,
      },
    }
  },
}
