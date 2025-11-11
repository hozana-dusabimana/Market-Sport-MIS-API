import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { allocationService, Allocation } from '../../services/allocationService'
import { spaceService } from '../../services/spaceService'
import { sellerService } from '../../services/sellerService'
import { zoneService } from '../../services/zoneService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Calendar, X, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'

const Allocations = () => {
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sellerFilter, setSellerFilter] = useState<string>('all')
  const [formData, setFormData] = useState<Partial<Allocation>>({
    seller_id: 0,
    space_id: 0,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    allocation_type: 'monthly',
    status: 'active',
  })

  const queryClient = useQueryClient()
  // For managers, get their assigned zones first
  const managerId = user?.user_type === 'manager' ? user?.userId : undefined
  const managedZoneIds = user?.user_type === 'manager' && user?.profile?.assigned_zones
    ? user.profile.assigned_zones
    : []

  const { data: allocationsData, isLoading } = useQuery(
    ['allocations', statusFilter, sellerFilter, managedZoneIds],
    () => allocationService.getAll({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      seller_id: sellerFilter !== 'all' ? parseInt(sellerFilter) : undefined,
    }),
    {
      retry: false,
      onError: () => {},
    }
  )
  const { data: spacesData } = useQuery('available-spaces', () => spaceService.getAvailable(), {
    retry: false,
    onError: () => {},
  })
  const { data: sellersData } = useQuery('sellers-list', () => sellerService.getAll(), {
    retry: false,
    onError: () => {},
  })
  
  const allAllocations = allocationsData?.data || []
  const allSpaces = spacesData?.data || []
  const sellers = sellersData?.data?.sellers || sellersData?.data || []

  // For managers, filter allocations by their assigned zones (through spaces)
  const managedSpaces = managedZoneIds.length > 0
    ? allSpaces.filter((s: any) => managedZoneIds.includes(s.zone_id))
    : allSpaces
  const managedSpaceIds = managedSpaces.map((s: any) => s.space_id)
  const allocations = managedZoneIds.length > 0
    ? allAllocations.filter((a: Allocation) => managedSpaceIds.includes(a.space_id))
    : allAllocations
  const spaces = managedZoneIds.length > 0 ? managedSpaces : allSpaces

  const createMutation = useMutation((allocation: Allocation) => {
    // For managers, validate that the space belongs to their managed zones
    if (user?.user_type === 'manager' && managedZoneIds.length > 0) {
      const selectedSpace = spaces.find((s: any) => s.space_id === allocation.space_id)
      if (selectedSpace && !managedZoneIds.includes(selectedSpace.zone_id)) {
        toast.error('You can only create allocations for spaces in your managed zones')
        throw new Error('Unauthorized allocation')
      }
    }
    return allocationService.create(allocation)
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('allocations')
      queryClient.invalidateQueries('spaces')
      toast.success('Allocation created successfully')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      if (error.message !== 'Unauthorized allocation') {
        toast.error(error.response?.data?.message || 'Failed to create allocation')
      }
    },
  })

  const terminateMutation = useMutation(
    ({ id, reason }: { id: number; reason?: string }) => allocationService.terminate(id, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allocations')
        queryClient.invalidateQueries('spaces')
        toast.success('Allocation terminated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to terminate allocation')
      },
    }
  )

  const resetForm = () => {
    setFormData({
      seller_id: 0,
      space_id: 0,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      allocation_type: 'monthly',
      status: 'active',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.seller_id || !formData.space_id) {
      toast.error('Please select both seller and space')
      return
    }
    createMutation.mutate(formData as Allocation)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading allocations...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Space Allocations</h1>
        <button
          onClick={() => {
            setIsModalOpen(true)
            resetForm()
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Allocation</span>
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Sellers</option>
            {sellers.map((seller: any) => (
              <option key={seller.seller_id} value={seller.seller_id}>
                {seller.full_name || seller.business_name || `Seller ${seller.seller_id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Space</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations?.map((allocation: Allocation) => {
                const seller = sellers.find((s: any) => s.seller_id === allocation.seller_id || s.user_id === allocation.seller_id)
                const space = spaces.find((s: any) => s.space_id === allocation.space_id)
                return (
                  <tr key={allocation.allocation_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{seller?.full_name || seller?.business_name || allocation.seller_id}</td>
                    <td className="py-3 px-4 font-medium">{space?.space_number || space?.space_code || allocation.space_id}</td>
                    <td className="py-3 px-4">
                      {format(new Date(allocation.start_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      {allocation.end_date ? format(new Date(allocation.end_date), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          allocation.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : allocation.status === 'expired'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {allocation.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {allocation.status === 'active' && (
                        <button
                          onClick={() => {
                            // For managers, validate that the allocation is in their managed zones
                            if (user?.user_type === 'manager' && managedZoneIds.length > 0) {
                              const allocationSpace = spaces.find((s: any) => s.space_id === allocation.space_id)
                              if (allocationSpace && !managedZoneIds.includes(allocationSpace.zone_id)) {
                                toast.error('You can only terminate allocations in your managed zones')
                                return
                              }
                            }
                            if (confirm('Are you sure you want to terminate this allocation?')) {
                              terminateMutation.mutate({ id: allocation.allocation_id! })
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Terminate"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Allocation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Seller *</label>
                <select
                  value={formData.seller_id || 0}
                  onChange={(e) => setFormData({ ...formData, seller_id: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  <option value={0}>Select Seller</option>
                  {sellers.map((seller: any) => (
                    <option key={seller.seller_id} value={seller.seller_id}>
                      {seller.full_name || seller.business_name || `Seller ${seller.seller_id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Space *</label>
                <select
                  value={formData.space_id || 0}
                  onChange={(e) => {
                    const space = spaces.find((s: any) => s.space_id === parseInt(e.target.value))
                    setFormData({
                      ...formData,
                      space_id: parseInt(e.target.value),
                    })
                  }}
                  className="input"
                  required
                >
                  <option value={0}>Select Space</option>
                  {spaces.map((space: any) => (
                    <option key={space.space_id} value={space.space_id}>
                      {space.space_number || space.space_code} - {space.space_type} (${space.monthly_rate || space.daily_rate || 0}/month)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">End Date (optional)</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Allocation Type *</label>
                <select
                  value={formData.allocation_type || 'monthly'}
                  onChange={(e) => setFormData({ ...formData, allocation_type: e.target.value })}
                  className="input"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Allocations


