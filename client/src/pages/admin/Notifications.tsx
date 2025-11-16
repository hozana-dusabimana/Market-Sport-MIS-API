import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { notificationService, Notification } from '../../services/notificationService'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const Notifications = () => {
  const [formData, setFormData] = useState<Partial<Notification>>({
    user_id: undefined,
    seller_id: undefined,
    title: '',
    message: '',
    notification_type: 'system',
  })

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const createMutation = useMutation(
    (notification: Notification) => notificationService.create(notification),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('Notification sent successfully')
        resetForm()
      },
      onError: (error: unknown) => {
        type ApiError = { response?: { data?: { message?: string } } }
        const err = error as ApiError
        const msg = err.response?.data?.message || 'Failed to send notification'
        toast.error(msg)
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
    createMutation.mutate(formData as Notification)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary px-3 py-1 text-sm"
            >
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Send Notifications</h1>
              <p className="text-gray-600 mt-1">Send system messages to users and sellers. Leave IDs empty to broadcast.</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Compose</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onChange={(e) => setFormData({ ...formData, notification_type: e.target.value as Notification['notification_type'] })}
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
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Send</button>
            <button type="button" onClick={resetForm} className="btn-secondary flex-1">Reset</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

export default Notifications


