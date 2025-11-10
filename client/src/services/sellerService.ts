import api from './api'

export interface Seller {
  id: number
  user_id: number
  business_name: string
  business_type: string
  registration_date: string
  status: 'active' | 'inactive' | 'suspended'
  address: string
  phone_number: string
  email: string
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
  username: string
  email: string
  password: string
  business_name: string
  business_type: string
  address: string
  phone_number: string
}

export const sellerService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: Seller[] }>('/api/v1/sellers')
    return response.data.data
  },

  getOne: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Seller }>(`/api/v1/sellers/${id}`)
    return response.data.data
  },

  create: async (data: CreateSellerData) => {
    const response = await api.post<{ success: boolean; data: Seller }>('/api/v1/sellers', data)
    return response.data
  },

  updateStatus: async (id: number, status: Seller['status']) => {
    const response = await api.patch<{ success: boolean; data: Seller }>(
      `/api/v1/sellers/${id}/status`,
      { status }
    )
    return response.data
  },

  updateProfile: async (id: number, data: Partial<Omit<Seller, 'id' | 'user_id' | 'user' | 'allocations'>>) => {
    const response = await api.put<{ success: boolean; data: Seller }>(
      `/api/v1/sellers/${id}/profile`,
      data
    )
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete<{ success: boolean }>(`/api/v1/sellers/${id}`)
    return response.data
  },

  // Get seller's allocations history
  getAllocations: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Seller['allocations'] }>(
      `/api/v1/sellers/${id}/allocations`
    )
    return response.data.data
  },

  // Get seller's payment history
  getPayments: async (id: number, params?: { start_date?: string; end_date?: string }) => {
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
    }>(`/api/v1/sellers/${id}/payments`, { params })
    return response.data.data
  }
}