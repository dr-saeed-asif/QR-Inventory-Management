import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const itemSchema = z.object({
  name: z.string().min(2, 'Item name is required'),
  sku: z.string().min(2, 'SKU is required'),
  categoryId: z.string().min(1, 'Category is required'),
  categoryIds: z.array(z.string()).optional(),
  tags: z.array(z.string().min(1)).optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  reservedQty: z.number().min(0, 'Reserved qty cannot be negative').optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  supplier: z.string().min(2, 'Supplier is required'),
  location: z.string().min(2, 'Location is required'),
  description: z.string().optional(),
  variants: z
    .array(
      z.object({
        name: z.string().optional(),
        sku: z.string().min(2),
        size: z.string().optional(),
        color: z.string().optional(),
        model: z.string().optional(),
        quantity: z.number().min(0),
        reservedQty: z.number().min(0).optional(),
        price: z.number().min(0).optional(),
      }),
    )
    .optional(),
})

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ItemInput = z.infer<typeof itemSchema>
export type CategoryInput = z.infer<typeof categorySchema>
