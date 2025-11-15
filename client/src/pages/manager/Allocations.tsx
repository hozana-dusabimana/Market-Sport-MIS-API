import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { allocationService, Allocation } from '../../services/allocationService'
import { spaceService } from '../../services/spaceService'
import { sellerService } from '../../services/sellerService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, X, Eye } from 'lucide-react'
import { format } from 'date-fns'

const ManagerAllocations = () => {
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sellerFilter, setSellerFilter] = useState<string>('all')
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [formData, setFormData] = useState<Partial<Allocation>>({
    seller_id: 0,
    space_id: 0,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    allocation_type: 'monthly',
    status: 'active',
  })

  const queryClient = useQueryClient()
  const managerId = user?.profile?.manager_id || user?.profile?.id || null

  const { data: allocationsData } = useQuery(
    ['allocations', statusFilter, sellerFilter],
    () => allocationService.getAll({ status: statusFilter !== 'all' ? statusFilter : undefined })
  )

  const { data: spacesData } = useQuery(['spaces'], () => spaceService.getAvailable())
  const { data: sellersData } = useQuery(['sellers'], () => sellerService.getAll(managerId ? { manager_id: managerId } : undefined))

  const allocations = allocationsData?.data || []
  const spaces = spacesData?.data || []
  const sellers = sellersData?.data?.sellers || sellersData?.data || []

  const createMutation = useMutation((allocation: Allocation) => allocationService.create(allocation), {
    onSuccess: () => {
      queryClient.invalidateQueries('allocations')
      toast.success('Allocation created successfully')
      setIsModalOpen(false)
      resetForm()
    },
  })

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Managed Allocations</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true) }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" />
          Create Allocation
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 w-48"
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
          className="border rounded px-3 py-2 w-48"
        >
          <option value="all">All Sellers</option>
          {sellers.map((seller: any) => (
            <option key={seller.seller_id || seller.user_id} value={seller.seller_id || seller.user_id}>
              {seller.business_name || seller.full_name || 'N/A'}
            </option>
          ))}
        </select>
      </div>

      {/* Allocations Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Seller</th>
              <th className="px-4 py-2 text-left font-medium">Space</th>
              <th className="px-4 py-2 text-left font-medium">Start Date</th>
              <th className="px-4 py-2 text-left font-medium">End Date</th>
              <th className="px-4 py-2 text-left font-medium">Type</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              <th className="px-4 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allocations.length > 0 ? (
              allocations.map((allocation: Allocation) => {
                const seller = sellers.find((s: any) => (s.seller_id || s.user_id) === allocation.seller_id)
                const space = spaces.find((s: any) => s.space_id === allocation.space_id)
                return (
                  <tr key={allocation.allocation_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{seller?.business_name || 'N/A'}</td>
                    <td className="px-4 py-2">{space?.space_number || `Space #${allocation.space_id}`}</td>
                    <td className="px-4 py-2">{allocation.start_date ? format(new Date(allocation.start_date), 'MMM dd, yyyy') : 'N/A'}</td>
                    <td className="px-4 py-2">{allocation.end_date ? format(new Date(allocation.end_date), 'MMM dd, yyyy') : 'N/A'}</td>
                    <td className="px-4 py-2 capitalize">{allocation.allocation_type || 'N/A'}</td>
                    <td className="px-4 py-2">{allocation.status}</td>
                    <td className="px-4 py-2 flex space-x-2">
                      <button onClick={() => setSelectedAllocation(allocation)} className="text-blue-600 hover:text-blue-800">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No allocations found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl space-y-4">
            <h2 className="text-xl font-bold">Create Allocation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.seller_id}
                  onChange={(e) => setFormData({ ...formData, seller_id: parseInt(e.target.value) })}
                  className="border rounded px-3 py-2 w-full"
                  required
                >
                  <option value={0}>Select Seller</option>
                  {sellers.map((seller: any) => (
                    <option key={seller.seller_id || seller.user_id} value={seller.seller_id || seller.user_id}>
                      {seller.business_name || 'N/A'}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.space_id}
                  onChange={(e) => setFormData({ ...formData, space_id: parseInt(e.target.value) })}
                  className="border rounded px-3 py-2 w-full"
                  required
                >
                  <option value={0}>Select Space</option>
                  {spaces.map((space: any) => (
                    <option key={space.space_id} value={space.space_id}>
                      {space.space_number || `Space #${space.space_id}`}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
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

export default ManagerAllocations
