import api from './api'

export interface Zone {
  zone_id?: number
  zone_name: string
  zone_code: string
  description?: string
  location?: string
  capacity?: number
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export const zoneService = {
  getAll: async () => {
    const response = await api.get('/zones')
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/zones/${id}`)
    return response.data
  },

  create: async (zone: Zone) => {
    const response = await api.post('/zones', zone)
    return response.data
  },

  update: async (id: number, zone: Partial<Zone>) => {
    const response = await api.put(`/zones/${id}`, zone)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/zones/${id}`)
    return response.data
  },
}


