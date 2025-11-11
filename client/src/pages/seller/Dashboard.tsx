import { useQuery } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { allocationService } from '../../services/allocationService'
import { paymentService } from '../../services/paymentService'
import { notificationService } from '../../services/notificationService'
import { sellerService } from '../../services/sellerService'
import { spaceService } from '../../services/spaceService'
import { zoneService } from '../../services/zoneService'
import { authService } from '../../services/authService'
import { Square, CreditCard, Bell, DollarSign, User, AlertCircle, CheckCircle, Clock, XCircle, Link as LinkIcon } from 'lucide-react'
import { format, differenceInDays, isAfter, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'

const SellerDashboard = () => {
  const { user } = useAuthStore()

  // First get seller profile to get seller_id
  const userId = user?.userId
  const { data: sellerProfileResponse, isLoading: profileLoading } = useQuery(
    ['seller-profile', userId],
    () => sellerService.getAll({ id: userId }),
    { enabled: !!userId && user?.user_type === 'seller', retry: false, onError: () => {} }
  )

  // Also get user profile for complete information
  const { data: userProfileData } = useQuery(
    ['user-profile', userId],
    () => authService.getProfile(),
    { enabled: !!userId, retry: false, onError: () => {} }
  )

  // Extract seller_id from response - backend returns sellers array when id is provided
  const sellerProfile = sellerProfileResponse?.data?.sellers?.[0] || sellerProfileResponse?.data
  const sellerId = sellerProfile?.seller_id || sellerProfile?.user_id || userId
  const fullSellerProfile = userProfileData?.data || sellerProfile

  const { data: allocationsData, isLoading: allocationsLoading } = useQuery(
    ['seller-allocations', sellerId],
    () => allocationService.getAll({ seller_id: sellerId }),
    { enabled: !!sellerId, retry: false, onError: () => {} }
  )

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery(
    ['seller-payments', sellerId],
    () => paymentService.getAll({ seller_id: sellerId }),
    { enabled: !!sellerId, retry: false, onError: () => {} }
  )

  const { data: notificationsData } = useQuery(
    'seller-notifications',
    () => notificationService.getUserNotifications(),
    { enabled: !!userId, retry: false, onError: () => {} }
  )

  const { data: sellerStats } = useQuery(
    ['seller-statistics', sellerId],
    () => sellerService.getStatistics(sellerId),
    { enabled: !!sellerId, retry: false, onError: () => {} }
  )

  const allocations = allocationsData?.data || []
  const payments = paymentsData?.data || []
  const notifications = notificationsData?.data || []

  // Fetch space details for allocations
  const spaceIds = allocations.map((a: any) => a.space_id).filter(Boolean)
  const { data: spacesData } = useQuery(
    ['spaces-for-seller', spaceIds],
    () => Promise.all(spaceIds.map((id: number) => spaceService.getById(id))),
    { enabled: spaceIds.length > 0, retry: false, onError: () => {} }
  )
  const spaces = spacesData?.map((s: any) => s?.data).filter(Boolean) || []
  const spaceMap = new Map(spaces.map((s: any) => [s?.space_id, s]))

  // Fetch zone details for spaces
  const zoneIds = [...new Set(spaces.map((s: any) => s?.zone_id).filter(Boolean))]
  const { data: zonesData } = useQuery(
    ['zones-for-seller', zoneIds],
    () => Promise.all(zoneIds.map((id: number) => zoneService.getById(id))),
    { enabled: zoneIds.length > 0, retry: false, onError: () => {} }
  )
  const zones = zonesData?.map((z: any) => z?.data).filter(Boolean) || []
  const zoneMap = new Map(zones.map((z: any) => [z?.zone_id, z]))

  const activeAllocations = allocations.filter((a: any) => a.status === 'active') || []
  const pendingPayments = payments.filter((p: any) => p.status === 'pending') || []
  const completedPayments = payments.filter((p: any) => p.status === 'completed') || []
  const unreadNotifications = notifications.filter((n: any) => n.status === 'unread' || !n.is_read) || []
  
  const totalPaid = completedPayments.reduce((sum: number, p: any) => {
    return sum + (Number(p.amount) || 0)
  }, 0)
  
  const pendingAmount = pendingPayments.reduce((sum: number, p: any) => {
    return sum + (Number(p.amount) || 0)
  }, 0)

  const totalRevenue = payments.reduce((sum: number, p: any) => {
    return sum + (Number(p.amount) || 0)
  }, 0)

  // Calculate monthly payment totals for the last 6 months
  const monthlyPayments = payments.reduce((acc: any, p: any) => {
    if (p.status === 'completed' && p.payment_date) {
      const month = format(new Date(p.payment_date), 'yyyy-MM')
      acc[month] = (acc[month] || 0) + (Number(p.amount) || 0)
    }
    return acc
  }, {})

  // Get upcoming payment due dates (for active allocations)
  const upcomingPayments = activeAllocations.map((allocation: any) => {
    const space = spaceMap.get(allocation.space_id)
    const monthlyRate = space?.monthly_rate || space?.daily_rate * 30 || 0
    return {
      allocation,
      space,
      amount: monthlyRate,
      nextDueDate: allocation.end_date ? parseISO(allocation.end_date) : null,
    }
  }).filter((p: any) => p.nextDueDate && isAfter(p.nextDueDate, new Date()))
    .sort((a: any, b: any) => a.nextDueDate - b.nextDueDate)
    .slice(0, 3)

  // Get verification status
  const verificationStatus = sellerProfile?.verification_status || fullSellerProfile?.profile?.verification_status || 'pending'
  const verificationStatusConfig = {
    verified: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Verified' },
    pending: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Pending Verification' },
    rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Verification Rejected' },
  }

  const statusConfig = verificationStatusConfig[verificationStatus as keyof typeof verificationStatusConfig] || verificationStatusConfig.pending
  const StatusIcon = statusConfig.icon

  const stats = [
    {
      name: 'Active Spaces',
      value: activeAllocations.length,
      icon: Square,
      color: 'bg-blue-500',
      link: '/my-spaces',
    },
    {
      name: 'Total Paid',
      value: `$${totalPaid.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/my-payments',
    },
    {
      name: 'Pending Payments',
      value: `$${pendingAmount.toFixed(2)}`,
      icon: CreditCard,
      color: 'bg-yellow-500',
      link: '/my-payments',
    },
    {
      name: 'Unread Notifications',
      value: unreadNotifications.length,
      icon: Bell,
      color: 'bg-red-500',
      link: '/my-notifications',
    },
  ]

  if (profileLoading || allocationsLoading || paymentsLoading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  return (
    <div>
      {/* Header with Profile Info */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {fullSellerProfile?.profile?.full_name || sellerProfile?.full_name || user?.username || 'Seller'}!
          </p>
        </div>
        <Link to="/profile" className="btn btn-secondary flex items-center space-x-2">
          <User size={18} />
          <span>Edit Profile</span>
        </Link>
      </div>

      {/* Verification Status Banner */}
      {verificationStatus !== 'verified' && (
        <div className={`mb-6 card ${statusConfig.bgColor} border-l-4 ${
          verificationStatus === 'pending' ? 'border-yellow-500' :
          verificationStatus === 'rejected' ? 'border-red-500' :
          'border-gray-500'
        }`}>
          <div className="flex items-center space-x-3">
            <StatusIcon className={statusConfig.color} size={24} />
            <div>
              <h3 className="font-semibold text-gray-900">Account Status: {statusConfig.label}</h3>
              <p className="text-sm text-gray-600">
                {verificationStatus === 'pending' 
                  ? 'Your account is pending verification. Please wait for admin approval.'
                  : 'Your verification was rejected. Please contact support for assistance.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          const StatCard = (
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
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
          
          return stat.link ? (
            <Link key={stat.name} to={stat.link} className="block">
              {StatCard}
            </Link>
          ) : (
            <div key={stat.name}>{StatCard}</div>
          )
        })}
      </div>

      {/* Detailed Statistics */}
      {sellerStats?.data && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Allocations</p>
              <p className="text-2xl font-bold text-gray-900">{sellerStats.data.total_allocations || allocations.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Active Allocations</p>
              <p className="text-2xl font-bold text-green-600">{sellerStats.data.active_allocations || activeAllocations.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{sellerStats.data.total_payments || payments.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">${(sellerStats.data.total_paid || totalPaid).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Active Spaces */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Active Spaces</h2>
            <Link to="/my-spaces" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1">
              <span>View All</span>
              <LinkIcon size={16} />
            </Link>
          </div>
          {activeAllocations.length > 0 ? (
            <div className="space-y-4">
              {activeAllocations.slice(0, 3).map((allocation: any) => {
                const space = spaceMap.get(allocation.space_id)
                const zone = space ? zoneMap.get(space.zone_id) : null
                const monthlyRate = space?.monthly_rate || space?.daily_rate * 30 || 0
                const daysRemaining = allocation.end_date 
                  ? differenceInDays(parseISO(allocation.end_date), new Date())
                  : null
                
                return (
                  <div key={allocation.allocation_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {space?.space_number || space?.space_code || `Space #${allocation.space_id}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {zone?.zone_name || `Zone ${space?.zone_id || ''}`} • {space?.space_type || 'N/A'}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-600">Started</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(allocation.start_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Monthly Rate</p>
                        <p className="font-medium text-gray-900">${monthlyRate.toFixed(2)}</p>
                      </div>
                      {allocation.end_date && (
                        <div className="col-span-2">
                          <p className="text-gray-600">
                            {daysRemaining !== null && daysRemaining > 0 
                              ? `Ends in ${daysRemaining} days`
                              : 'End Date'}
                          </p>
                          <p className="font-medium text-gray-900">
                            {format(new Date(allocation.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Square className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No active space allocations</p>
              <p className="text-sm text-gray-400 mt-1">Contact a manager to get allocated a space</p>
            </div>
          )}
        </div>

        {/* Profile Summary */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Summary</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Business Name</p>
              <p className="font-medium text-gray-900">
                {sellerProfile?.business_name || fullSellerProfile?.profile?.business_name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Business Type</p>
              <p className="font-medium text-gray-900">
                {sellerProfile?.business_type || fullSellerProfile?.profile?.business_type || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Verification Status</p>
              <div className="flex items-center space-x-2 mt-1">
                <StatusIcon className={statusConfig.color} size={18} />
                <span className={`font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registration Date</p>
              <p className="font-medium text-gray-900">
                {sellerProfile?.registration_date 
                  ? format(new Date(sellerProfile.registration_date), 'MMM dd, yyyy')
                  : 'N/A'}
              </p>
            </div>
            <Link to="/profile" className="block mt-4 text-center btn btn-secondary text-sm">
              Update Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Payment and Notification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Payments */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
            <Link to="/my-payments" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1">
              <span>View All</span>
              <LinkIcon size={16} />
            </Link>
          </div>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment: any) => (
                <div key={payment.payment_id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">${Number(payment.amount || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')} • {payment.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : payment.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No payment history</p>
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Notifications</h2>
            <Link to="/my-notifications" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1">
              <span>View All</span>
              <LinkIcon size={16} />
            </Link>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification: any) => {
                const isUnread = notification.status === 'unread' || !notification.is_read
                return (
                  <div
                    key={notification.notification_id}
                    className={`p-3 rounded-lg border-l-4 ${
                      notification.notification_type === 'payment'
                        ? 'bg-green-50 border-green-500'
                        : notification.notification_type === 'allocation'
                        ? 'bg-blue-50 border-blue-500'
                        : notification.notification_type === 'verification'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-gray-50 border-gray-500'
                    } ${isUnread ? 'font-semibold' : ''}`}
                  >
                    <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {notification.created_at && format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No notifications</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Payments and Payment Summary */}
      {upcomingPayments.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="text-yellow-600" size={20} />
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Payment Due Dates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingPayments.map((payment: any, index: number) => (
              <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Space: {payment.space?.space_number || payment.space?.space_code || 'N/A'}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">${payment.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Due: {format(payment.nextDueDate, 'MMM dd, yyyy')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {differenceInDays(payment.nextDueDate, new Date())} days remaining
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Summary */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
              </div>
            </div>
            
            {/* Payment by Method */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment by Method</h3>
              <div className="space-y-2">
                {Object.entries(
                  payments.reduce((acc: any, p: any) => {
                    const method = p.payment_method || 'unknown'
                    acc[method] = (acc[method] || 0) + (Number(p.amount) || 0)
                    return acc
                  }, {})
                ).map(([method, amount]: [string, any]) => (
                  <div key={method} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                    <span className="font-medium text-gray-900">${Number(amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Payment History */}
          {Object.keys(monthlyPayments).length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Payment History</h2>
              <div className="space-y-2">
                {Object.entries(monthlyPayments)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 6)
                  .map(([month, amount]: [string, any]) => (
                    <div key={month} className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">{format(new Date(month + '-01'), 'MMMM yyyy')}</span>
                      <span className="font-medium text-gray-900">${Number(amount).toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/my-spaces" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <Square className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">My Spaces</span>
          </Link>
          <Link to="/my-payments" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <CreditCard className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Payments</span>
          </Link>
          <Link to="/my-notifications" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <Bell className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Notifications</span>
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            )}
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <User className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard


