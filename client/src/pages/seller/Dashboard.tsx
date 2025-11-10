import { useQuery } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { allocationService } from '../../services/allocationService'
import { paymentService } from '../../services/paymentService'
import { notificationService } from '../../services/notificationService'
import { sellerService } from '../../services/sellerService'
import { Square, CreditCard, Bell, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

const SellerDashboard = () => {
  const { user } = useAuthStore()

  const { data: allocations } = useQuery(
    'seller-allocations',
    () => allocationService.getAll({ seller_id: user?.userId }),
    { enabled: !!user?.userId }
  )

  const { data: payments } = useQuery(
    'seller-payments',
    () => paymentService.getSellerPayments(user?.userId || 0),
    { enabled: !!user?.userId }
  )

  const { data: notifications } = useQuery(
    'seller-notifications',
    () => notificationService.getAll({ user_id: user?.userId }),
    { enabled: !!user?.userId }
  )

  // Get seller profile first, then statistics
  const { data: sellerProfile } = useQuery(
    'seller-profile',
    () => sellerService.getByUserId(user?.userId || 0),
    { enabled: !!user?.userId && user?.user_type === 'seller' }
  )

  const { data: sellerStats } = useQuery(
    'seller-statistics',
    () => sellerService.getStatistics(sellerProfile?.data?.seller_id || 0),
    { enabled: !!sellerProfile?.data?.seller_id }
  )

  const activeAllocations = allocations?.data?.filter((a: any) => a.status === 'active') || []
  const pendingPayments = payments?.data?.filter((p: any) => p.status === 'pending') || []
  const unreadNotifications = notifications?.data?.filter((n: any) => !n.is_read) || []
  const totalPaid = payments?.data?.reduce((sum: number, p: any) => {
    return sum + (p.status === 'completed' ? p.amount : 0)
  }, 0) || 0

  const stats = [
    {
      name: 'Active Spaces',
      value: activeAllocations.length,
      icon: Square,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Paid',
      value: `$${totalPaid.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'Pending Payments',
      value: pendingPayments.length,
      icon: CreditCard,
      color: 'bg-yellow-500',
    },
    {
      name: 'Unread Notifications',
      value: unreadNotifications.length,
      icon: Bell,
      color: 'bg-red-500',
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Seller Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {sellerStats?.data && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Allocations</p>
              <p className="text-2xl font-bold text-gray-900">{sellerStats.data.total_allocations || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Active Allocations</p>
              <p className="text-2xl font-bold text-green-600">{sellerStats.data.active_allocations || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{sellerStats.data.total_payments || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">${(sellerStats.data.total_paid || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Active Spaces</h2>
          {activeAllocations.length > 0 ? (
            <div className="space-y-3">
              {activeAllocations.slice(0, 5).map((allocation: any) => (
                <div key={allocation.allocation_id} className="border-b border-gray-200 pb-3">
                  <p className="font-medium text-gray-900">Space #{allocation.space_id}</p>
                  <p className="text-sm text-gray-600">
                    Started: {format(new Date(allocation.start_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No active space allocations</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Payments</h2>
          {payments?.data?.length > 0 ? (
            <div className="space-y-3">
              {payments.data.slice(0, 5).map((payment: any) => (
                <div key={payment.payment_id} className="border-b border-gray-200 pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">${payment.amount}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No payment history</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard


