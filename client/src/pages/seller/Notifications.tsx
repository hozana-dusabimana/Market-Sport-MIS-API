import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { notificationService } from '../../services/notificationService'
import { sellerService } from '../../services/sellerService'
import { Bell, Check } from 'lucide-react'
import { format } from 'date-fns'

const SellerNotifications = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch seller profile to get seller_id
  const { data: sellerProfile } = useQuery(
    ['seller-profile-for-notifs', user?.userId],
    () => sellerService.getByUserId(user!.userId),
    { enabled: !!user?.userId, retry: false, onError: () => {} }
  )

  // Fetch notifications addressed to the user (system/admin/manager)
  const { data: notificationsUserData, isLoading: loadingUser } = useQuery(
    'seller-user-notifications',
    () => notificationService.getUserNotifications(),
    { enabled: !!user?.userId, retry: false, onError: () => {} }
  )

  // Fetch notifications addressed to the seller_id (payment-related etc.)
  const sellerId = sellerProfile?.data?.seller_id
  const { data: notificationsSellerData, isLoading: loadingSeller } = useQuery(
    ['seller-id-notifications', sellerId],
    () => notificationService.getAll({ seller_id: sellerId }),
    { enabled: !!sellerId, retry: false, onError: () => {} }
  )

  // Merge and de-duplicate notifications
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
    {
      onSuccess: () => {
        queryClient.invalidateQueries('seller-notifications')
      },
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
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('seller-user-notifications')
      queryClient.invalidateQueries('seller-id-notifications')
    },
  })

  if (loadingUser || loadingSeller) {
    return <div className="text-center py-12">Loading notifications...</div>
  }

  const unreadCount = notifications?.filter((n: any) => n.status === 'unread' || !n.is_read)?.length || 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Check size={18} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      <div className="card">
        <div className="space-y-4">
          {notifications?.length > 0 ? (
            notifications.map((notification: any) => {
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
                  {isUnread && (
                    <button
                      onClick={() => markAsReadMutation.mutate(notification.notification_id)}
                      className="ml-4 text-primary-600 hover:text-primary-700"
                      title="Mark as read"
                    >
                      <Check size={20} />
                    </button>
                  )}
                </div>
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


