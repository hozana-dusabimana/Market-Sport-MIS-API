import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { notificationService } from '../../services/notificationService'
import { sellerService } from '../../services/sellerService'
import { Bell, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

type NotificationItem = {
  notification_id: number
  title?: string
  message?: string
  created_at?: string
  status?: 'read' | 'unread' | string
  is_read?: boolean
  notification_type?: 'payment' | 'allocation' | 'verification' | 'system' | string
}

const SellerNotifications = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [openId, setOpenId] = useState<number | null>(null)
  const navigate = useNavigate()

  const { data: sellerProfile } = useQuery(
    ['seller-profile-for-notifs', user?.userId],
    () => sellerService.getByUserId(user!.userId),
    { enabled: !!user?.userId, retry: false }
  )

  const deleteMutation = useMutation(
    (id: number) => notificationService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('seller-user-notifications')
        queryClient.invalidateQueries(['seller-id-notifications', sellerId])
        queryClient.invalidateQueries('seller-notifications')
      },
    }
  )

  const { data: notificationsUserData, isLoading: loadingUser } = useQuery(
    'seller-user-notifications',
    () => notificationService.getUserNotifications(),
    { enabled: !!user?.userId, retry: false }
  )

  const sellerId = sellerProfile?.data?.seller_id
  const { data: notificationsSellerData, isLoading: loadingSeller } = useQuery(
    ['seller-id-notifications', sellerId],
    () => notificationService.getAll({ seller_id: sellerId }),
    { enabled: !!sellerId, retry: false }
  )

  const listA: NotificationItem[] = (notificationsUserData?.data || []) as NotificationItem[]
  const listB: NotificationItem[] = (notificationsSellerData?.data || []) as NotificationItem[]
  const notificationsMap: Record<string, NotificationItem> = {}
  ;[...listA, ...listB].forEach((n) => {
    const key = String(n.notification_id || `${n.title}-${n.created_at}`)
    notificationsMap[key] = n
  })
  const notifications: NotificationItem[] = Object.values(notificationsMap).sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })

  const markAsReadMutation = useMutation(
    (id: number) => notificationService.markAsRead(id),
    {
      onMutate: async (id: number) => {
        await queryClient.cancelQueries('seller-user-notifications')
        await queryClient.cancelQueries('seller-id-notifications')
        const prevUser = queryClient.getQueryData<unknown>('seller-user-notifications')
        const prevSeller = queryClient.getQueryData<unknown>(['seller-id-notifications', sellerId])
        const updateList = (data: unknown) => {
          if (!data) return data
          const d = data as { data?: NotificationItem[] }
          const arr = d.data ?? (data as NotificationItem[])
          const updated = arr.map(n => n.notification_id === id ? { ...n, is_read: true, status: 'read' } : n)
          return Array.isArray(arr) ? updated : { ...(data as object), data: updated }
        }
        queryClient.setQueryData('seller-user-notifications', (data: unknown) => updateList(data))
        queryClient.setQueryData(['seller-id-notifications', sellerId], (data: unknown) => updateList(data))
        return { prevUser, prevSeller }
      },
      onError: (_err, _id, ctx?: { prevUser?: unknown; prevSeller?: unknown }) => {
        if (ctx?.prevUser) queryClient.setQueryData('seller-user-notifications', ctx.prevUser)
        if (ctx?.prevSeller) queryClient.setQueryData(['seller-id-notifications', sellerId], ctx.prevSeller)
      },
      onSuccess: () => {
        queryClient.invalidateQueries('seller-user-notifications')
        queryClient.invalidateQueries(['seller-id-notifications', sellerId])
        queryClient.invalidateQueries('seller-notifications')
      },
    }
  )

  const markAllAsReadMutation = useMutation(async () => {
    const unreadIds = notifications
      .filter((n) => n.status === 'unread' || !n.is_read)
      .map((n) => n.notification_id)
      .filter(Boolean)
    if (unreadIds.length > 0) {
      await notificationService.markMultipleAsRead(unreadIds as number[])
    }
    return { success: true }
  }, {
    onMutate: async () => {
      await queryClient.cancelQueries('seller-user-notifications')
      await queryClient.cancelQueries(['seller-id-notifications', sellerId])
      const updateAll = (data: unknown) => {
        if (!data) return data
        const d = data as { data?: NotificationItem[] }
        const arr = d.data ?? (data as NotificationItem[])
        const updated = arr.map(n => ({ ...n, is_read: true, status: 'read' }))
        return Array.isArray(arr) ? updated : { ...(data as object), data: updated }
      }
      queryClient.setQueryData('seller-user-notifications', (data: unknown) => updateAll(data))
      queryClient.setQueryData(['seller-id-notifications', sellerId], (data: unknown) => updateAll(data))
    },
    onSuccess: () => {
      queryClient.invalidateQueries('seller-user-notifications')
      queryClient.invalidateQueries(['seller-id-notifications', sellerId])
      queryClient.invalidateQueries('seller-notifications')
    }
  })

  if (loadingUser || loadingSeller) {
    return <div className="text-center py-12 text-gray-500">Loading notifications...</div>
  }

  const unreadCount = notifications?.filter((n) => n.status === 'unread' || !n.is_read)?.length || 0

  const handleToggle = (notification: NotificationItem) => {
    const isUnread = notification.status === 'unread' || !notification.is_read
    if (isUnread && notification.notification_id) {
      markAsReadMutation.mutate(notification.notification_id)
    }
    setOpenId(openId === notification.notification_id ? null : notification.notification_id)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary px-3 py-1 text-sm"
            >
              Back to Dashboard
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                Unread: <span className="font-bold text-blue-900">{unreadCount}</span>
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAllAsReadMutation.mutate()} className="btn-primary">
              Mark All Read
            </button>
          )}
        </div>

        <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const isUnread = notification.status === 'unread' || !notification.is_read
            const isOpen = openId === notification.notification_id

            // Type-based colors for UNREAD notifications
            let unreadTypeColor = 'bg-gray-50 border-gray-300'
            if (notification.notification_type === 'payment') unreadTypeColor = 'bg-green-50 border-green-500'
            else if (notification.notification_type === 'allocation') unreadTypeColor = 'bg-blue-50 border-blue-500'
            else if (notification.notification_type === 'verification') unreadTypeColor = 'bg-yellow-50 border-yellow-500'

            // Read notifications appear muted and gray
            const readColor = 'bg-gray-50 border-gray-200 text-gray-500'
            const cardColorClasses = isUnread ? `${unreadTypeColor} text-gray-900` : readColor

            return (
              <div
                key={notification.notification_id}
                className={`card border-l-4 cursor-pointer transition hover:shadow-lg ${cardColorClasses} ${isUnread ? 'font-semibold' : 'font-normal'}`}
                onClick={() => handleToggle(notification)}
              >
                <div className="flex justify-between items-center p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${
                        isUnread ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <h3 className="text-lg text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.created_at && format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('Delete this notification?')) {
                          deleteMutation.mutate(notification.notification_id)
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                      title="Delete notification"
                    >
                      <Trash2 size={18} />
                    </button>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 text-gray-700 border-t border-gray-200">
                    {notification.message}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notifications</p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default SellerNotifications
