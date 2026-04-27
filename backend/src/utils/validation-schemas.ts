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
  quantity: z.number().int().min(0),
  price: z.number().min(0),
  supplier: z.string().min(2),
  location: z.string().min(2),
  description: z.string().optional(),
  lowStockAt: z.number().int().min(0).optional(),
})

export const scanSchema = z.object({
  qrCode: z.string().min(8),
  note: z.string().optional(),
})
