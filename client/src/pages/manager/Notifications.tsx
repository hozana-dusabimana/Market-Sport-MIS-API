import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { notificationService, Notification } from '../../services/notificationService'
import toast from 'react-hot-toast'
import { Plus, Bell, Check, X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const ManagerNotifications = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Notification>>({
    user_id: undefined,
    seller_id: undefined,
    title: '',
    message: '',
    notification_type: 'system',
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  const queryClient = useQueryClient()
  
  const { data: notificationsData, isLoading } = useQuery(
    ['notifications', statusFilter, typeFilter],
    () => notificationService.getAll({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      notification_type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
    {
      retry: false,
      onError: () => {},
    }
  )
  
  const notifications = notificationsData?.data || []

  const createMutation = useMutation(
    (notification: Notification) => notificationService.create(notification),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('Notification sent successfully')
        setIsModalOpen(false)
        resetForm()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to send notification')
      },
    }
  )

  const markAsReadMutation = useMutation(
    (id: number) => notificationService.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('Notification marked as read')
      },
    }
  )

  const markAllAsReadMutation = useMutation(() => notificationService.markAllAsRead(), {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      toast.success('All notifications marked as read')
    },
  })

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => notificationService.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('Notification status updated')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update notification status')
      },
    }
  )

  const deleteMutation = useMutation(
    (id: number) => notificationService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('Notification deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete notification')
      },
    }
  )

  const resetForm = () => {
    setFormData({
      user_id: undefined,
      seller_id: undefined,
      title: '',
      message: '',
      notification_type: 'system',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required')
      return
    }
    createMutation.mutate(formData as Notification)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading notifications...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Check size={18} />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Send Notification</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="system">System</option>
            <option value="payment">Payment</option>
            <option value="allocation">Allocation</option>
            <option value="verification">Verification</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification: Notification) => {
              const isUnread = notification.status === 'unread' || !notification.is_read
              return (
                <div
                  key={notification.notification_id}
                  className={`border rounded-lg p-4 ${
                    isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bell className={`w-5 h-5 ${isUnread ? 'text-blue-600' : 'text-gray-400'}`} />
                        <h3 className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            notification.notification_type === 'payment'
                              ? 'bg-green-100 text-green-800'
                              : notification.notification_type === 'allocation'
                              ? 'bg-blue-100 text-blue-800'
                              : notification.notification_type === 'verification'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {notification.notification_type}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {notification.user_id && (
                          <span>User ID: {notification.user_id}</span>
                        )}
                        {notification.seller_id && (
                          <span>Seller ID: {notification.seller_id}</span>
                        )}
                        {notification.created_at && (
                          <span>
                            {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isUnread && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification.notification_id!)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Mark as Read"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <select
                        value={notification.status}
                        onChange={(e) => {
                          updateStatusMutation.mutate({
                            id: notification.notification_id!,
                            status: e.target.value,
                          })
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium border-0 ${
                          notification.status === 'unread'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                      </select>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this notification?')) {
                            deleteMutation.mutate(notification.notification_id!)
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No notifications found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Notification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Notification</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">User ID (optional)</label>
                <input
                  type="number"
                  value={formData.user_id || ''}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input"
                  placeholder="Leave empty for all users"
                />
              </div>
              <div>
                <label className="label">Seller ID (optional)</label>
                <input
                  type="number"
                  value={formData.seller_id || ''}
                  onChange={(e) => setFormData({ ...formData, seller_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input"
                  placeholder="Leave empty if not seller-specific"
                />
              </div>
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="label">Notification Type *</label>
                <select
                  value={formData.notification_type || 'system'}
                  onChange={(e) => setFormData({ ...formData, notification_type: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="system">System</option>
                  <option value="payment">Payment</option>
                  <option value="allocation">Allocation</option>
                  <option value="verification">Verification</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerNotifications

