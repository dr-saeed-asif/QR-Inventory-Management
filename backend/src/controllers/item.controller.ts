import type { NextFunction, Request, Response } from 'express'
import { parse } from 'csv-parse/sync'
import XLSX from 'xlsx'
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
  timeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await itemService.timeline(String(req.params.id)))
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
  import: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'File is required' })
        return
      }

      let records: Array<Record<string, string>> = []
      const fileName = req.file.originalname.toLowerCase()
      if (fileName.endsWith('.csv')) {
        records = parse(req.file.buffer.toString('utf8'), {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }) as Array<Record<string, string>>
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
        const firstSheet = workbook.SheetNames[0]
        records = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]) as Array<Record<string, string>>
      } else {
        res.status(400).json({ message: 'Unsupported file format. Use CSV or Excel.' })
        return
      }

      const rows = records.map((record) => ({
        name: String(record.name ?? record.Name ?? ''),
        sku: String(record.sku ?? record.SKU ?? ''),
        category: String(record.category ?? record.Category ?? ''),
        quantity: Number(record.quantity ?? record.Quantity ?? 0),
        reservedQty: Number(record.reservedQty ?? record.ReservedQty ?? 0),
        price: Number(record.price ?? record.Price ?? 0),
        supplier: String(record.supplier ?? record.Supplier ?? ''),
        location: String(record.location ?? record.Location ?? ''),
        description: String(record.description ?? record.Description ?? ''),
        expiryDate: String(record.expiryDate ?? record.ExpiryDate ?? ''),
        batchNumber: String(record.batchNumber ?? record.BatchNumber ?? ''),
        lotNumber: String(record.lotNumber ?? record.LotNumber ?? ''),
      }))

      const result = await itemService.createManyFromImport(rows, req.user?.userId)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  },
}
