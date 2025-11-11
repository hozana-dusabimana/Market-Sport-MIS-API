import api from './api'

export interface User {
  user_id: number
  username: string
  email: string
  user_type: 'admin' | 'manager' | 'seller'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  last_login?: string
  phone_number?: string
  profile?: {
    full_name?: string
    phone_number?: string
    address?: string
    id_number?: string
    department?: string
    permissions?: any
    assigned_zones?: any
    employment_date?: string
    business_name?: string
    business_type?: string
    tin_number?: string
    emergency_contact?: string
    registration_date?: string
    verification_status?: string
  }
}

export const userService = {
  getAll: async (params?: any) => {
    const response = await api.get('/users', { params })
    if (response.data?.data?.users) return response.data.data.users
    if (Array.isArray(response.data?.data)) return response.data.data
    return response.data.data || []
  },

  getOne: async (id: number) => {
    const response = await api.get(`/users/${id}`)
    return response.data.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  createUser: async (data: any) => {
    const response = await api.post('/users', data)
    return response.data
  },

  updateStatus: async (id: number, status: User['status']) => {
    const response = await api.patch(`/users/${id}/status`, { status })
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  updateProfile: async (id: number, profile: Partial<User['profile']>) => {
    const response = await api.put(`/users/${id}/profile`, profile)
    return response.data
  },

  getStatistics: async () => {
    // server exposes /users/stats
    const response = await api.get('/users/stats')
    return response.data
  },

  getCountByType: async (user_type: string) => {
    const response = await api.get(`/users/count/${user_type}`)
    return response.data
  }
,

  updateUser: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  }
}