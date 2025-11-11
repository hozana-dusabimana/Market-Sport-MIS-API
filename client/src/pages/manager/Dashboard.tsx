import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { zoneService } from '../../services/zoneService'
import { spaceService } from '../../services/spaceService'
import { allocationService } from '../../services/allocationService'
import { sellerService } from '../../services/sellerService' // <-- Make sure this exists
import { MapPin, Square, Users, TrendingUp, Plus, X, Eye } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { SellerDetailsModal } from '@/components/seller/SellerDetailsModal'
import ManagerUsersPage from './Users'

const ManagerDashboard = () => {
  const { user } = useAuthStore()

  // --- State ---
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSellerDetails, setShowSellerDetails] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)

  // --- Queries ---
  const { data: zonesData } = useQuery('zones', () => zoneService.getAll(), { retry: false, onError: () => {} })
  const { data: spacesData } = useQuery('spaces', () => spaceService.getAll(), { retry: false, onError: () => {} })
  const { data: allocationsData } = useQuery('allocations', () => allocationService.getAll(), { retry: false, onError: () => {} })
  const { data: sellersData } = useQuery('sellers', () => sellerService.getAll(), { retry: false, onError: () => {} })

  const zones = zonesData?.data || []
  const spaces = spacesData?.data || []
  const allocations = allocationsData?.data || []
  const sellers = sellersData?.data || []

  // --- Filter by manager ---
  const managedZoneIds = user?.user_type === 'manager' && user?.profile?.assigned_zones
    ? user.profile.assigned_zones
    : []

  const managedZones = managedZoneIds.length > 0
    ? zones.filter((z: any) => managedZoneIds.includes(z.zone_id))
    : zones

  const managedSpaces = managedZoneIds.length > 0
    ? spaces.filter((s: any) => managedZoneIds.includes(s.zone_id))
    : spaces

  const managedSpaceIds = managedSpaces.map((s: any) => s.space_id)
  const managedAllocations = managedZoneIds.length > 0
    ? allocations.filter((a: any) => managedSpaceIds.includes(a.space_id))
    : allocations

  // --- Stats ---
  const stats = [
    { name: 'Managed Zones', value: managedZones.length || 0, icon: MapPin, color: 'bg-blue-500' },
    { name: 'Total Spaces', value: managedSpaces.length || 0, icon: Square, color: 'bg-green-500' },
    { name: 'Active Allocations', value: managedAllocations.filter((a: any) => a.status === 'active').length || 0, icon: Users, color: 'bg-purple-500' },
    { name: 'Total Sellers', value: sellers.length || 0, icon: Users, color: 'bg-indigo-500' },
  ]

  const availableSpaces = managedSpaces.filter((s: any) => s.status === 'available').length || 0
  const totalSpaces = managedSpaces.length || 0
  const occupancyRate = totalSpaces > 0 ? ((totalSpaces - availableSpaces) / totalSpaces) * 100 : 0

  // --- Form setup (placeholder) ---
  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm({
    resolver: zodResolver(z.object({})) // Adjust schema as needed
  })
  const createSellerMutation = useMutation((data: any) => sellerService.create(data)) // Placeholder mutation
  const onCreateSeller = (data: any) => createSellerMutation.mutate(data)

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
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
            <form onSubmit={handleSubmit(onCreateSeller)} className="space-y-6">
              {/* Form fields here */}
              <div className="flex space-x-3 pt-4">
                <button type="submit" disabled={createSellerMutation.isLoading} className="btn btn-primary">
                  {createSellerMutation.isLoading ? 'Registering...' : 'Register Seller'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">Clear Form</button>
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm() }} className="btn btn-secondary">Cancel</button>
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
      {sellers && sellers.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Managed Sellers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellers.map((seller: any) => (
              <div key={seller.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{seller.business_name || seller.user?.username}</h3>
                    <p className="text-xs text-gray-600">{seller.business_type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${seller.status === 'active' ? 'bg-green-100 text-green-800' : seller.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                    {seller.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seller Details Modal */}
      <SellerDetailsModal
        seller={selectedSeller}
        isOpen={showSellerDetails}
        onClose={() => { setShowSellerDetails(false); setSelectedSeller(null) }}
      />

      <div className="mt-8">
        <ManagerUsersPage />
      </div>
    </div>
  )
}

export default ManagerDashboard
