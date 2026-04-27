import { http } from '@/services/http'
import type { InventoryFilters, InventoryItem, PaginatedResponse } from '@/types'
import type { ItemInput } from '@/lib/validators'

interface ApiInventoryItem {
  id: string
  name: string
  sku: string
  quantity: number
  price: number | string
  supplier: string
  location: string
  description?: string | null
  qrValue: string
  createdAt: string
  category?: { id: string; name: string }
}

const mapItem = (item: ApiInventoryItem): InventoryItem => ({
  id: item.id,
  name: item.name,
  sku: item.sku,
  category: item.category?.name ?? 'Unknown',
  quantity: item.quantity,
  price: Number(item.price),
  supplier: item.supplier,
  location: item.location,
  description: item.description ?? undefined,
  qrValue: item.qrValue,
  createdAt: item.createdAt,
})

export const inventoryService = {
  summary: async () => {
    const [itemsRes, categoriesRes, lowStockRes, recentRes] = await Promise.all([
      http.get<{ total: number }>('/items', { params: { page: 1, limit: 1 } }),
      http.get<Array<unknown>>('/categories'),
      http.get<Array<unknown>>('/reports/low-stock'),
      http.get<Array<unknown>>('/reports/recent'),
    ])
    return {
      totalItems: itemsRes.data.total ?? 0,
      categories: categoriesRes.data.length,
      lowStockItems: lowStockRes.data.length,
      recentItems: recentRes.data.length,
    }
  },
  list: async (filters: InventoryFilters) => {
    const { data } = await http.get<{ data: ApiInventoryItem[]; total: number; page: number; limit: number }>('/items', {
      params: filters,
    })
    return {
      data: data.data.map(mapItem),
      total: data.total,
      page: data.page,
      pageSize: data.limit,
    } as PaginatedResponse<InventoryItem>
  },
  create: async (payload: ItemInput) => {
    const { data } = await http.post<ApiInventoryItem>('/items', payload)
    return mapItem(data)
  },
  detailsFromQr: async (qrValue: string) => {
    const { data } = await http.get<ApiInventoryItem>(`/qr/${encodeURIComponent(qrValue)}`)
    return mapItem(data)
  },
  delete: async (id: string) => {
    await http.delete(`/items/${id}`)
  },
  update: async (
    id: string,
    payload: Partial<{
      name: string
      quantity: number
      location: string
      supplier: string
      description: string
    }>,
  ) => {
    const { data } = await http.put<ApiInventoryItem>(`/items/${id}`, payload)
    return mapItem(data)
  },
}
