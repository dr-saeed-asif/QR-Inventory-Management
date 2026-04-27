import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '@prisma/client'
import { ApiError } from '../utils/api-error'
import { verifyToken } from '../utils/jwt'

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authorization token is required'))
  }
  const token = authorization.replace('Bearer ', '')
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    next(new ApiError(401, 'Invalid or expired token'))
  }
}

export const authorize =
  (roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'))
    }
    next()
  }
