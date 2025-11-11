import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { notificationService, Notification } from '../../services/notificationService'
import toast from 'react-hot-toast'
import { Plus, Bell, Check } from 'lucide-react'
import { format } from 'date-fns'
import { demoNotifications, useDemoData } from '../../utils/demoData'

const Notifications = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Notification>>({
    user_id: undefined,
    seller_id: undefined,
    title: '',
    message: '',
    notification_type: 'system',
  })

  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
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
      },
    }
  )

  const markAllAsReadMutation = useMutation(() => notificationService.markAllAsRead(), {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      toast.success('All notifications marked as read')
    },
  })

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
              setIsModalOpen(true)
              resetForm()
            }}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Send Notification</span>
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Types</option>
            <option value="system">System</option>
            <option value="payment">Payment</option>
            <option value="allocation">Allocation</option>
            <option value="verification">Verification</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="space-y-4">
          {notifications?.length > 0 ? (
            notifications.map((notification: Notification) => {
              const isUnread = notification.status === 'unread' || !notification.is_read
              return (
                <div
                  key={notification.notification_id}
                  className={`p-4 rounded-lg border-l-4 ${
                    notification.notification_type === 'payment'
                      ? 'bg-green-50 border-green-500'
                      : notification.notification_type === 'allocation'
                      ? 'bg-blue-50 border-blue-500'
                      : notification.notification_type === 'verification'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-gray-50 border-gray-500'
                  } ${isUnread ? 'font-semibold' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-gray-700 mt-1">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {notification.created_at &&
                          format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {isUnread && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification.notification_id!)}
                          className="ml-4 text-primary-600 hover:text-primary-700"
                          title="Mark as read"
                        >
                          <Check size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-center text-gray-500 py-8">No notifications</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Send Notification</h2>
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

export default Notifications


