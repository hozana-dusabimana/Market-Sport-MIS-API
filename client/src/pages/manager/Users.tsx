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
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null) // FIX: Added state for editing allocation
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
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null) // FIX: Added state for editing notification
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
        queryClient.invalidateQueries('manager-sellers') // FIX: Corrected invalidate query key
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
    ['manager-sellers', searchTerm, currentUser?.profile?.manager_id],
    async () => {
      const result = await sellerService.getAll({
        search: searchTerm || undefined,
        manager_id: (currentUser as any)?.profile?.manager_id || (currentUser as any)?.manager_id,
      })
      // FIX: Assuming sellerService returns { data: { sellers: [] } }
      return result?.data?.sellers || result?.data?.users || result?.data || []
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
    ['sellers-for-allocation', currentUser?.profile?.manager_id],
    () => sellerService.getAll(((currentUser as any)?.profile?.manager_id || (currentUser as any)?.manager_id) ? { manager_id: (currentUser as any)?.profile?.manager_id || (currentUser as any)?.manager_id } : undefined),
    { retry: false, onError: () => {} }
  )
  
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
  // FIX: Normalized data extraction for zones
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
  // FIX: Normalized data extraction for spaces
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
  
  // FIX: Normalized data extraction for all Payment-related queries
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
  // FIX: The getMonthlyReport service likely expects month and year as strings/numbers, splitting the 'YYYY-MM' string is correct.
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
  // FIX: Normalized data extraction for notifications
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
        queryClient.invalidateQueries('manager-sellers') // FIX: Corrected invalidate query key
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
      queryClient.invalidateQueries('manager-sellers') // FIX: Corrected invalidate query key
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
        queryClient.invalidateQueries('available-spaces') // FIX: Invalidating available spaces query too
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

  // FIX: Added update and delete mutations for Allocations
  const updateAllocationMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Allocation> }) => allocationService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allocations')
        queryClient.invalidateQueries('available-spaces')
        toast.success('Allocation updated successfully')
        setShowAllocationModal(false)
        setEditingAllocation(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update allocation')
      },
    }
  )

  const deleteAllocationMutation = useMutation((id: number) => allocationService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('allocations')
      queryClient.invalidateQueries('available-spaces')
      toast.success('Allocation deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete allocation')
    },
  })

  // Zones mutations
  const createZoneMutation = useMutation(
    (zone: Zone) => zoneService.create(zone),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('zones')
        queryClient.invalidateQueries('spaces') // FIX: Invalidate related queries
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

  // FIX: Added update and delete mutations for Zones
  const updateZoneMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Zone> }) => zoneService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('zones')
        queryClient.invalidateQueries('spaces')
        toast.success('Zone updated successfully')
        setShowZoneModal(false)
        setEditingZone(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update zone')
      },
    }
  )

  const deleteZoneMutation = useMutation((id: number) => zoneService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('zones')
      queryClient.invalidateQueries('spaces')
      toast.success('Zone deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete zone')
    },
  })


  // Spaces mutations
  const createSpaceMutation = useMutation(
    (space: Space) => spaceService.create(space),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('spaces')
        queryClient.invalidateQueries('available-spaces') // FIX: Invalidate related queries
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

  // FIX: Added update and delete mutations for Spaces
  const updateSpaceMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Space> }) => spaceService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('spaces')
        queryClient.invalidateQueries('available-spaces')
        queryClient.invalidateQueries('allocations') // Space changes can affect allocations
        toast.success('Space updated successfully')
        setShowSpaceModal(false)
        setEditingSpace(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update space')
      },
    }
  )

  const deleteSpaceMutation = useMutation((id: number) => spaceService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('spaces')
      queryClient.invalidateQueries('available-spaces')
      toast.success('Space deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete space')
    },
  })

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

  // FIX: Added update and delete mutations for Notifications
  const updateNotificationMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Notification> }) => notificationService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('Notification updated successfully')
        setShowNotificationModal(false)
        setEditingNotification(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update notification')
      },
    }
  )

  const deleteNotificationMutation = useMutation((id: number) => notificationService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      toast.success('Notification deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete notification')
    },
  })


  // Handler functions
  const handleCreateAllocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocationFormData.seller_id || !allocationFormData.space_id) {
      toast.error('Please select both seller and space')
      return
    }
    if (managedZoneIds.length > 0) {
      // FIX: Added type assertion to managedSpaces for find to work correctly
      const selectedSpace = managedSpaces.find((s: Space) => s.space_id === allocationFormData.space_id)
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
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            seller.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {seller.status || 'inactive'}
                        </span>
                    </td>
                    <td className="py-3 px-4 flex space-x-2">
                        <button
                            onClick={() => handleViewDetails(seller)}
                            className="text-primary-600 hover:text-primary-800"
                            title="View Details"
                        >
                            <Eye size={18} />
                        </button>
                        {/* Add Edit/Delete buttons here, similar to the pattern above if needed. */}
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ManagerUsersPage