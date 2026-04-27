import type { NextFunction, Request, Response } from 'express'
import { categoryService } from '../services/category.service'

export const categoryController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await categoryService.create(req.body.name, req.user?.userId)
      res.status(201).json(category)
    } catch (error) {
      next(error)
    }
  },
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await categoryService.list())
    } catch (error) {
      next(error)
    }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await categoryService.update(String(req.params.id), req.body.name, req.user?.userId))
    } catch (error) {
      next(error)
    }
  },
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await categoryService.delete(String(req.params.id), req.user?.userId)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  },
}
