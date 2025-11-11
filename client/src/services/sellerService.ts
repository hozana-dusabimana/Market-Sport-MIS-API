import api from './api'

export interface Seller {
  seller_id?: number
  user_id: number
  full_name?: string
  id_number?: string
  business_name: string
  business_type: string
  tin_number?: string
  emergency_contact?: string
  address?: string
  registration_date?: string
  verification_status?: 'pending' | 'verified' | 'rejected'
  email?: string
  phone_number?: string
  username?: string
  status?: 'active' | 'inactive' | 'suspended'
  user?: {
    username: string
    email: string
    status: 'active' | 'inactive' | 'suspended'
  }
  allocations?: {
    id: number
    space_code: string
    zone_name: string
    monthly_rate: number
    start_date: string
    end_date: string | null
    status: 'active' | 'expired' | 'terminated'
  }[]
}

export interface CreateSellerData {
  user_id: number
  full_name: string
  id_number: string
  business_name: string
  business_type: string
  tin_number?: string
  emergency_contact?: string
  address?: string
  registration_date?: string
  verification_status?: 'pending' | 'verified' | 'rejected'
}

export const sellerService = {
<<<<<<< HEAD
  getAll: async (params?: Record<string, unknown>) => {
    const response = await api.get<{ success: boolean; data: Seller[] }>('/sellers', { params })
    return response.data.data
  },

  getOne: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Seller }>(`/sellers/${id}`)
    return response.data.data
  },

  create: async (data: CreateSellerData) => {
    const response = await api.post<{ success: boolean; data: Seller }>('/sellers', data)
    return response.data
  },

  updateStatus: async (id: number, status: Seller['status']) => {
    const response = await api.patch<{ success: boolean; data: Seller }>(
      `/sellers/${id}/status`,
      { status }
    )
    return response.data
  },

  updateProfile: async (id: number, data: Partial<Omit<Seller, 'id' | 'user_id' | 'user' | 'allocations'>>) => {
    const response = await api.put<{ success: boolean; data: Seller }>(
      `/sellers/${id}/profile`,
      data
    )
=======
  getAll: async (params?: {
    verification_status?: string
    business_type?: string
    search?: string
    page?: number
    limit?: number
    id?: number
  }) => {
    const response = await api.get('/sellers', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/sellers/${id}`)
    return response.data
  },

  getByUserId: async (userId: number) => {
    // First get all sellers and find by user_id, or use search
    const response = await api.get('/sellers', { params: { id: userId } })
    return response.data
  },

  create: async (data: CreateSellerData) => {
    const response = await api.post('/sellers', data)
    return response.data
  },

  update: async (id: number, data: Partial<Seller>) => {
    const response = await api.put(`/sellers/${id}`, data)
    return response.data
  },

  updateVerificationStatus: async (id: number, status: 'pending' | 'verified' | 'rejected') => {
    const response = await api.patch(`/sellers/verification/${id}`, { status })
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
    return response.data
  },

  delete: async (id: number) => {
<<<<<<< HEAD
    const response = await api.delete<{ success: boolean }>(`/sellers/${id}`)
=======
    const response = await api.delete(`/sellers/${id}`)
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
    return response.data
  },

  getAllocations: async (id: number) => {
<<<<<<< HEAD
    const response = await api.get<{ success: boolean; data: Seller['allocations'] }>(
      `/sellers/${id}/allocations`
    )
    return response.data.data
=======
    const response = await api.get(`/sellers/${id}/allocations`)
    return response.data
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
  },

  getPayments: async (id: number, params?: { start_date?: string; end_date?: string }) => {
<<<<<<< HEAD
    const response = await api.get<{
      success: boolean
      data: {
        id: number
        amount: number
        payment_date: string
        payment_method: string
        status: 'pending' | 'completed' | 'failed'
        description: string
      }[]
    }>(`/sellers/${id}/payments`, { params })
    return response.data.data
  },

  // Count sellers grouped by verification_status
  countByStatus: async () => {
    const response = await api.get<{ success: boolean; data: { verification_status: string; count: number }[] }>(
      '/sellers/status-count'
    )
    return response.data
  },

  // Get aggregated statistics for a seller
  getStatistics: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Record<string, unknown> }>(`/sellers/${id}/statistics`)
    return response.data.data
  }
=======
    const response = await api.get(`/sellers/${id}/payments`, { params })
    return response.data
  },

  getStatistics: async (id: number) => {
    const response = await api.get(`/sellers/${id}/stats`)
    return response.data
  },

  getCountByStatus: async () => {
    const response = await api.get('/sellers/counts')
    return response.data
  },

  // Legacy methods for compatibility
  getOne: async (id: number) => {
    return await sellerService.getById(id)
  },

  updateStatus: async (id: number, status: Seller['status']) => {
    return await sellerService.update(id, { status })
  },

  updateProfile: async (id: number, data: Partial<Seller>) => {
    return await sellerService.update(id, data)
  },
>>>>>>> ca4e2593ea3a314494d2db83a1ffa16386389184
}