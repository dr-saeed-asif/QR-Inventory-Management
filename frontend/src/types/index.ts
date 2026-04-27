export interface User {
  id: string
  name: string
  email: string
}

export interface Category {
  id: string
  name: string
  itemsCount: number
}

export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  price: number
  supplier: string
  location: string
  description?: string
  qrValue: string
  createdAt: string
}

export interface InventoryFilters {
  search?: string
  category?: string
  location?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
