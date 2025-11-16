import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { allocationService } from '../../services/allocationService'
import { paymentService } from '../../services/paymentService'
import { notificationService } from '../../services/notificationService'
import { sellerService } from '../../services/sellerService'
import { spaceService } from '../../services/spaceService'
import { zoneService } from '../../services/zoneService'
import { authService } from '../../services/authService'
import { Square, CreditCard, Bell, DollarSign, User, AlertCircle, CheckCircle, Clock, XCircle, Link as LinkIcon, Plus } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { format, differenceInDays, isAfter, parseISO, addMonths, addDays } from 'date-fns'
import { Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import type { Payment } from '../../services/paymentService'

const SellerDashboard = () => {
  const { user } = useAuthStore()

  // First get seller profile to get seller_id
  const userId = user?.userId
  // Get user profile (contains seller profile including seller_id)
  const { data: userProfileData, isLoading: userProfileLoading } = useQuery(
    ['user-profile', userId],
    () => authService.getProfile(),
    { enabled: !!userId, retry: false, onError: () => {} }
  )

  // Extract seller_id from auth profile response
  const fullSellerProfile = userProfileData
  const fullProfileAny: any = fullSellerProfile
  const userObj = fullProfileAny?.data || fullProfileAny
  const profileObj = userObj?.profile || {}
  const sellerId = profileObj?.seller_id || userObj?.user_id || userId

  const queryClient = useQueryClient()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState<Partial<Payment>>({
    allocation_id: 0,
    amount: 0,
    payment_method: 'mobile_money',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'completed',
  })
  const [paymentsSearch, setPaymentsSearch] = useState('')
  const [paymentsStatus, setPaymentsStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [notificationsSearch, setNotificationsSearch] = useState('')
  const [notificationsType, setNotificationsType] = useState<'all' | 'payment' | 'allocation' | 'verification' | 'system'>('all')

  const createPaymentMutation = useMutation(
    (payment: Payment) => paymentService.create(payment),
    {
      onSuccess: async (_res, _vars) => {
        queryClient.invalidateQueries(['seller-payments', sellerId])
        queryClient.invalidateQueries('payments')

        // Auto-extend allocation end date according to allocation type
        try {
          const alloc = activeAllocations.find((a: any) => a.allocation_id === paymentForm.allocation_id)
          if (alloc) {
            const newEnd = computeNextPeriodEnd(alloc)
            await allocationService.update(alloc.allocation_id, {
              end_date: format(newEnd, 'yyyy-MM-dd'),
            })
            queryClient.invalidateQueries(['seller-allocations', sellerId])
            toast.success(`Payment recorded and period extended to ${format(newEnd, 'MMM dd, yyyy')}`)
          } else {
            toast.success('Payment recorded successfully')
          }
        } catch (e: any) {
          toast.success('Payment recorded. Failed to extend period automatically.')
        }

        setIsPaymentModalOpen(false)
        setPaymentForm({
          allocation_id: 0,
          amount: 0,
          payment_method: 'mobile_money',
          payment_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'completed',
        })
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to record payment')
      },
    }
  )

  // Lanari USSD push initiation (pending/auto)
  const lanariMutation = useMutation(
    (payload: {
      allocation_id: number
      seller_id: number
      amount: number
      customer_phone: string
      payment_period_start?: string
      payment_period_end?: string
      notes?: string
    }) => paymentService.lanariProcess(payload),
    {
      onSuccess: async (res) => {
        queryClient.invalidateQueries(['seller-payments', sellerId])
        queryClient.invalidateQueries('payments')

        const apiSuccess = res?.success !== undefined ? res.success : true
        const status = res?.data?.status || res?.status
        const ussdCode = res?.data?.ussd_code || res?.data?.ussd || res?.ussd_code || res?.ussd

        if (!apiSuccess) {
          const msg = res?.message || 'Failed to initiate mobile money payment'
          toast.error(msg)
          // Keep modal open so user can retry or change method
          return
        }
        if (status === 'completed') {
          try {
            const alloc = activeAllocations.find((a: any) => a.allocation_id === paymentForm.allocation_id)
            if (alloc) {
              const newEnd = computeNextPeriodEnd(alloc)
              await allocationService.update(alloc.allocation_id, { end_date: format(newEnd, 'yyyy-MM-dd') })
              queryClient.invalidateQueries(['seller-allocations', sellerId])
              toast.success(`Payment completed and period extended to ${format(newEnd, 'MMM dd, yyyy')}`)
            }
          } catch {
            toast.success('Payment completed. Failed to extend period automatically.')
          }
        } else {
          if (ussdCode) {
            toast.success(`Payment initiated. Dial ${ussdCode} on your phone to complete the payment.`)
          } else {
            toast.success('Payment initiated. Please approve the USSD prompt on your phone. Status: pending')
          }
        }

        setIsPaymentModalOpen(false)
        setPaymentForm({
          allocation_id: 0,
          amount: 0,
          payment_method: 'mobile_money',
          payment_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'completed',
        })
      },
      onError: (err: any) => {
        const status = err?.response?.status
        const serverMsg = err?.response?.data?.message || err?.message || ''
        if (status === 401 && /api key.*secret required/i.test(serverMsg)) {
          toast.error('Mobile money is not configured. Please contact the administrator or use another payment method.')
        } else {
          toast.error(`Failed to initiate mobile money payment: ${serverMsg}`)
        }
        // Keep modal open for retry/change
      },
    }
  )

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

  const prevUnreadRef = useRef(0)
  const { data: notificationsData } = useQuery(
    'seller-notifications',
    () => notificationService.getUserNotifications(),
    {
      enabled: !!userId,
      retry: false,
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
      staleTime: 0,
      onSuccess: (res: any) => {
        const items = res?.data || res || []
        const unread = items.filter((n: any) => !n.is_read).length
        if (unread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
          toast.success('You have new notifications from management')
        }
        prevUnreadRef.current = unread
      },
      onError: () => {},
    }
  )

  const markDashboardNotificationAsRead = useMutation(
    (id: number) => notificationService.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('seller-notifications')
      },
    }
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

  const monthlySeries = Object.entries(monthlyPayments)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, amount]: [string, any]) => Number(amount) || 0)
  const sparkW = 160
  const sparkH = 48
  const maxVal = Math.max(1, ...monthlySeries)
  const stepX = monthlySeries.length > 1 ? sparkW / (monthlySeries.length - 1) : 0
  const points = monthlySeries.map((v, i) => {
    const x = i * stepX
    const y = sparkH - (v / maxVal) * sparkH
    return `${x},${y}`
  }).join(' ')

  const monthlyChartData = Object.entries(monthlyPayments)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]: [string, any]) => ({
      month: format(new Date(month + '-01'), 'MMM yy'),
      value: Number(amount) || 0,
    }))

  // Get upcoming payment due dates (for active allocations)
  const computeSuggestedAmount = (space: any, allocation: any) => {
    const type = (allocation?.allocation_type || '').toLowerCase()
    if (type.includes('week')) {
      return Number(space?.weekly_rate ?? (space?.daily_rate ? Number(space.daily_rate) * 7 : 0)) || 0
    }
    if (type.includes('day')) {
      return Number(space?.daily_rate ?? 0) || 0
    }
    // default monthly
    return Number(space?.monthly_rate ?? (space?.daily_rate ? Number(space.daily_rate) * 30 : 0)) || 0
  }

  const computeNextPeriodEnd = (allocation: any) => {
    const type = (allocation?.allocation_type || '').toLowerCase()
    const base = allocation?.end_date ? parseISO(allocation.end_date) : new Date()
    if (type.includes('week')) return addDays(base, 7)
    if (type.includes('day')) return addDays(base, 1)
    return addMonths(base, 1)
  }

  const upcomingPayments = activeAllocations.map((allocation: any) => {
    const space = spaceMap.get(allocation.space_id)
    const suggested = computeSuggestedAmount(space, allocation)
    return {
      allocation,
      space,
      amount: Number(suggested) || 0,
      nextDueDate: allocation.end_date ? parseISO(allocation.end_date) : null,
    }
  }).filter((p: any) => p.nextDueDate && isAfter(p.nextDueDate, new Date()))
    .sort((a: any, b: any) => a.nextDueDate - b.nextDueDate)
    .slice(0, 3)

  // Get verification status
  const verificationStatus = profileObj?.verification_status || 'pending'
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

  if (userProfileLoading || allocationsLoading || paymentsLoading) {
    return (
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-36 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded mt-3 animate-pulse" />
                </div>
                <div className="p-3 rounded-lg bg-gray-100 animate-pulse w-10 h-10" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 card">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container space-y-8">
      {/* Header with Profile Info */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profileObj?.full_name || user?.username || 'Seller'}!
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Make Payment</span>
          </button>
          <Link to="/profile" className="btn-secondary flex items-center space-x-2">
            <User size={18} />
            <span>Edit Profile</span>
          </Link>
        </div>
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
              <p className="text-2xl font-bold text-green-600">${Number(sellerStats.data?.total_paid ?? totalPaid).toFixed(2)}</p>
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
                const monthlyRate = Number(space?.monthly_rate ?? (space?.daily_rate ? Number(space.daily_rate) * 30 : 0)) || 0
                const daysRemaining = allocation.end_date 
                  ? differenceInDays(parseISO(allocation.end_date), new Date())
                  : null
                const totalDays = allocation.end_date && allocation.start_date
                  ? Math.max(1, differenceInDays(parseISO(allocation.end_date), parseISO(allocation.start_date)))
                  : null
                const elapsedDays = allocation.start_date
                  ? Math.max(0, differenceInDays(new Date(), parseISO(allocation.start_date)))
                  : null
                const progress = totalDays !== null && elapsedDays !== null
                  ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)))
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
                        <p className="font-medium text-gray-900">${Number(monthlyRate).toFixed(2)}</p>
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
                          {progress !== null && (
                            <div className="mt-2">
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden" aria-label="Allocation period progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                                <div className="h-2 bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{progress}% of current period elapsed</p>
                            </div>
                          )}
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
                {profileObj?.business_name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Business Type</p>
              <p className="font-medium text-gray-900">
                {profileObj?.business_type || 'N/A'}
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
                {profileObj?.registration_date 
                  ? format(new Date(profileObj.registration_date), 'MMM dd, yyyy')
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
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
              <Link to="/my-payments" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1">
                <span>View All</span>
                <LinkIcon size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={paymentsSearch}
                onChange={(e) => setPaymentsSearch(e.target.value)}
                className="input"
                placeholder="Search amount, method or date"
                aria-label="Search payments"
              />
              <select
                value={paymentsStatus}
                onChange={(e) => setPaymentsStatus(e.target.value as any)}
                className="input"
                aria-label="Filter payments by status"
              >
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <div className="hidden sm:flex items-center justify-end">
                <svg width={sparkW} height={sparkH} viewBox={`0 0 ${sparkW} ${sparkH}`} aria-label="Payments trend">
                  <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
                </svg>
              </div>
            </div>
          </div>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments
                .filter((p: any) => {
                  const q = paymentsSearch.toLowerCase()
                  const matchesText = !q ||
                    String(p.amount).toLowerCase().includes(q) ||
                    (p.payment_method || '').toLowerCase().includes(q) ||
                    (p.payment_date ? format(new Date(p.payment_date), 'MMM dd, yyyy').toLowerCase().includes(q) : false)
                  const matchesStatus = paymentsStatus === 'all' || p.status === paymentsStatus
                  return matchesText && matchesStatus
                })
                .slice(0, 5)
                .map((payment: any) => (
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
              <p className="text-gray-500">No payment history yet</p>
              <button
                className="btn-primary mt-3"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                Make your first payment
              </button>
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Notifications</h2>
              <Link to="/my-notifications" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1">
                <span>View All</span>
                <LinkIcon size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={notificationsSearch}
                onChange={(e) => setNotificationsSearch(e.target.value)}
                className="input"
                placeholder="Search title or message"
                aria-label="Search notifications"
              />
              <select
                value={notificationsType}
                onChange={(e) => setNotificationsType(e.target.value as any)}
                className="input"
                aria-label="Filter notifications by type"
              >
                <option value="all">All types</option>
                <option value="payment">Payment</option>
                <option value="allocation">Allocation</option>
                <option value="verification">Verification</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications
                .filter((n: any) => {
                  const q = notificationsSearch.toLowerCase()
                  const matchesText = !q ||
                    (n.title || '').toLowerCase().includes(q) ||
                    (n.message || '').toLowerCase().includes(q)
                  const type = (n.notification_type || 'system').toLowerCase()
                  const matchesType = notificationsType === 'all' || type === notificationsType
                  return matchesText && matchesType
                })
                .slice(0, 5)
                .map((notification: any) => {
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
                      onClick={() => {
                        if (isUnread && notification.notification_id) {
                          markDashboardNotificationAsRead.mutate(notification.notification_id)
                        }
                      }}
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
              <p className="text-gray-500">No notifications yet</p>
              <Link to="/profile" className="btn-secondary mt-3">
                Check your profile settings
              </Link>
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
                <p className="text-lg font-bold text-gray-900 mt-1">${Number(payment.amount).toFixed(2)}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Due: {format(payment.nextDueDate, 'MMM dd, yyyy')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {differenceInDays(payment.nextDueDate, new Date())} days remaining
                </p>
                <div className="mt-3">
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => {
                      setPaymentForm({
                        allocation_id: payment.allocation.allocation_id,
                        amount: Number(payment.amount) || 0,
                        payment_method: 'mobile_money',
                        payment_date: format(new Date(), 'yyyy-MM-dd'),
                        status: 'completed',
                      })
                      setIsPaymentModalOpen(true)
                    }}
                  >
                    Pay Now
                  </button>
                </div>
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
              <div className="w-full" style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="colorPay" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Total']} labelClassName="text-gray-700" />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorPay)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
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
          <Link to="/my-spaces" aria-label="Go to My Spaces" className="tile">
            <Square className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">My Spaces</span>
          </Link>
          <Link to="/my-payments" aria-label="Go to Payments" className="tile">
            <CreditCard className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Payments</span>
          </Link>
          <Link to="/my-notifications" aria-label="Go to Notifications" className="tile">
            <Bell className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Notifications</span>
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            )}
          </Link>
          <Link to="/profile" aria-label="Go to Profile" className="tile">
            <User className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Profile</span>
          </Link>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Make a Payment</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const amountValue = Number(paymentForm.amount) || 0

                if (paymentForm.payment_method === 'mobile_money' && amountValue < 100) {
                  toast.error('Minimum mobile money payment is 100 .')
                  return
                }

                if (paymentForm.payment_method === 'mobile_money' && paymentForm.mobile_money_number) {
                  const alloc = activeAllocations.find(
                    (a: any) => a.allocation_id === paymentForm.allocation_id
                  )
                  const baseStart = alloc?.end_date
                    ? parseISO(alloc.end_date)
                    : paymentForm.payment_date
                    ? parseISO(paymentForm.payment_date as string)
                    : new Date()
                  const periodStart = format(baseStart, 'yyyy-MM-dd')
                  const nextEnd = alloc ? computeNextPeriodEnd(alloc) : addMonths(baseStart, 1)
                  const periodEnd = format(nextEnd, 'yyyy-MM-dd')

                  lanariMutation.mutate({
                    allocation_id: paymentForm.allocation_id!,
                    seller_id: sellerId!,
                    amount: amountValue,
                    customer_phone: paymentForm.mobile_money_number,
                    payment_period_start: periodStart,
                    payment_period_end: periodEnd,
                    notes: paymentForm.notes,
                  })
                } else {
                  createPaymentMutation.mutate({ ...(paymentForm as Payment), seller_id: sellerId! })
                }
              }}
              className="space-y-4"
            >
              {/* Recommendation */}
              {!!paymentForm.allocation_id && (
                <div className="p-3 rounded bg-gray-50 border border-gray-200 text-sm">
                  {(() => {
                    const alloc = activeAllocations.find((a: any) => a.allocation_id === paymentForm.allocation_id)
                    const space = alloc ? spaceMap.get(alloc.space_id) : null
                    const suggested = alloc && space ? computeSuggestedAmount(space, alloc) : 0
                    const nextEnd = alloc ? computeNextPeriodEnd(alloc) : null
                    return (
                      <div className="flex flex-col gap-1">
                        <span>
                          Suggested amount: <strong>${Number(suggested).toFixed(2)}</strong>
                        </span>
                        {nextEnd && (
                          <span>
                            New period ends on: <strong>{format(nextEnd, 'MMM dd, yyyy')}</strong>
                          </span>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Allocation *</label>
                  <select
                    value={paymentForm.allocation_id || 0}
                    onChange={(e) => setPaymentForm({ ...paymentForm, allocation_id: parseInt(e.target.value) })}
                    className="input"
                    required
                  >
                    <option value={0}>Select Allocation</option>
                    {activeAllocations.map((a: any) => (
                      <option key={a.allocation_id} value={a.allocation_id}>
                        Allocation #{a.allocation_id} - Space {a.space_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Payment Method *</label>
                  <select
                    value={paymentForm.payment_method as any}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as any })}
                    className="input"
                    required
                  >
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                {paymentForm.payment_method === 'mobile_money' && (
                  <>
                    <div>
                      <label className="label">Mobile Money Number *</label>
                      <input
                        type="tel"
                        value={paymentForm.mobile_money_number || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, mobile_money_number: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Provider</label>
                      <select
                        value={paymentForm.mobile_money_provider || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, mobile_money_provider: e.target.value })}
                        className="input"
                      >
                        <option value="">Select Provider</option>
                        <option value="mtn">MTN</option>
                        <option value="airtel">Airtel</option>
                        <option value="orange">Orange</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="label">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date as string}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Reference</label>
                  <input
                    type="text"
                    value={paymentForm.payment_reference || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                    className="input"
                    placeholder="Transaction reference"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Notes</label>
                  <textarea
                    value={paymentForm.notes || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="input"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  aria-label="Cancel payment"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  aria-label="Submit payment"
                  disabled={createPaymentMutation.isLoading || lanariMutation.isLoading}
                  className="btn-primary"
                >
                  {createPaymentMutation.isLoading || lanariMutation.isLoading ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerDashboard


