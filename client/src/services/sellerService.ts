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
  // Get all sellers with optional filters
  getAll: async (params?: {
    id?: number
    verification_status?: string
    business_type?: string
    search?: string
    page?: number
    limit?: number
    manager_id?: number
  }) => {
    try {
      const response = await api.get('/sellers', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching sellers:', error)
      throw error
    }
  },

  // Get seller by ID
  getById: async (id: number) => {
    try {
      const response = await api.get(`/sellers/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching seller with ID ${id}:`, error)
      throw error
    }
  },

  // Get seller by user_id (corrected to filter locally if backend doesn't support query)
  getByUserId: async (userId: number) => {
    try {
      const response = await api.get('/sellers')
      const seller = response.data?.sellers?.find((s: Seller) => s.user_id === userId)
      if (!seller) throw new Error('Seller not found')
      return { data: seller }
    } catch (error) {
      console.error(`Error fetching seller for user ID ${userId}:`, error)
      throw error
    }
  },

  // Create new seller
  create: async (data: CreateSellerData) => {
    try {
      const response = await api.post('/sellers', data)
      return response.data
    } catch (error) {
      console.error('Error creating seller:', error)
      throw error
    }
  },

  // Update seller details
  update: async (id: number, data: Partial<Seller>) => {
    try {
      const response = await api.put(`/sellers/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`Error updating seller with ID ${id}:`, error)
      throw error
    }
  },

  // Update verification status
  updateVerificationStatus: async (id: number, status: 'pending' | 'verified' | 'rejected') => {
    try {
      const response = await api.patch(`/sellers/verification/${id}`, { status })
      return response.data
    } catch (error) {
      console.error(`Error updating verification for seller ID ${id}:`, error)
      throw error
    }
  },

  // Delete seller
  delete: async (id: number) => {
    try {
      const response = await api.delete(`/sellers/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error deleting seller with ID ${id}:`, error)
      throw error
    }
  },

  // Get seller allocations
  getAllocations: async (id: number) => {
    try {
      const response = await api.get(`/sellers/${id}/allocations`)
      return response.data
    } catch (error) {
      console.error(`Error fetching allocations for seller ID ${id}:`, error)
      throw error
    }
  },

  // Get seller payments
  getPayments: async (id: number, params?: { start_date?: string; end_date?: string }) => {
    try {
      const response = await api.get(`/sellers/${id}/payments`, { params })
      return response.data
    } catch (error) {
      console.error(`Error fetching payments for seller ID ${id}:`, error)
      throw error
    }
  },

  // Get seller statistics
  getStatistics: async (id: number) => {
    try {
      const response = await api.get(`/sellers/${id}/stats`)
      return response.data
    } catch (error) {
      console.error(`Error fetching statistics for seller ID ${id}:`, error)
      throw error
    }
  },

  // Get count by status
  getCountByStatus: async () => {
    try {
      const response = await api.get('/sellers/counts')
      return response.data
    } catch (error) {
      console.error('Error fetching seller counts:', error)
      throw error
    }
  },
}
