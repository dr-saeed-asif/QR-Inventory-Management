import type { NextFunction, Request, Response } from 'express'
import { reportService } from '../services/report.service'

export const reportController = {
  exportCsv: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const csv = await reportService.exportCsv()
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"')
      res.send(csv)
    } catch (error) {
      next(error)
    }
  },
  lowStock: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await reportService.lowStock())
    } catch (error) {
      next(error)
    }
  },
  recent: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await reportService.recent())
    } catch (error) {
      next(error)
    }
  },
}
