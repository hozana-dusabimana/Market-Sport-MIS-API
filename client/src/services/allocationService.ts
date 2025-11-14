import api from './api'

export interface Allocation {
  allocation_id?: number
  seller_id: number
  space_id: number
  allocation_date?: string
  start_date: string
  end_date?: string
  allocation_type?: string
  status: 'active' | 'expired' | 'terminated' | 'cancelled'
  approved_by?: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export const allocationService = {
  getAll: async (params?: { 
    seller_id?: number
    space_id?: number
    zone_id?: number
    status?: string
    allocation_type?: string
    limit?: number
    offset?: number
  }) => {
    try {
      const response = await api.get('/allocations', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch allocations:', error)
      throw error
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/allocations/${id}`)
      return response.data
    } catch (error) {
      console.error(`Allocation ${id} not found:`, error)
      throw error
    }
  },

  create: async (allocation: Allocation) => {
    const response = await api.post('/allocations', allocation)
    return response.data
  },

  update: async (id: number, allocation: Partial<Allocation>) => {
    const response = await api.put(`/allocations/${id}`, allocation)
    return response.data
  },

  updateStatus: async (id: number, status: Allocation['status']) => {
    const response = await api.patch(`/allocations/${id}/status`, { status })
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/allocations/${id}`)
    return response.data
  },

  getPayments: async (allocationId: number) => {
    const response = await api.get(`/allocations/${allocationId}/payments`)
    return response.data
  },

  checkExpired: async () => {
    const response = await api.post('/allocations/check-expired')
    return response.data
  },

  terminate: async (id: number, reason?: string) => {
    // Optional: send reason if backend supports it
    if (reason) {
      const response = await api.patch(`/allocations/${id}/status`, { status: 'terminated', reason })
      return response.data
    }
    return allocationService.updateStatus(id, 'terminated')
  },
}
