import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { zoneService } from '../../services/zoneService'
import { spaceService } from '../../services/spaceService'
import { allocationService } from '../../services/allocationService'
import { MapPin, Square, Users, TrendingUp } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const ManagerDashboard = () => {
  const { user } = useAuthStore()
  
  const { data: zonesData } = useQuery('zones', () => zoneService.getAll(), {
    retry: false,
    onError: () => {},
  })
  const { data: spacesData } = useQuery('spaces', () => spaceService.getAll(), {
    retry: false,
    onError: () => {},
  })
  const { data: allocationsData } = useQuery('allocations', () => allocationService.getAll(), {
    retry: false,
    onError: () => {},
  })

  const zones = zonesData?.data || []
  const spaces = spacesData?.data || []
  const allocations = allocationsData?.data || []
  
  // Filter zones by manager if user is a manager
  const managedZoneIds = user?.user_type === 'manager' && user?.profile?.assigned_zones
    ? user.profile.assigned_zones
    : []
  const managedZones = managedZoneIds.length > 0
    ? zones.filter((z: any) => managedZoneIds.includes(z.zone_id))
    : zones

  // Filter spaces by managed zones
  const managedSpaces = managedZoneIds.length > 0
    ? spaces.filter((s: any) => managedZoneIds.includes(s.zone_id))
    : spaces

  // Filter allocations by managed zones (through spaces)
  const managedSpaceIds = managedSpaces.map((s: any) => s.space_id)
  const managedAllocations = managedZoneIds.length > 0
    ? allocations.filter((a: any) => managedSpaceIds.includes(a.space_id))
    : allocations

  const stats = [
    {
      name: 'Managed Zones',
      value: managedZones.length || 0,
      icon: MapPin,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Spaces',
      value: managedSpaces.length || 0,
      icon: Square,
      color: 'bg-green-500',
    },
    {
      name: 'Active Allocations',
      value: managedAllocations.filter((a: any) => a.status === 'active').length || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Sellers',
      value: sellers?.length || 0,
      icon: Users,
      color: 'bg-indigo-500',
    },
  ]

  const availableSpaces = managedSpaces.filter((s: any) => s.status === 'available').length || 0
  const totalSpaces = managedSpaces.length || 0
  const occupancyRate = totalSpaces > 0 ? ((totalSpaces - availableSpaces) / totalSpaces) * 100 : 0

  return (
    <div>
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
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onCreateSeller)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name *</label>
                  <input
                    type="text"
                    {...register('full_name')}
                    className="input"
                    placeholder="Enter full name"
                  />
                  {errors.full_name && <p className="text-xs text-red-600 mt-1">{errors.full_name.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">ID Number *</label>
                  <input
                    type="text"
                    {...register('id_number')}
                    className="input"
                    placeholder="Enter ID number"
                  />
                  {errors.id_number && <p className="text-xs text-red-600 mt-1">{errors.id_number.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Username *</label>
                  <input
                    type="text"
                    {...register('username')}
                    className="input"
                    placeholder="Choose a username"
                  />
                  {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Email *</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input"
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number *</label>
                  <input
                    type="tel"
                    {...register('phone_number')}
                    className="input"
                    placeholder="Enter phone number"
                  />
                  {errors.phone_number && <p className="text-xs text-red-600 mt-1">{errors.phone_number.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Password *</label>
                  <input
                    type="password"
                    {...register('password')}
                    className="input"
                    placeholder="Create a password"
                  />
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Business Name</label>
                  <input
                    type="text"
                    {...register('business_name')}
                    className="input"
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Business Type</label>
                  <input
                    type="text"
                    {...register('business_type')}
                    className="input"
                    placeholder="e.g., Retail, Food, etc."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">TIN Number</label>
                  <input
                    type="text"
                    {...register('tin_number')}
                    className="input"
                    placeholder="Enter TIN number"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                  <input
                    type="tel"
                    {...register('emergency_contact')}
                    className="input"
                    placeholder="Enter emergency contact"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <textarea
                    {...register('address')}
                    className="input"
                    rows={3}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={createSellerMutation.isLoading}
                  className="btn btn-primary"
                >
                  {createSellerMutation.isLoading ? 'Registering...' : 'Register Seller'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                  }}
                  className="btn btn-secondary"
                >
                  Clear Form
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {sellerStatusCount?.data && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Verification Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sellerStatusCount.data.map((stat: { verification_status: string; count?: number }) => (
              <div key={stat.verification_status} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 capitalize">{stat.verification_status}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    stat.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                    stat.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {stat.verification_status}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.count || 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Occupancy Rate</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary-600 h-4 rounded-full transition-all"
                style={{ width: `${occupancyRate}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {occupancyRate.toFixed(1)}% occupied ({totalSpaces - availableSpaces} / {totalSpaces} spaces)
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-primary-600" />
        </div>
      </div>

      {sellerStatusCount?.data && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Verification Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sellerStatusCount.data.map((stat) => (
              <div key={stat.verification_status} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 capitalize">{stat.verification_status}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    stat.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                    stat.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {stat.verification_status}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.count || 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sellers Section */}
      {sellers && sellers.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Managed Sellers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellers.map((seller: Seller) => (
              <div key={seller.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{seller.business_name || seller.user?.username}</h3>
                    <p className="text-xs text-gray-600">{seller.business_type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    seller.status === 'active' ? 'bg-green-100 text-green-800' :
                    seller.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {seller.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{seller.user?.email}</p>
                <button
                  onClick={() => {
                    setSelectedSeller(seller)
                    setShowSellerDetails(true)
                  }}
                  className="btn btn-sm btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Eye size={16} />
                  <span>View Details</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <SellerDetailsModal
        seller={selectedSeller}
        isOpen={showSellerDetails}
        onClose={() => {
          setShowSellerDetails(false)
          setSelectedSeller(null)
        }}
      />

      <div className="mt-8">
        <ManagerUsersPage />
      </div>
    </div>
  )
}

export default ManagerDashboard


