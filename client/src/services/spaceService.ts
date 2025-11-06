import api from './api'

export interface Space {
  space_id?: number
  zone_id: number
  space_code: string
  space_type: 'stall' | 'kiosk' | 'stand'
  size?: string
  monthly_rate: number
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  location_details?: string
  amenities?: string[]
  created_at?: string
  updated_at?: string
}

export const spaceService = {
  getAll: async (params?: { zone_id?: number; status?: string }) => {
    const response = await api.get('/spaces', { params })
    return response.data
  },

  getAvailable: async (zoneId?: number) => {
    const response = await api.get('/spaces/available', { params: { zone_id: zoneId } })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/spaces/${id}`)
    return response.data
  },

  create: async (space: Space) => {
    const response = await api.post('/spaces', space)
    return response.data
  },

  update: async (id: number, space: Partial<Space>) => {
    const response = await api.put(`/spaces/${id}`, space)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/spaces/${id}`)
    return response.data
  },
}


