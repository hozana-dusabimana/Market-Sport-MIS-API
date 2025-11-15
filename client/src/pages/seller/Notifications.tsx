import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { notificationService } from '../../services/notificationService'
import { sellerService } from '../../services/sellerService'
import { Bell, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'

const SellerNotifications = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [openId, setOpenId] = useState<number | null>(null)

  const { data: sellerProfile } = useQuery(
    ['seller-profile-for-notifs', user?.userId],
    () => sellerService.getByUserId(user!.userId),
    { enabled: !!user?.userId, retry: false }
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

  const listA = notificationsUserData?.data || []
  const listB = notificationsSellerData?.data || []
  const notificationsMap: Record<string, any> = {}
  ;[...listA, ...listB].forEach((n: any) => {
    const key = String(n.notification_id || `${n.title}-${n.created_at}`)
    notificationsMap[key] = n
  })
  const notifications = Object.values(notificationsMap).sort((a: any, b: any) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })

  const markAsReadMutation = useMutation(
    (id: number) => notificationService.markAsRead(id),
    { onSuccess: () => {
        queryClient.invalidateQueries('seller-user-notifications')
        queryClient.invalidateQueries('seller-id-notifications')
      }
    }
  )

  const markAllAsReadMutation = useMutation(async () => {
    const unreadIds = notifications
      .filter((n: any) => n.status === 'unread' || !n.is_read)
      .map((n: any) => n.notification_id)
      .filter(Boolean)
    if (unreadIds.length > 0) {
      await notificationService.markMultipleAsRead(unreadIds as number[])
    }
    return { success: true }
  }, { onSuccess: () => {
      queryClient.invalidateQueries('seller-user-notifications')
      queryClient.invalidateQueries('seller-id-notifications')
    }
  })

  if (loadingUser || loadingSeller) {
    return <div className="text-center py-12 text-gray-500">Loading notifications...</div>
  }

  const unreadCount = notifications?.filter((n: any) => n.status === 'unread' || !n.is_read)?.length || 0

  const handleToggle = (notification: any) => {
    const isUnread = notification.status === 'unread' || !notification.is_read
    if (isUnread && notification.notification_id) {
      markAsReadMutation.mutate(notification.notification_id)
    }
    setOpenId(openId === notification.notification_id ? null : notification.notification_id)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Check size={18} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification: any) => {
            const isUnread = notification.status === 'unread' || !notification.is_read
            const isOpen = openId === notification.notification_id
            let typeColor = 'bg-gray-50 border-gray-300'
            if (notification.notification_type === 'payment') typeColor = 'bg-green-50 border-green-500'
            else if (notification.notification_type === 'allocation') typeColor = 'bg-blue-50 border-blue-500'
            else if (notification.notification_type === 'verification') typeColor = 'bg-yellow-50 border-yellow-500'

            return (
              <div
                key={notification.notification_id}
                className={`border-l-4 rounded-lg shadow-sm cursor-pointer transition hover:shadow-md ${typeColor} ${isUnread ? 'font-semibold' : 'font-normal'}`}
                onClick={() => handleToggle(notification)}
              >
                <div className="flex justify-between items-center p-4">
                  <div>
                    <h3 className="text-lg text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {notification.created_at && format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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
  )
}

export default SellerNotifications
