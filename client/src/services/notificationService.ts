import api from './api'

export interface Notification {
  notification_id?: number
  user_id?: number
  seller_id?: number
  title: string
  message: string
  notification_type?: 'system' | 'payment' | 'allocation' | 'verification' | 'other'
  status?: 'unread' | 'read'
  related_id?: number
  action_url?: string
  is_read?: boolean
  created_at?: string
}

export const notificationService = {
  getAll: async (params?: { 
    user_id?: number
    seller_id?: number
    status?: string
    notification_type?: string
    limit?: number
    offset?: number
  }) => {
    const response = await api.get('/notifications', { params })
    return response.data
  },

  getUserNotifications: async (params?: {
    status?: string
    notification_type?: string
    limit?: number
    offset?: number
  }) => {
    const response = await api.get('/notifications/user/notifications', { params })
    return response.data
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread/count')
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

  update: async (id: number, notification: Partial<Notification>) => {
    const response = await api.put(`/notifications/${id}`, notification)
    return response.data
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/notifications/${id}/status`, { status })
    return response.data
  },

  markAsRead: async (id: number) => {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },

  markMultipleAsRead: async (notificationIds: number[]) => {
    const response = await api.post('/notifications/read/multiple', { notification_ids: notificationIds })
    return response.data
  },

  markAllAsRead: async () => {
    // This is a convenience method that uses getUserNotifications to get all unread and mark them
    try {
      const response = await api.get('/notifications/user/notifications', { 
        params: { status: 'unread' } 
      })
      if (response.data?.data && response.data.data.length > 0) {
        const ids = response.data.data.map((n: Notification) => n.notification_id!)
        const markResponse = await api.post('/notifications/read/multiple', { notification_ids: ids })
        return markResponse.data
      }
      return { success: true, message: 'No unread notifications' }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      throw error
    }
  },

  delete: async (id: number) => {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },
}


