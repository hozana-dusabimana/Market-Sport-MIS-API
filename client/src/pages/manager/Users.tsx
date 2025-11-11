import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { userService, User } from '../../services/userService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { sellerService } from '../../services/sellerService'
import { allocationService, Allocation } from '../../services/allocationService'
import { zoneService, Zone } from '../../services/zoneService'
import { spaceService, Space } from '../../services/spaceService'
import { paymentService, Payment } from '../../services/paymentService'
import { notificationService, Notification } from '../../services/notificationService'
import { reportService } from '../../services/reportService'
import { authService } from '../../services/authService'
import { Search, Eye, Plus, Users, MapPin, Square, CreditCard, FileText, Bell, Calendar } from 'lucide-react'
import { format, subDays, subMonths, startOfWeek } from 'date-fns'

const ManagerUsersPage = () => {
  const { user: currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'sellers' | 'allocations' | 'zones' | 'spaces' | 'payments' | 'reports' | 'notifications'>('sellers')
  
  // Sellers tab state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  
  // Allocations tab state
  const [showAllocationModal, setShowAllocationModal] = useState(false)
  const [allocationFormData, setAllocationFormData] = useState<Partial<Allocation>>({
    seller_id: 0,
    space_id: 0,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    allocation_type: 'monthly',
    status: 'active',
  })
  
  // Zones tab state
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [zoneFormData, setZoneFormData] = useState<Partial<Zone>>({
    zone_name: '',
    zone_code: '',
    description: '',
    manager_id: currentUser?.userId,
    total_spaces: 0,
    status: 'active',
  })
  
  // Spaces tab state
  const [showSpaceModal, setShowSpaceModal] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [spaceFormData, setSpaceFormData] = useState<Partial<Space>>({
    zone_id: 0,
    space_number: '',
    space_type: 'stall',
    monthly_rate: 0,
    status: 'available',
  })
  
  // Payments tab state
  const [paymentSellerFilter, setPaymentSellerFilter] = useState<string>('all')
  const [paymentDateFrom, setPaymentDateFrom] = useState<string>(format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [paymentDateTo, setPaymentDateTo] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  
  // Reports tab state
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weekStart, setWeekStart] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'))
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  
  // Notifications tab state
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationFormData, setNotificationFormData] = useState<Partial<Notification>>({
    seller_id: undefined,
    title: '',
    message: '',
    notification_type: 'system',
  })
  
  const managedZoneIds = currentUser?.profile?.assigned_zones || []
  
  // Create user form schema - managers can only create sellers
  const createUserSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone_number: z.string().min(1, 'Phone number is required'),
    user_type: z.enum(['seller']),
    full_name: z.string().optional(),
    id_number: z.string().optional(),
    business_name: z.string().optional(),
    business_type: z.string().optional(),
    tin_number: z.string().optional(),
    emergency_contact: z.string().optional(),
    address: z.string().optional(),
    registration_date: z.string().optional(),
  })
  type CreateUserFormData = z.infer<typeof createUserSchema>

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  })

  const createUserMutation = useMutation(
    async (data: CreateUserFormData) => {
      // Use authService.register for creating sellers
      const registerData = {
        username: data.username,
        email: data.email,
        password: data.password,
        phone_number: data.phone_number,
        user_type: 'seller' as const,
        full_name: data.full_name || data.username,
        id_number: data.id_number || '',
        business_name: data.business_name,
        business_type: data.business_type,
        tin_number: data.tin_number,
        emergency_contact: data.emergency_contact,
        address: data.address,
        registration_date: data.registration_date || new Date().toISOString().split('T')[0],
      }
      return await authService.register(registerData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('manager-users')
        toast.success('Seller created successfully')
        setShowCreate(false)
        resetCreateForm()
      },
      onError: (error: unknown) => {
        const message = 
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        toast.error(message || 'Failed to create seller')
      },
    }
  )

  const onCreateUser = (data: CreateUserFormData) => {
    createUserMutation.mutate(data)
  }

  const queryClient = useQueryClient()

  // Sellers queries
  const { data: sellersData, isLoading: sellersLoading } = useQuery(
    ['manager-sellers', searchTerm],
    async () => {
      const result = await sellerService.getAll({
        search: searchTerm || undefined,
      })
      return result?.data?.sellers || result?.data || []
    },
    { retry: false, onError: () => {} }
  )
  const sellers = sellersData || []

  // Allocations queries
  const { data: allocationsData } = useQuery(
    ['allocations', managedZoneIds],
    () => allocationService.getAll(),
    { retry: false, onError: () => {} }
  )
  const { data: availableSpacesData } = useQuery(
    ['available-spaces', managedZoneIds],
    () => spaceService.getAvailable(),
    { retry: false, onError: () => {} }
  )
  const { data: sellersForAllocation } = useQuery(
    ['sellers-for-allocation'],
    () => sellerService.getAll(),
    { retry: false, onError: () => {} }
  )
  
  const allAllocationsData = allocationsData?.data || []
  const allSpaces = availableSpacesData?.data || []
  const allSellersForAllocation = sellersForAllocation?.data?.sellers || sellersForAllocation?.data || []
  
  // Filter by managed zones
  const managedSpaces = managedZoneIds.length > 0
    ? allSpaces.filter((s: any) => managedZoneIds.includes(s.zone_id))
    : allSpaces
  const managedSpaceIds = managedSpaces.map((s: any) => s.space_id)
  const filteredAllocations = managedZoneIds.length > 0
    ? allAllocationsData.filter((a: Allocation) => managedSpaceIds.includes(a.space_id))
    : allAllocationsData

  // Zones queries
  const { data: zonesData } = useQuery(
    ['zones', currentUser?.userId],
    () => zoneService.getAll({ manager_id: currentUser?.userId }),
    { retry: false, onError: () => {} }
  )
  const allZones = zonesData?.data || []
  const zones = managedZoneIds.length > 0
    ? allZones.filter((z: Zone) => managedZoneIds.includes(z.zone_id!))
    : allZones

  // Spaces queries
  const { data: spacesData } = useQuery(
    ['spaces', managedZoneIds],
    () => spaceService.getAll(),
    { retry: false, onError: () => {} }
  )
  const allSpacesList = spacesData?.data || []
  const spaces = managedZoneIds.length > 0
    ? allSpacesList.filter((s: Space) => managedZoneIds.includes(s.zone_id))
    : allSpacesList

  // Payments queries
  const { data: paymentsData } = useQuery(
    ['payments', paymentSellerFilter, paymentDateFrom, paymentDateTo, managedZoneIds],
    () => paymentService.getAll({
      seller_id: paymentSellerFilter !== 'all' ? parseInt(paymentSellerFilter) : undefined,
      date_from: paymentDateFrom,
      date_to: paymentDateTo,
    }),
    { retry: false, onError: () => {} }
  )
  const { data: allocationsForPayments } = useQuery(
    ['allocations-for-payments', managedZoneIds],
    () => allocationService.getAll(),
    { retry: false, onError: () => {} }
  )
  const { data: spacesForPayments } = useQuery(
    ['spaces-for-payments', managedZoneIds],
    () => spaceService.getAll(),
    { retry: false, onError: () => {} }
  )
  
  const allPaymentsData = paymentsData?.data || []
  const allAllocationsForPayments = allocationsForPayments?.data || []
  const allSpacesForPayments = spacesForPayments?.data || []
  
  const managedSpacesForPayments = managedZoneIds.length > 0
    ? allSpacesForPayments.filter((s: any) => managedZoneIds.includes(s.zone_id))
    : allSpacesForPayments
  const managedSpaceIdsForPayments = managedSpacesForPayments.map((s: any) => s.space_id)
  const managedAllocationsForPayments = managedZoneIds.length > 0
    ? allAllocationsForPayments.filter((a: any) => managedSpaceIdsForPayments.includes(a.space_id))
    : allAllocationsForPayments
  const managedAllocationIdsForPayments = managedAllocationsForPayments.map((a: any) => a.allocation_id)
  const filteredPayments = managedZoneIds.length > 0
    ? allPaymentsData.filter((p: Payment) => managedAllocationIdsForPayments.includes(p.allocation_id))
    : allPaymentsData

  // Reports queries
  const { data: dailyReport } = useQuery(
    ['daily-report', reportDate],
    () => reportService.getDailyReport(reportDate),
    { enabled: reportType === 'daily', retry: false, onError: () => {} }
  )
  const { data: weeklyReport } = useQuery(
    ['weekly-report', weekStart],
    () => reportService.getWeeklyReport(weekStart),
    { enabled: reportType === 'weekly', retry: false, onError: () => {} }
  )
  const { data: monthlyReport } = useQuery(
    ['monthly-report', month],
    () => {
      const [year, monthNum] = month.split('-')
      return reportService.getMonthlyReport(monthNum, year)
    },
    { enabled: reportType === 'monthly', retry: false, onError: () => {} }
  )
  const { data: occupancyReport } = useQuery(
    ['occupancy-report'],
    () => reportService.getOccupancyReport(
      format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      format(new Date(), 'yyyy-MM-dd')
    ),
    { retry: false, onError: () => {} }
  )
  const { data: paymentReport } = useQuery(
    ['payment-report'],
    () => reportService.getPaymentReport(
      format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      format(new Date(), 'yyyy-MM-dd')
    ),
    { retry: false, onError: () => {} }
  )

  // Notifications queries
  const { data: notificationsData } = useQuery(
    ['notifications'],
    () => notificationService.getAll(),
    { retry: false, onError: () => {} }
  )
  const notifications = notificationsData?.data || []

  const handleViewDetails = async (user: User) => {
    try {
      const response = await userService.getById(user.user_id!)
      if (response.success) {
        setSelectedUser(response.data)
        setShowDetails(true)
      }
    } catch (error: unknown) {
      toast.error('Failed to load user details')
    }
  }

  // Seller-specific data when viewing details
  const sellerId = selectedUser?.user_id
  const start_date = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd')
  const end_date = format(new Date(), 'yyyy-MM-dd')

  const { data: sellerAllocations } = useQuery([
    'seller-allocations',
    sellerId,
  ], () => sellerService.getAllocations(sellerId!), {
    enabled: !!sellerId && selectedUser?.user_type === 'seller' && showDetails,
  })

  const { data: sellerPayments } = useQuery([
    'seller-payments',
    sellerId,
  ], () => sellerService.getPayments(sellerId!, { start_date, end_date }), {
    enabled: !!sellerId && selectedUser?.user_type === 'seller' && showDetails,
  })

  // Edit user form schema
  const editUserSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email'),
    phone_number: z.string().min(1, 'Phone number is required'),
  })
  type EditUserFormData = z.infer<typeof editUserSchema>

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEditForm } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  })

  // Edit user modal state
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    if (selectedUser) {
      resetEditForm({
        username: selectedUser.username,
        email: selectedUser.email,
        phone_number: selectedUser.phone_number,
      })
    }
  }, [selectedUser, resetEditForm])

  const editUserMutation = useMutation(
    ({ id, data }: { id: number; data: EditUserFormData }) =>
      userService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('manager-users')
        toast.success('Seller updated successfully')
        setShowEdit(false)
        setShowDetails(false)
      },
      onError: (error: unknown) => {
        const message = 
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        toast.error(message || 'Failed to update seller')
      },
    }
  )

  const deleteUserMutation = useMutation((id: number) => userService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('manager-users')
      toast.success('Seller deleted successfully')
    },
    onError: (error: unknown) => {
      const message = 
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message || 'Failed to delete seller')
    },
  })

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.user_id!)
    }
  }

  const onEditUser = (formData: EditUserFormData) => {
    if (!selectedUser) return
    editUserMutation.mutate({ id: selectedUser.user_id!, data: formData })
  }

  // Allocations mutations
  const createAllocationMutation = useMutation(
    (allocation: Allocation) => allocationService.create(allocation),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allocations')
        queryClient.invalidateQueries('spaces')
        toast.success('Allocation created successfully')
        setShowAllocationModal(false)
        setAllocationFormData({
          seller_id: 0,
          space_id: 0,
          start_date: format(new Date(), 'yyyy-MM-dd'),
          end_date: '',
          allocation_type: 'monthly',
          status: 'active',
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create allocation')
      },
    }
  )

  // Zones mutations
  const createZoneMutation = useMutation(
    (zone: Zone) => zoneService.create(zone),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('zones')
        toast.success('Zone created successfully')
        setShowZoneModal(false)
        setZoneFormData({
          zone_name: '',
          zone_code: '',
          description: '',
          manager_id: currentUser?.userId,
          total_spaces: 0,
          status: 'active',
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create zone')
      },
    }
  )

  // Spaces mutations
  const createSpaceMutation = useMutation(
    (space: Space) => spaceService.create(space),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('spaces')
        toast.success('Space created successfully')
        setShowSpaceModal(false)
        setSpaceFormData({
          zone_id: 0,
          space_number: '',
          space_type: 'stall',
          monthly_rate: 0,
          status: 'available',
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create space')
      },
    }
  )

  // Notifications mutations
  const createNotificationMutation = useMutation(
    (notification: Notification) => notificationService.create(notification),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('Notification sent successfully')
        setShowNotificationModal(false)
        setNotificationFormData({
          seller_id: undefined,
          title: '',
          message: '',
          notification_type: 'system',
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to send notification')
      },
    }
  )

  // Handler functions
  const handleCreateAllocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocationFormData.seller_id || !allocationFormData.space_id) {
      toast.error('Please select both seller and space')
      return
    }
    if (managedZoneIds.length > 0) {
      const selectedSpace = managedSpaces.find((s: any) => s.space_id === allocationFormData.space_id)
      if (selectedSpace && !managedZoneIds.includes(selectedSpace.zone_id)) {
        toast.error('You can only create allocations for spaces in your managed zones')
        return
      }
    }
    createAllocationMutation.mutate(allocationFormData as Allocation)
  }

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!zoneFormData.zone_name || !zoneFormData.zone_code) {
      toast.error('Zone name and code are required')
      return
    }
    createZoneMutation.mutate(zoneFormData as Zone)
  }

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault()
    if (!spaceFormData.zone_id || !spaceFormData.space_number) {
      toast.error('Zone and space number are required')
      return
    }
    if (managedZoneIds.length > 0 && !managedZoneIds.includes(spaceFormData.zone_id)) {
      toast.error('You can only create spaces in your managed zones')
      return
    }
    createSpaceMutation.mutate(spaceFormData as Space)
  }

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault()
    if (!notificationFormData.title || !notificationFormData.message) {
      toast.error('Title and message are required')
      return
    }
    createNotificationMutation.mutate(notificationFormData as Notification)
  }

  const handleExportReport = async (type: string) => {
    try {
      const params =
        reportType === 'daily'
          ? { date: reportDate }
          : reportType === 'weekly'
          ? { week_start: weekStart }
          : { month: month.split('-')[1], year: month.split('-')[0] }

      const blob = await reportService.exportReport(type, params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${Date.now()}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    }
  }

  if (sellersLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Management Hub</h1>
      </div>

      {/* Tab Navigation */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sellers')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'sellers'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users size={18} />
              <span>Sellers</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'allocations'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar size={18} />
              <span>Allocations</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'zones'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MapPin size={18} />
              <span>Zones</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('spaces')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'spaces'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Square size={18} />
              <span>Spaces</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'payments'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CreditCard size={18} />
              <span>Payments</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'reports'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText size={18} />
              <span>Reports</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Bell size={18} />
              <span>Notifications</span>
            </div>
          </button>
        </div>
      </div>
      
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create Seller</h2>
              <button
                onClick={() => {
                  setShowCreate(false)
                  resetCreateForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit(onCreateUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Username *</label>
                  <input type="text" {...registerCreate('username')} className="input" />
                  {createErrors.username && <p className="text-xs text-red-600">{createErrors.username.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email *</label>
                  <input type="email" {...registerCreate('email')} className="input" />
                  {createErrors.email && <p className="text-xs text-red-600">{createErrors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Password *</label>
                  <input type="password" {...registerCreate('password')} className="input" />
                  {createErrors.password && <p className="text-xs text-red-600">{createErrors.password.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number *</label>
                  <input type="text" {...registerCreate('phone_number')} className="input" />
                  {createErrors.phone_number && <p className="text-xs text-red-600">{createErrors.phone_number.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Name</label>
                  <input type="text" {...registerCreate('business_name')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Type</label>
                  <input type="text" {...registerCreate('business_type')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">TIN Number</label>
                  <input type="text" {...registerCreate('tin_number')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                  <input type="text" {...registerCreate('emergency_contact')} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <input type="text" {...registerCreate('address')} className="input" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full mt-4" disabled={createUserMutation.isLoading}>
                {createUserMutation.isLoading ? 'Creating...' : 'Create Seller'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEdit && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Seller</h2>
              <button
                onClick={() => {
                  setShowEdit(false)
                  setSelectedUser(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit(onEditUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <input type="text" {...registerEdit('username')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <input type="email" {...registerEdit('email')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <input type="text" {...registerEdit('phone_number')} className="input" />
                </div>
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => { setShowEdit(false); setSelectedUser(null); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editUserMutation.isLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'sellers' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sellers</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Create Seller</span>
            </button>
          </div>

          <div className="card mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search sellers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Full Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Business Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller: any) => (
                    <tr key={seller.seller_id || seller.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{seller.full_name || 'N/A'}</td>
                      <td className="py-3 px-4">{seller.business_name || 'N/A'}</td>
                      <td className="py-3 px-4">{seller.email || 'N/A'}</td>
                      <td className="py-3 px-4">{seller.phone_number || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          seller.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                          seller.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {seller.verification_status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const user: User = {
                                user_id: seller.user_id,
                                username: seller.username || '',
                                email: seller.email || '',
                                phone_number: seller.phone_number || '',
                                user_type: 'seller',
                                status: 'active',
                              }
                              handleViewDetails(user)
                            }}
                            className="text-primary-600 hover:text-primary-700"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!sellers.length && (
                <div className="text-center py-8 text-gray-500">No sellers found</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'allocations' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Allocations</h2>
            <button
              onClick={() => setShowAllocationModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Allocate Seller</span>
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Space</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.map((allocation: any) => (
                    <tr key={allocation.allocation_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{allocation.seller_name || allocation.seller?.full_name || 'N/A'}</td>
                      <td className="py-3 px-4">{allocation.space_number || allocation.space?.space_number || 'N/A'}</td>
                      <td className="py-3 px-4">{allocation.zone_name || allocation.space?.zone_name || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {allocation.start_date ? format(new Date(allocation.start_date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        {allocation.end_date ? format(new Date(allocation.end_date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">{allocation.allocation_type || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          allocation.status === 'active' ? 'bg-green-100 text-green-800' :
                          allocation.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {allocation.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredAllocations.length && (
                <div className="text-center py-8 text-gray-500">No allocations found</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'zones' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Zones</h2>
            <button
              onClick={() => {
                setZoneFormData({
                  zone_name: '',
                  zone_code: '',
                  description: '',
                  manager_id: currentUser?.userId,
                  total_spaces: 0,
                  status: 'active',
                })
                setEditingZone(null)
                setShowZoneModal(true)
              }}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Create Zone</span>
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Spaces</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Occupied</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone: Zone) => (
                    <tr key={zone.zone_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{zone.zone_name}</td>
                      <td className="py-3 px-4">{zone.zone_code}</td>
                      <td className="py-3 px-4">{zone.total_spaces || 0}</td>
                      <td className="py-3 px-4">{(zone as any).occupied_spaces ?? (zone as any).occupied ?? 0}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          zone.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {zone.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!zones.length && (
                <div className="text-center py-8 text-gray-500">No zones found</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'spaces' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Spaces</h2>
            <button
              onClick={() => {
                setSpaceFormData({
                  zone_id: 0,
                  space_number: '',
                  space_type: 'stall',
                  monthly_rate: 0,
                  status: 'available',
                })
                setEditingSpace(null)
                setShowSpaceModal(true)
              }}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Create Space</span>
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Space Number</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Monthly Rate</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {spaces.map((space: any) => (
                    <tr key={space.space_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{space.space_number || space.space_code}</td>
                      <td className="py-3 px-4">{space.zone_name || space.zone?.zone_name || 'N/A'}</td>
                      <td className="py-3 px-4">{space.space_type || 'N/A'}</td>
                      <td className="py-3 px-4">${space.monthly_rate || 0}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          space.status === 'available' ? 'bg-green-100 text-green-800' :
                          space.status === 'occupied' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {space.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!spaces.length && (
                <div className="text-center py-8 text-gray-500">No spaces found</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'payments' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Payments by Sellers</h2>
          </div>

          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Seller</label>
                <select
                  value={paymentSellerFilter}
                  onChange={(e) => setPaymentSellerFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Sellers</option>
                  {sellers.map((seller: any) => (
                    <option key={seller.seller_id || seller.user_id} value={seller.seller_id || seller.user_id}>
                      {seller.full_name || seller.business_name || seller.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">From Date</label>
                <input
                  type="date"
                  value={paymentDateFrom}
                  onChange={(e) => setPaymentDateFrom(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">To Date</label>
                <input
                  type="date"
                  value={paymentDateTo}
                  onChange={(e) => setPaymentDateTo(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment: any) => (
                    <tr key={payment.payment_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{payment.seller_name || payment.seller?.full_name || 'N/A'}</td>
                      <td className="py-3 px-4 font-medium">${payment.amount || 0}</td>
                      <td className="py-3 px-4">{payment.payment_method || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredPayments.length && (
                <div className="text-center py-8 text-gray-500">No payments found</div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Reports</h2>
            <div className="flex space-x-2">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="input w-auto"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button
                onClick={() => handleExportReport(reportType)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <FileText size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportType === 'daily' && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="input"
                  />
                </div>
              )}
              {reportType === 'weekly' && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Week Start</label>
                  <input
                    type="date"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                    className="input"
                  />
                </div>
              )}
              {reportType === 'monthly' && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Month</label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="input"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Occupancy Report</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Occupied Spaces:</span>
                  <span className="font-medium">{occupancyReport?.data?.occupied || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Spaces:</span>
                  <span className="font-medium">{occupancyReport?.data?.available || 0}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Payment Report</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Payments:</span>
                  <span className="font-medium">{paymentReport?.data?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Revenue:</span>
                  <span className="font-medium">
                    ${paymentReport?.data?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'notifications' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <button
              onClick={() => setShowNotificationModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Send Notification</span>
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Message</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification: Notification) => (
                    <tr key={notification.notification_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{notification.title}</td>
                      <td className="py-3 px-4">{notification.message?.substring(0, 50)}...</td>
                      <td className="py-3 px-4">{notification.notification_type || 'system'}</td>
                      <td className="py-3 px-4">
                        {notification.created_at ? format(new Date(notification.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          notification.status === 'read' || notification.is_read ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.status === 'read' || notification.is_read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!notifications.length && (
                <div className="text-center py-8 text-gray-500">No notifications found</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Allocate Seller to Space</h2>
              <button onClick={() => setShowAllocationModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleCreateAllocation} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Seller *</label>
                <select
                  value={allocationFormData.seller_id || 0}
                  onChange={(e) => setAllocationFormData({ ...allocationFormData, seller_id: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  <option value={0}>Select Seller</option>
                  {allSellersForAllocation.map((seller: any) => (
                    <option key={seller.seller_id || seller.user_id} value={seller.seller_id || seller.user_id}>
                      {seller.full_name || seller.business_name || seller.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Space *</label>
                <select
                  value={allocationFormData.space_id || 0}
                  onChange={(e) => setAllocationFormData({ ...allocationFormData, space_id: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  <option value={0}>Select Space</option>
                  {managedSpaces.map((space: any) => (
                    <option key={space.space_id} value={space.space_id}>
                      {space.space_number || space.space_code} - {space.zone_name} (${space.monthly_rate}/month)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date *</label>
                  <input
                    type="date"
                    value={allocationFormData.start_date}
                    onChange={(e) => setAllocationFormData({ ...allocationFormData, start_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <input
                    type="date"
                    value={allocationFormData.end_date}
                    onChange={(e) => setAllocationFormData({ ...allocationFormData, end_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Allocation Type *</label>
                <select
                  value={allocationFormData.allocation_type}
                  onChange={(e) => setAllocationFormData({ ...allocationFormData, allocation_type: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowAllocationModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createAllocationMutation.isLoading}>
                  {createAllocationMutation.isLoading ? 'Creating...' : 'Create Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create Zone</h2>
              <button onClick={() => setShowZoneModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Zone Name *</label>
                  <input
                    type="text"
                    value={zoneFormData.zone_name}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, zone_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Zone Code *</label>
                  <input
                    type="text"
                    value={zoneFormData.zone_code}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, zone_code: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <textarea
                  value={zoneFormData.description}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Location</label>
                <input
                  type="text"
                  value={zoneFormData.location}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, location: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Total Spaces</label>
                <input
                  type="number"
                  value={zoneFormData.total_spaces}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, total_spaces: parseInt(e.target.value) || 0 })}
                  className="input"
                  min="0"
                />
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowZoneModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createZoneMutation.isLoading}>
                  {createZoneMutation.isLoading ? 'Creating...' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Space Modal */}
      {showSpaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create Space</h2>
              <button onClick={() => setShowSpaceModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Zone *</label>
                <select
                  value={spaceFormData.zone_id || 0}
                  onChange={(e) => setSpaceFormData({ ...spaceFormData, zone_id: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  <option value={0}>Select Zone</option>
                  {zones.map((zone: Zone) => (
                    <option key={zone.zone_id} value={zone.zone_id}>
                      {zone.zone_name} ({zone.zone_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Space Number *</label>
                  <input
                    type="text"
                    value={spaceFormData.space_number}
                    onChange={(e) => setSpaceFormData({ ...spaceFormData, space_number: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Space Type *</label>
                  <select
                    value={spaceFormData.space_type}
                    onChange={(e) => setSpaceFormData({ ...spaceFormData, space_type: e.target.value as any })}
                    className="input"
                    required
                  >
                    <option value="stall">Stall</option>
                    <option value="shop">Shop</option>
                    <option value="kiosk">Kiosk</option>
                    <option value="booth">Booth</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Monthly Rate *</label>
                <input
                  type="number"
                  value={spaceFormData.monthly_rate}
                  onChange={(e) => setSpaceFormData({ ...spaceFormData, monthly_rate: parseFloat(e.target.value) || 0 })}
                  className="input"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status *</label>
                <select
                  value={spaceFormData.status}
                  onChange={(e) => setSpaceFormData({ ...spaceFormData, status: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowSpaceModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createSpaceMutation.isLoading}>
                  {createSpaceMutation.isLoading ? 'Creating...' : 'Create Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Send Notification to Seller</h2>
              <button onClick={() => setShowNotificationModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Seller</label>
                <select
                  value={notificationFormData.seller_id || ''}
                  onChange={(e) => setNotificationFormData({ ...notificationFormData, seller_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input"
                >
                  <option value="">All Sellers</option>
                  {sellers.map((seller: any) => (
                    <option key={seller.seller_id || seller.user_id} value={seller.seller_id || seller.user_id}>
                      {seller.full_name || seller.business_name || seller.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Title *</label>
                <input
                  type="text"
                  value={notificationFormData.title}
                  onChange={(e) => setNotificationFormData({ ...notificationFormData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Message *</label>
                <textarea
                  value={notificationFormData.message}
                  onChange={(e) => setNotificationFormData({ ...notificationFormData, message: e.target.value })}
                  className="input"
                  rows={5}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Notification Type</label>
                <select
                  value={notificationFormData.notification_type}
                  onChange={(e) => setNotificationFormData({ ...notificationFormData, notification_type: e.target.value as any })}
                  className="input"
                >
                  <option value="system">System</option>
                  <option value="payment">Payment</option>
                  <option value="allocation">Allocation</option>
                  <option value="verification">Verification</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowNotificationModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createNotificationMutation.isLoading}>
                  {createNotificationMutation.isLoading ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Seller Details</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedUser(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <p className="text-gray-900">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="text-gray-900">{selectedUser.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created At</label>
                  <p className="text-gray-900">
                    {selectedUser.created_at
                      ? format(new Date(selectedUser.created_at), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Login</label>
                  <p className="text-gray-900">
                    {selectedUser.last_login
                      ? format(new Date(selectedUser.last_login), 'MMM dd, yyyy HH:mm')
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerUsersPage
