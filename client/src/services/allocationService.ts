import api from './api'

export interface Allocation {
  allocation_id?: number
  seller_id: number
  space_id: number
  start_date: string
  end_date?: string
  monthly_rate: number
  status: 'active' | 'expired' | 'terminated'
  notes?: string
  created_at?: string
  updated_at?: string
}

export const allocationService = {
  getAll: async (params?: { seller_id?: number; space_id?: number; status?: string }) => {
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

  terminate: async (id: number, reason?: string) => {
    const response = await api.post(`/allocations/${id}/terminate`, { reason })
    return response.data
  },
}


