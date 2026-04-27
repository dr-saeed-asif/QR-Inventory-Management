import { http } from '@/services/http'
import type { LoginInput } from '@/lib/validators'
import type { User } from '@/types'

interface LoginResponse {
  token: string
  user: User
}

export const authService = {
  login: async (payload: LoginInput) => {
    const { data } = await http.post<LoginResponse>('/auth/login', payload)
    return data
  },
}
