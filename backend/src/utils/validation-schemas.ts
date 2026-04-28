import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'USER']).optional(),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

export const categorySchema = z.object({
  name: z.string().min(2),
})

export const itemSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  categoryId: z.uuid(),
  categoryIds: z.array(z.uuid()).optional(),
  tags: z.array(z.string().min(1)).optional(),
  quantity: z.number().int().min(0),
  reservedQty: z.number().int().min(0).optional(),
  price: z.number().min(0),
  supplier: z.string().min(2),
  location: z.string().min(2),
  description: z.string().optional(),
  lowStockAt: z.number().int().min(0).optional(),
  variants: z
    .array(
      z.object({
        name: z.string().optional(),
        sku: z.string().min(2),
        size: z.string().optional(),
        color: z.string().optional(),
        model: z.string().optional(),
        quantity: z.number().int().min(0).default(0),
        reservedQty: z.number().int().min(0).optional(),
        price: z.number().min(0).optional(),
      }),
    )
    .optional(),
})

export const itemUpdateSchema = itemSchema.partial()

export const scanSchema = z.object({
  qrCode: z.string().min(8),
  note: z.string().optional(),
})

export const stockInSchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  reference: z.string().optional(),
  destinationWarehouse: z.string().min(1).optional(),
})

export const stockOutSchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  reference: z.string().optional(),
  sourceWarehouse: z.string().min(1).optional(),
})

export const stockTransferSchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().positive(),
  sourceWarehouse: z.string().min(1),
  destinationWarehouse: z.string().min(1),
  note: z.string().optional(),
  reference: z.string().optional(),
})

export const stockAdjustmentSchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().nonnegative(),
  reason: z.enum(['DAMAGE', 'LOSS', 'RECOUNT', 'MANUAL']),
  note: z.string().optional(),
  reference: z.string().optional(),
})
