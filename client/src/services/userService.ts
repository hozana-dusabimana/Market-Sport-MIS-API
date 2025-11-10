import api from './api'

export interface User {
  id: number
  username: string
  email: string
  user_type: 'admin' | 'manager' | 'seller'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  profile?: {
    full_name: string
    phone_number: string
    address: string
  }
}

export const userService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: User[] }>('/api/v1/users')
    return response.data.data
  },

  getOne: async (id: number) => {
    const response = await api.get<{ success: boolean; data: User }>(`/api/v1/users/${id}`)
    return response.data.data
  },

  updateStatus: async (id: number, status: User['status']) => {
    const response = await api.patch<{ success: boolean; data: User }>(
      `/api/v1/users/${id}/status`,
      { status }
    )
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete<{ success: boolean }>(`/api/v1/users/${id}`)
    return response.data
  },

  updateProfile: async (id: number, profile: Partial<User['profile']>) => {
    const response = await api.put<{ success: boolean; data: User }>(
      `/api/v1/users/${id}/profile`,
      profile
    )
    return response.data
  }
}