import api from './api'

export interface Zone {
  zone_id?: number
  zone_name: string
  zone_code: string
  description?: string
  location?: string
  manager_id?: number
  total_spaces?: number
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export const zoneService = {
  // Get all zones with optional filters
    getAll: async (params?: { status?: string; manager_id?: number; search?: string }) => {
      try {
        const response = await api.get('/zones', { params })
        return response.data
      } catch (error) {
        console.error('Error fetching zones:', error)
        throw error
      }
    },

  // Get zone by ID
  getById: async (id: number) => {
    try {
      const response = await api.get(`/zones/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching zone with ID ${id}:`, error)
      throw error
    }
  },

  // Create a new zone
  create: async (zone: Zone) => {
    try {
      const response = await api.post('/zones', zone)
      return response.data
    } catch (error) {
      console.error('Error creating zone:', error)
      throw error
    }
  },

  // Update zone by ID
  update: async (id: number, zone: Partial<Zone>) => {
    try {
      const response = await api.put(`/zones/${id}`, zone)
      return response.data
    } catch (error) {
      console.error(`Error updating zone with ID ${id}:`, error)
      throw error
    }
  },

  // Delete zone by ID
  delete: async (id: number) => {
    try {
      const response = await api.delete(`/zones/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error deleting zone with ID ${id}:`, error)
      throw error
    }
  },

  // Get spaces under a specific zone
  getSpaces: async (zoneId: number) => {
    try {
      const response = await api.get(`/zones/${zoneId}/spaces`)
      return response.data
    } catch (error) {
      console.error(`Error fetching spaces for zone ID ${zoneId}:`, error)
      throw error
    }
  },

  // Get zone statistics
  getStatistics: async (zoneId: number) => {
    try {
      const response = await api.get(`/zones/${zoneId}/statistics`)
      return response.data
    } catch (error) {
      console.error(`Error fetching statistics for zone ID ${zoneId}:`, error)
      throw error
    }
  },
}
