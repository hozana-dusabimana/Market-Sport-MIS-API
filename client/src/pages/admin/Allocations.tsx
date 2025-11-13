import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { allocationService, Allocation } from '../../services/allocationService'
import { spaceService } from '../../services/spaceService'
import { sellerService } from '../../services/sellerService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
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
  const managedZoneIds = user?.user_type === 'manager' ? user.profile?.assigned_zones || [] : []

  const { data: allocationsData, isLoading } = useQuery(
    ['allocations', statusFilter, sellerFilter, managedZoneIds],
    () =>
      allocationService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        seller_id: sellerFilter !== 'all' ? parseInt(sellerFilter) : undefined,
      }),
    { retry: false }
  )
  const { data: spacesData } = useQuery('available-spaces', () => spaceService.getAvailable(), { retry: false })
  const { data: sellersData } = useQuery('sellers-list', () => sellerService.getAll(), { retry: false })

  const allAllocations = allocationsData?.data || []
  const allSpaces = spacesData?.data || []
  const sellers = sellersData?.data?.sellers || sellersData?.data || []

  // Filter allocations for manager
  const managedSpaces = managedZoneIds.length ? allSpaces.filter((s: any) => managedZoneIds.includes(s.zone_id)) : allSpaces
  const managedSpaceIds = managedSpaces.map((s: any) => s.space_id)
  const allocations = managedZoneIds.length ? allAllocations.filter((a: Allocation) => managedSpaceIds.includes(a.space_id)) : allAllocations
  const spaces = managedZoneIds.length ? managedSpaces : allSpaces

  const createMutation = useMutation((allocation: Allocation) => {
    if (user?.user_type === 'manager' && managedZoneIds.length) {
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
    ({ id }: { id: number }) => allocationService.terminate(id),
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 sm:mb-0">Space Allocations</h1>
        <button
          onClick={() => {
            setIsModalOpen(true)
            resetForm()
          }}
          className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold shadow-md hover:bg-blue-700 transition duration-200 text-sm"
        >
          <Plus size={18} />
          <span>New Allocation</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="all">All Sellers</option>
          {sellers.map((seller: any) => (
            <option key={seller.seller_id} value={seller.seller_id}>
              {seller.full_name || seller.business_name || `Seller ${seller.seller_id}`}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {isLoading ? (
          <div className="p-6 text-center text-gray-600">Loading allocations...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Seller', 'Space', 'Start Date', 'End Date', 'Status', 'Actions'].map((title) => (
                  <th key={title} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {allocations.map((allocation: Allocation) => {
                const seller = sellers.find((s: any) => s.seller_id === allocation.seller_id || s.user_id === allocation.seller_id)
                const space = spaces.find((s: any) => s.space_id === allocation.space_id)
                return (
                  <tr key={allocation.allocation_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{seller?.full_name || seller?.business_name || allocation.seller_id}</td>
                    <td className="px-6 py-4 font-medium">{space?.space_number || space?.space_code || allocation.space_id}</td>
                    <td className="px-6 py-4">{format(new Date(allocation.start_date), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4">{allocation.end_date ? format(new Date(allocation.end_date), 'MMM dd, yyyy') : 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        allocation.status === 'active' ? 'bg-green-100 text-green-800' :
                        allocation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {allocation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {allocation.status === 'active' && (
                        <button
                          onClick={() => {
                            if (user?.user_type === 'manager' && managedZoneIds.length) {
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
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Allocation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Seller *</label>
                <select
                  value={formData.seller_id || 0}
                  onChange={(e) => setFormData({ ...formData, seller_id: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                <label className="block text-sm font-medium text-gray-700">Space *</label>
                <select
                  value={formData.space_id || 0}
                  onChange={(e) => setFormData({ ...formData, space_id: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date (optional)</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Allocation Type *</label>
                <select
                  value={formData.allocation_type || 'monthly'}
                  onChange={(e) => setFormData({ ...formData, allocation_type: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 rounded-lg bg-blue-600 text-white py-2 font-semibold hover:bg-blue-700 transition">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="flex-1 rounded-lg bg-gray-300 text-gray-800 py-2 font-semibold hover:bg-gray-400 transition"
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
