import { http } from '@/services/http'
import type { Party, PartyType, PaginatedResponse } from '@/types'
import type { PartyInput } from '@/lib/validators'

interface PaginatedApi<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export const partyService = {
  list: async (params?: { type?: PartyType; page?: number; pageSize?: number }) => {
    const { data } = await http.get<PaginatedApi<Party>>('/parties', {
      params: {
        type: params?.type,
        page: params?.page ?? 1,
        limit: params?.pageSize ?? 10,
      },
    })
    return {
      data: data.data,
      total: data.total,
      page: data.page,
      pageSize: data.limit,
    } as PaginatedResponse<Party>
  },
  create: async (payload: PartyInput) => {
    const { data } = await http.post<Party>('/parties', payload)
    return data
  },
  update: async (id: string, payload: PartyInput) => {
    const { data } = await http.put<Party>(`/parties/${id}`, payload)
    return data
  },
  delete: async (id: string) => {
    await http.delete(`/parties/${id}`)
  },
}
