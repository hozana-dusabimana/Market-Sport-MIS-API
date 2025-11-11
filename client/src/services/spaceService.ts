import api from './api'

export interface Space {
  space_id?: number
  zone_id: number
  space_number?: string
  space_code?: string
  space_type: 'stall' | 'kiosk' | 'stand'
  size_sqm?: number
  size?: string
  daily_rate?: number
  weekly_rate?: number
  monthly_rate?: number
  features?: string
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  location_details?: string
  amenities?: string[]
  created_at?: string
  updated_at?: string
}

export const spaceService = {
  getAll: async (params?: { 
    zone_id?: number
    status?: string
    space_type?: string
    search?: string
  }) => {
    const response = await api.get('/spaces', { params })
    return response.data
  },

  getAvailable: async (params?: { zone_id?: number; space_type?: string }) => {
    const response = await api.get('/spaces/available', { params })
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

  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/spaces/${id}/status`, { status })
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/spaces/${id}`)
    return response.data
  },

  getCurrentAllocation: async (spaceId: number) => {
    // This is part of getById response, but we can make a separate call if needed
    const response = await api.get(`/spaces/${spaceId}`)
    return response.data?.data?.currentAllocation || null
  },

  getAllocationHistory: async (spaceId: number) => {
    const response = await api.get(`/spaces/${spaceId}/history`)
    return response.data
  },

  checkAvailability: async (spaceId: number) => {
    const response = await api.get(`/spaces/${spaceId}/availability`)
    return response.data
  },
}


