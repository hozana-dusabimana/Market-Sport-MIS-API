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
    user_type: 'all',
    title: '',
    message: '',
    type: 'info',
  })

  const queryClient = useQueryClient()
  const { data: notificationsData, isLoading } = useQuery('notifications', () => notificationService.getAll(), {
    retry: false,
    onError: () => {},
  })
  const notifications = useDemoData(notificationsData, demoNotifications)

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
      user_type: 'all',
      title: '',
      message: '',
      type: 'info',
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

      <div className="card">
        <div className="space-y-4">
          {notifications?.data?.length > 0 ? (
            notifications.data.map((notification: Notification) => (
              <div
                key={notification.notification_id}
                className={`p-4 rounded-lg border-l-4 ${
                  notification.type === 'info'
                    ? 'bg-blue-50 border-blue-500'
                    : notification.type === 'success'
                    ? 'bg-green-50 border-green-500'
                    : notification.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-red-50 border-red-500'
                } ${!notification.is_read ? 'font-semibold' : ''}`}
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
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsReadMutation.mutate(notification.notification_id!)}
                      className="ml-4 text-primary-600 hover:text-primary-700"
                    >
                      <Check size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))
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
                <label className="label">Recipient Type *</label>
                <select
                  value={formData.user_type}
                  onChange={(e) => setFormData({ ...formData, user_type: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admins</option>
                  <option value="manager">Managers</option>
                  <option value="seller">Sellers</option>
                </select>
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
                <label className="label">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
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


