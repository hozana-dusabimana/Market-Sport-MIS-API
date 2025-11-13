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
  // Fetch all notifications with optional filters
  getAll: async (params?: { 
    user_id?: number
    seller_id?: number
    status?: string
    notification_type?: string
    limit?: number
    offset?: number
  }) => {
    try {
      const response = await api.get('/notifications', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  },

  // Get notifications specific to the logged-in user
  getUserNotifications: async (params?: {
    status?: string
    notification_type?: string
    limit?: number
    offset?: number
  }) => {
    try {
      const response = await api.get('/notifications/user/notifications', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching user notifications:', error)
      throw error
    }
  },

  // Get count of unread notifications
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread/count')
      return response.data
    } catch (error) {
      console.error('Error fetching unread count:', error)
      throw error
    }
  },

  // Get notification by ID
  getById: async (id: number) => {
    try {
      const response = await api.get(`/notifications/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching notification ID ${id}:`, error)
      throw error
    }
  },

  // Create a new notification
  create: async (notification: Notification) => {
    try {
      const response = await api.post('/notifications', notification)
      return response.data
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  },

  // Update a notification
  update: async (id: number, notification: Partial<Notification>) => {
    try {
      const response = await api.put(`/notifications/${id}`, notification)
      return response.data
    } catch (error) {
      console.error(`Error updating notification ID ${id}:`, error)
      throw error
    }
  },

  // Update notification status
  updateStatus: async (id: number, status: 'unread' | 'read') => {
    try {
      const response = await api.patch(`/notifications/${id}/status`, { status })
      return response.data
    } catch (error) {
      console.error(`Error updating status for notification ID ${id}:`, error)
      throw error
    }
  },

  // Mark a single notification as read
  markAsRead: async (id: number) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`)
      return response.data
    } catch (error) {
      console.error(`Error marking notification ID ${id} as read:`, error)
      throw error
    }
  },

  // Mark multiple notifications as read
  markMultipleAsRead: async (notificationIds: number[]) => {
    try {
      const response = await api.post('/notifications/read/multiple', { notification_ids: notificationIds })
      return response.data
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error)
      throw error
    }
  },

  // Mark all unread notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.get('/notifications/user/notifications', { params: { status: 'unread' } })
      const notifications: Notification[] = response.data?.data || []
      if (notifications.length === 0) return { success: true, message: 'No unread notifications' }

      const ids = notifications.map(n => n.notification_id!)
      const markResponse = await api.post('/notifications/read/multiple', { notification_ids: ids })
      return markResponse.data
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  },

  // Delete a notification
  delete: async (id: number) => {
    try {
      const response = await api.delete(`/notifications/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error deleting notification ID ${id}:`, error)
      throw error
    }
  },
}
