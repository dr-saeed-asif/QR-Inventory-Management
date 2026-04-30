import { http } from '@/services/http'
import type {
  Category,
  InventoryFilters,
  InventoryItem,
  ItemBatch,
  ItemTimelineEvent,
  ItemVariant,
  PaginatedResponse,
} from '@/types'
import type { ItemInput } from '@/lib/validators'

interface ApiInventoryItem {
  id: string
  name: string
  sku: string
  quantity: number
  reservedQty?: number
  availableQty?: number
  price: number | string
  supplier: string
  location: string
  description?: string | null
  qrValue: string
  barcodeValue: string
  createdAt: string
  category?: { id: string; name: string }
  categories?: Category[]
  tags?: Array<{ id: string; name: string } | string>
  variants?: Array<ItemVariant & { price?: number | string }>
  expiryDate?: string
  batches?: ItemBatch[]
}

export interface MovementTrendPoint {
  date: string
  in: number
  out: number
  transfer: number
  adjustment: number
  total: number
}

export interface MovementTrendReport {
  days: number
  from: string
  to: string
  series: MovementTrendPoint[]
  totals: {
    in: number
    out: number
    transfer: number
    adjustment: number
  }
}

export interface MoversReportEntry {
  itemId: string
  name: string
  sku: string
  soldQty: number
  onHandQty: number
  turnoverRatio: number
  estimatedRevenue: number
}

export interface MoversReport {
  days: number
  from: string
  to: string
  fastMoving: MoversReportEntry[]
  slowMoving: MoversReportEntry[]
}

export interface ProfitLossReport {
  days: number
  from: string
  to: string
  revenue: number
  expense: number
  grossProfit: number
  marginPct: number
  note: string
}

export interface ScannedLocationItem {
  id: string
  name: string
  sku: string
  quantity: number
  location: string
  category: { id: string; name: string }
}

export interface ScannedLocation {
  id: string
  name: string
  shelf: string
  rack: string
  bin: string
  qrValue: string
  barcodeValue: string
  warehouse: { id: string; name: string; code: string }
  items: ScannedLocationItem[]
}

const mapItem = (item: ApiInventoryItem): InventoryItem => ({
  id: item.id,
  name: item.name,
  sku: item.sku,
  category: item.category?.name ?? 'Unknown',
  categories: item.categories,
  tags: item.tags?.map((tag) => (typeof tag === 'string' ? tag : tag.name)),
  quantity: item.quantity,
  reservedQty: item.reservedQty ?? 0,
  availableQty: item.availableQty ?? Math.max(0, item.quantity - (item.reservedQty ?? 0)),
  expiryDate: item.expiryDate ?? undefined,
  price: Number(item.price),
  supplier: item.supplier,
  location: item.location,
  description: item.description ?? undefined,
  qrValue: item.qrValue,
  barcodeValue: item.barcodeValue,
  variants: item.variants?.map((variant) => ({
    ...variant,
    price: typeof variant.price === 'number' || typeof variant.price === 'undefined' ? variant.price : Number(variant.price),
    reservedQty: variant.reservedQty ?? 0,
  })),
  batches: item.batches,
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
  detailsFromCode: async (value: string) => {
    const { data } = await http.get<ApiInventoryItem>(`/qr/${encodeURIComponent(value)}`)
    return mapItem(data)
  },
  locationFromCode: async (value: string) => {
    const { data } = await http.get<ScannedLocation>(`/locations/scan/${encodeURIComponent(value)}`)
    return data
  },
  logScan: async (value: string, note?: string) => {
    const { data } = await http.post('/scan', { qrCode: value, note })
    return data
  },
  timeline: async (id: string) => {
    const { data } = await http.get<{ timeline: ItemTimelineEvent[] }>(`/items/${id}/timeline`)
    return data.timeline
  },
  delete: async (id: string) => {
    await http.delete(`/items/${id}`)
  },
  update: async (
    id: string,
    payload: Partial<ItemInput>,
  ) => {
    const { data } = await http.put<ApiInventoryItem>(`/items/${id}`, payload)
    return mapItem(data)
  },
  importFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await http.post('/items/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data as { created: number; updated: number; total: number }
  },
  exportCsvFromApi: async () => {
    const response = await http.get('/reports/export-csv', {
      responseType: 'blob',
    })
    return response.data as Blob
  },
  exportExcelFromApi: async () => {
    const response = await http.get('/reports/export-excel', {
      responseType: 'blob',
    })
    return response.data as Blob
  },
  movementTrendReport: async (days: number) => {
    const { data } = await http.get<MovementTrendReport>('/reports/movement-trend', {
      params: { days },
    })
    return data
  },
  moversReport: async (days: number) => {
    const { data } = await http.get<MoversReport>('/reports/movers', {
      params: { days },
    })
    return data
  },
  profitLossReport: async (days: number) => {
    const { data } = await http.get<ProfitLossReport>('/reports/profit-loss', {
      params: { days },
    })
    return data
  },
}
