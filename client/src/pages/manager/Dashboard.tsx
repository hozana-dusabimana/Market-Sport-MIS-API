import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { zoneService } from '../../services/zoneService'
import { spaceService } from '../../services/spaceService'
import { allocationService } from '../../services/allocationService'
import { sellerService } from '../../services/sellerService'
import { authService, RegisterData } from '../../services/authService'
import { MapPin, Square, Users, TrendingUp, Plus, X, UserPlus } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const sellerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone_number: z.string().min(10, 'Invalid phone number'),
  full_name: z.string().min(2, 'Full name is required'),
  id_number: z.string().min(1, 'ID number is required'),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  tin_number: z.string().optional(),
  emergency_contact: z.string().optional(),
  address: z.string().optional(),
})

type SellerFormData = z.infer<typeof sellerSchema>

const ManagerDashboard = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // --- State ---
  const [showCreateModal, setShowCreateModal] = useState(false)

  // --- Manager scope (must be defined before queries below) ---
  const isManager = user?.user_type === 'manager'
  const managedZoneIds = isManager && user?.profile?.assigned_zones ? user.profile.assigned_zones : []
  const managerIdRaw = (user as any)?.profile?.manager_id || (user as any)?.profile?.id || (user as any)?.manager_id || null
  const managerId = managerIdRaw != null ? Number(managerIdRaw) : null
  const username = (user as any)?.username || null

  // --- Queries ---
  const { data: zonesData } = useQuery(['zones', managerId], () => zoneService.getAll(isManager && managerId ? { manager_id: managerId } : undefined), { retry: false, onError: () => {} })
  const { data: spacesData } = useQuery('spaces', () => spaceService.getAll(), { retry: false, onError: () => {} })
  const { data: allocationsData } = useQuery('allocations', () => allocationService.getAll(), { retry: false, onError: () => {} })
  const { data: sellersData } = useQuery(['sellers', managerId], () => sellerService.getAll(managerId ? { manager_id: managerId } : undefined), { retry: false, onError: () => {} })

  const zones = zonesData?.data || []
  const spaces = spacesData?.data || []
  const allocations = allocationsData?.data || []
  const sellers = sellersData?.data?.sellers || sellersData?.data || []

  // --- Filter by manager ---

  const assignedIds: number[] = Array.isArray(managedZoneIds) ? managedZoneIds.map((id: any) => Number(id)) : []
  const managedZones = isManager
    ? zones.filter((z: any) => {
        const zid = Number(z.zone_id)
        const zManagerId = Number((z as any).manager_id)
        const zManagerUsername = (z as any).manager_username
        return assignedIds.includes(zid) || (managerId != null && zManagerId === managerId) || (!!username && zManagerUsername === username)
      })
    : zones

  const managedSpaces = isManager
    ? spaces.filter((s: any) => (managedZoneIds.includes(s.zone_id)) || ((s as any).manager_id === managerId))
    : spaces

  const managedSpaceIds = managedSpaces.map((s: any) => s.space_id)
  const managedAllocations = isManager
    ? allocations.filter((a: any) => managedSpaceIds.includes(a.space_id) || (managerId && a.manager_id === managerId))
    : allocations

  // Filter sellers by managed zones (sellers who have allocations in managed zones)
  const managedSellerIds = new Set(
    managedAllocations.map((a: any) => a.seller_id).filter(Boolean)
  )

  // --- Seller actions ---
  const verifySellerMutation = useMutation(
    async (sellerId: number) => sellerService.updateVerificationStatus(sellerId, 'verified'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellers')
        toast.success('Seller verified')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to verify seller')
      },
    }
  )

  const rejectSellerMutation = useMutation(
    async (sellerId: number) => sellerService.updateVerificationStatus(sellerId, 'rejected'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellers')
        toast.success('Seller rejected')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to reject seller')
      },
    }
  )

  const handleVerify = (sellerId: number) => verifySellerMutation.mutate(sellerId)
  const handleReject = (sellerId: number) => rejectSellerMutation.mutate(sellerId)
  const managedSellers = isManager
    ? sellers.filter((s: any) => {
        const createdBy = Number((s as any).created_by_manager_id)
        const ownsByCreator = managerId != null && createdBy === managerId
        const ownsByAlloc = managedSellerIds.has(s.seller_id) || managedSellerIds.has(s.user_id)
        const ownsByManagerIdColumn = managerId != null && Number((s as any).manager_id) === managerId
        return ownsByCreator || ownsByAlloc || ownsByManagerIdColumn
      })
    : sellers

  // --- Stats ---
  const stats = [
    { name: 'Managed Zones', value: managedZones.length || 0, icon: MapPin, color: 'bg-blue-500' },
    { name: 'Total Spaces', value: managedSpaces.length || 0, icon: Square, color: 'bg-green-500' },
    { name: 'Active Allocations', value: managedAllocations.filter((a: any) => a.status === 'active').length || 0, icon: Users, color: 'bg-purple-500' },
    { name: 'Total Sellers', value: managedSellers.length || 0, icon: Users, color: 'bg-indigo-500' },
  ]

  const availableSpaces = managedSpaces.filter((s: any) => s.status === 'available').length || 0
  const totalSpaces = managedSpaces.length || 0
  const occupancyRate = totalSpaces > 0 ? ((totalSpaces - availableSpaces) / totalSpaces) * 100 : 0

  // --- Form setup ---
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
  })

  const createSellerMutation = useMutation(
    async (data: SellerFormData) => {
      const registerData: RegisterData = {
        ...data,
        user_type: 'seller',
        registration_date: new Date().toISOString().split('T')[0],
        manager_id: (user as any)?.profile?.manager_id || (user as any)?.manager_id || undefined,
      }
      return await authService.register(registerData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellers')
        toast.success('Seller registered successfully!')
        setShowCreateModal(false)
        resetForm()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Registration failed')
      },
    }
  )

  const onSubmit = (data: SellerFormData) => {
    createSellerMutation.mutate(data)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Seller</span>
        </button>
      </div>

      {/* Seller Registration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[95vh] overflow-y-auto slide-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
                  <UserPlus className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold">Register New Seller</h2>
                <p className="text-gray-600 mt-1 text-sm">Fill in the seller's information to create their account</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); resetForm() }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    {...register('full_name')}
                    className="input"
                    placeholder="Enter full name"
                    required
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">ID Number *</label>
                  <input
                    type="text"
                    {...register('id_number')}
                    className="input"
                    placeholder="Enter ID number"
                    required
                  />
                  {errors.id_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.id_number.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Username *</label>
                  <input
                    type="text"
                    {...register('username')}
                    className="input"
                    placeholder="Choose a username"
                    required
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input"
                    placeholder="Enter email address"
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    {...register('phone_number')}
                    className="input"
                    placeholder="Enter phone number"
                    required
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    {...register('password')}
                    className="input"
                    placeholder="Create a password"
                    required
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Business Name</label>
                  <input
                    type="text"
                    {...register('business_name')}
                    className="input"
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <label className="label">Business Type</label>
                  <input
                    type="text"
                    {...register('business_type')}
                    className="input"
                    placeholder="e.g., Retail, Food, etc."
                  />
                </div>

                <div>
                  <label className="label">TIN Number</label>
                  <input
                    type="text"
                    {...register('tin_number')}
                    className="input"
                    placeholder="Enter TIN number"
                  />
                </div>

                <div>
                  <label className="label">Emergency Contact</label>
                  <input
                    type="tel"
                    {...register('emergency_contact')}
                    className="input"
                    placeholder="Enter emergency contact"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Address</label>
                  <textarea
                    {...register('address')}
                    className="input"
                    rows={3}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" disabled={createSellerMutation.isLoading} className="btn btn-primary">
                  {createSellerMutation.isLoading ? 'Registering...' : 'Register Seller'}
                </button>
                <button type="button" onClick={() => resetForm()} className="btn btn-secondary">
                  Clear Form
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm() }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
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

      {/* Occupancy Rate */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Occupancy Rate</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-primary-600 h-4 rounded-full transition-all" style={{ width: `${occupancyRate}%` }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{occupancyRate.toFixed(1)}% occupied ({totalSpaces - availableSpaces} / {totalSpaces} spaces)</p>
          </div>
          <TrendingUp className="w-8 h-8 text-primary-600" />
        </div>
      </div>

      {/* Sellers Section */}
      {managedSellers && managedSellers.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Managed Sellers</h2>
            <span className="text-sm text-gray-600">Total: {managedSellers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Business</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {managedSellers.map((s: any) => (
                  <tr key={s.seller_id || s.user_id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4">{s.full_name || s.username || 'N/A'}</td>
                    <td className="py-2 pr-4">{s.business_name || '—'}</td>
                    <td className="py-2 pr-4">{s.phone_number || s.user?.phone_number || '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.verification_status === 'verified' || s.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : s.verification_status === 'rejected' || s.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {s.verification_status || s.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 space-x-2">
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => handleVerify(s.seller_id)}
                        disabled={verifySellerMutation.isLoading}
                      >
                        Verify
                      </button>
                      <button
                        className="btn btn-xs btn-secondary"
                        onClick={() => handleReject(s.seller_id)}
                        disabled={rejectSellerMutation.isLoading}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-xs"
                        onClick={() => window.location.assign(`/admin/sellers/${s.seller_id || s.user_id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerDashboard
