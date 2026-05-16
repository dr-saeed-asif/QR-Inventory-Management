import type { NextFunction, Request, Response } from 'express'
import { purchaseService } from '../services/purchase.service'

export const purchaseController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await purchaseService.list({
          page: req.query.page as string | undefined,
          limit: req.query.limit as string | undefined,
        }),
      )
    } catch (error) {
      next(error)
    }
  },
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await purchaseService.getById(String(req.params.id)))
    } catch (error) {
      next(error)
    }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await purchaseService.create(req.body, req.user?.userId))
    } catch (error) {
      next(error)
    }
  },
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await purchaseService.delete(String(req.params.id), req.user?.userId)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  },
}
