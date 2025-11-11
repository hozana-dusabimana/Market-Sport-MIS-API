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
    const response = await api.get('/allocations', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/allocations/${id}`)
    return response.data
  },

  create: async (allocation: Allocation) => {
    const response = await api.post('/allocations', allocation)
    return response.data
  },

  update: async (id: number, allocation: Partial<Allocation>) => {
    const response = await api.put(`/allocations/${id}`, allocation)
    return response.data
  },

  updateStatus: async (id: number, status: string) => {
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
    // Use updateStatus instead of a separate terminate endpoint
    return await allocationService.updateStatus(id, 'terminated')
  },
}


