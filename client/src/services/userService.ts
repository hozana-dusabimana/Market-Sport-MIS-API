import api from './api'

export interface User {
<<<<<<< HEAD
  user_id: number
=======
  user_id?: number
  id?: number
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
  username: string
  email: string
  phone_number?: string
  user_type: 'admin' | 'manager' | 'seller'
  status: 'active' | 'inactive' | 'suspended'
<<<<<<< HEAD
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
=======
  profile_photo?: string
  created_at?: string
  last_login?: string
  profile?: {
    full_name?: string
    id_number?: string
    department?: string
    permissions?: any
    assigned_zones?: number[]
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
    employment_date?: string
    business_name?: string
    business_type?: string
    tin_number?: string
    emergency_contact?: string
<<<<<<< HEAD
=======
    address?: string
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
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
<<<<<<< HEAD
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
=======
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
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
    const response = await api.post('/users', data)
    return response.data
  },

<<<<<<< HEAD
  updateStatus: async (id: number, status: User['status']) => {
    const response = await api.patch(`/users/${id}/status`, { status })
=======
  update: async (id: number, data: Partial<User>) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  updateStatus: async (id: number, status: 'active' | 'suspended' | 'inactive') => {
    const response = await api.patch(`/users/status/${id}`, { status })
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

<<<<<<< HEAD
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
=======
  getStatistics: async () => {
    const response = await api.get('/users/stats')
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
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