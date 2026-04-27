import type { NextFunction, Request, Response } from 'express'
import { itemService } from '../services/item.service'

export const itemController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await itemService.create(req.body, req.user?.userId)
      res.status(201).json(item)
    } catch (error) {
      next(error)
    }
  },
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await itemService.list(req.query as Record<string, string | undefined>)
      res.json(data)
    } catch (error) {
      next(error)
    }
  },
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await itemService.getById(String(req.params.id)))
    } catch (error) {
      next(error)
    }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await itemService.update(String(req.params.id), req.body, req.user?.userId))
    } catch (error) {
      next(error)
    }
  },
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await itemService.delete(String(req.params.id), req.user?.userId)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  },
}
