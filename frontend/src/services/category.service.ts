import { http } from '@/services/http'
import type { Category } from '@/types'
import type { CategoryInput } from '@/lib/validators'

export const categoryService = {
  list: async () => {
    const { data } = await http.get<Category[]>('/categories')
    return data
  },
  create: async (payload: CategoryInput) => {
    const { data } = await http.post<Category>('/categories', payload)
    return data
  },
  update: async (id: string, payload: CategoryInput) => {
    const { data } = await http.put<Category>(`/categories/${id}`, payload)
    return data
  },
  delete: async (id: string) => {
    await http.delete(`/categories/${id}`)
  },
}
