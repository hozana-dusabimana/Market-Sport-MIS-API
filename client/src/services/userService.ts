import api from './api'

export interface User {
  user_id?: number
  id?: number
  username: string
  email: string
  phone_number?: string
  user_type: 'admin' | 'manager' | 'seller'
  status: 'active' | 'inactive' | 'suspended'
  profile_photo?: string
  created_at?: string
  last_login?: string
  profile?: {
    full_name?: string
    id_number?: string
    department?: string
    permissions?: any
    assigned_zones?: number[]
    employment_date?: string
    business_name?: string
    business_type?: string
    tin_number?: string
    emergency_contact?: string
    address?: string
    registration_date?: string
    verification_status?: string
  }
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  phone_number: string
  user_type: 'admin' | 'manager' | 'seller'
  full_name?: string
  id_number?: string
  department?: string
  permissions?: any
  assigned_zones?: number[]
  employment_date?: string
  business_name?: string
  business_type?: string
  tin_number?: string
  emergency_contact?: string
  address?: string
  registration_date?: string
  status?: 'active' | 'inactive' | 'suspended'
}

export const userService = {
  getAll: async (params?: {
    user_type?: string
    status?: string
    search?: string
    page?: number
    limit?: number
    id?: number
  }) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  create: async (data: CreateUserData) => {
    const response = await api.post('/users', data)
    return response.data
  },

  update: async (id: number, data: Partial<User>) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  updateStatus: async (id: number, status: 'active' | 'suspended' | 'inactive') => {
    const response = await api.patch(`/users/status/${id}`, { status })
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  getStatistics: async () => {
    const response = await api.get('/users/stats')
    return response.data
  },

  getCountByType: async (userType: 'admin' | 'manager' | 'seller') => {
    const response = await api.get(`/users/count/${userType}`)
    return response.data
  },

  // Legacy methods for compatibility
  getOne: async (id: number) => {
    return await userService.getById(id)
  },

  updateProfile: async (id: number, profile: Partial<User>) => {
    return await userService.update(id, profile)
  },
}