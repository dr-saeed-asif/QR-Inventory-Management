import bcrypt from 'bcrypt'
import type { UserRole } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from '../utils/api-error'
import { signToken } from '../utils/jwt'
import { activityService } from './activity.service'
import { resolveUserPermissions } from './role-permissions.service'

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

  refreshSession: async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new ApiError(404, 'User not found')

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
