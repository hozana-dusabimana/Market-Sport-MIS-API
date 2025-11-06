import api from './api'

export interface Notification {
  notification_id?: number
  user_id?: number
  user_type?: 'admin' | 'manager' | 'seller' | 'all'
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  is_read?: boolean
  created_at?: string
}

export const notificationService = {
  getAll: async (params?: { user_id?: number; is_read?: boolean }) => {
    const response = await api.get('/notifications', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/notifications/${id}`)
    return response.data
  },

  create: async (notification: Notification) => {
    const response = await api.post('/notifications', notification)
    return response.data
  },

  markAsRead: async (id: number) => {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all')
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },
}


