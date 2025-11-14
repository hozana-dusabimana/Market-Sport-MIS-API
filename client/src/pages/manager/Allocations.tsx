import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { allocationService, Allocation } from '../../services/allocationService'
import { spaceService } from '../../services/spaceService'
import { sellerService } from '../../services/sellerService'
import { zoneService } from '../../services/zoneService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Calendar, X, Search, Eye } from 'lucide-react'
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
  const managedZoneIds = user?.profile?.assigned_zones || []
  const managerId = (user as any)?.profile?.manager_id || (user as any)?.profile?.id || (user as any)?.manager_id || null

  const { data: allocationsData, isLoading } = useQuery(
    ['allocations', statusFilter, sellerFilter, managedZoneIds],
    () => allocationService.getAll({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      seller_id: sellerFilter !== 'all' ? parseInt(sellerFilter) : undefined,
    }),
    { retry: false, onError: () => {} }
  )
  
  const { data: spacesData } = useQuery(
    ['available-spaces', managedZoneIds],
    () => spaceService.getAvailable(),
    {
      retry: false,
      onError: () => {},
    }
  )
  
  const { data: sellersData } = useQuery(
    ['sellers-list', managedZoneIds, managerId],
    () => sellerService.getAll(managerId ? { manager_id: managerId } : undefined),
    {
      retry: false,
      onError: () => {},
    }
  )
  
  const allAllocations = allocationsData?.data || []
  const allSpaces = spacesData?.data || []
  const sellers = sellersData?.data?.sellers || sellersData?.data || []

  // Filter by managed zones (through spaces)
  const managedSpaces = managedZoneIds.length > 0
    ? allSpaces.filter((s: any) => managedZoneIds.includes(s.zone_id))
    : allSpaces
  const managedSpaceIds = managedSpaces.map((s: any) => s.space_id)
  // Union: in assigned zones OR created by this manager
  const allocations = managedZoneIds.length > 0
    ? allAllocations.filter((a: any) => managedSpaceIds.includes(a.space_id) || (managerId && a.manager_id === managerId))
    : allAllocations
  const spaces = managedZoneIds.length > 0 ? managedSpaces : allSpaces

  // Derive managed sellers from the filtered allocations
  const managedSellerIds = Array.from(new Set((allocations as any[]).map(a => a.seller_id)))

  const { data: allocationDetails } = useQuery(
    ['allocation-details', selectedAllocation?.allocation_id],
    () => allocationService.getById(selectedAllocation?.allocation_id!),
    { enabled: !!selectedAllocation?.allocation_id && showDetails, retry: false, onError: () => {} }
  )

  const { data: allocationPayments } = useQuery(
    ['allocation-payments', selectedAllocation?.allocation_id],
    () => allocationService.getPayments(selectedAllocation?.allocation_id!),
    { enabled: !!selectedAllocation?.allocation_id && showDetails, retry: false, onError: () => {} }
  )

  const createMutation = useMutation((allocation: Allocation) => {
    if (managedZoneIds.length > 0) {
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

  const updateMutation = useMutation(
    ({ id, allocation }: { id: number; allocation: Partial<Allocation> }) => allocationService.update(id, allocation),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allocations')
        toast.success('Allocation updated successfully')
        setIsModalOpen(false)
        resetForm()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update allocation')
      },
    }
  )

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => allocationService.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allocations')
        toast.success('Allocation status updated successfully')
      },
      onError: (error: any) => {
        if (error?.response?.status !== 403) {
          toast.error(error.response?.data?.message || 'Failed to update allocation status')
        }
      },
    }
  )

  const terminateMutation = useMutation(
    ({ id, reason }: { id: number; reason?: string }) => allocationService.terminate(id, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allocations')
        queryClient.invalidateQueries('spaces')
        toast.success('Allocation terminated successfully')
      },
      onError: (error: any) => {
        if (error?.response?.status !== 403) {
          toast.error(error.response?.data?.message || 'Failed to terminate allocation')
        }
      },
    }
  )

  const deleteMutation = useMutation((id: number) => allocationService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('allocations')
      toast.success('Allocation deleted successfully')
    },
    onError: (error: any) => {
      if (error?.response?.status !== 403) {
        toast.error(error.response?.data?.message || 'Failed to delete allocation')
      }
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

  const handleViewDetails = (allocation: Allocation) => {
    setSelectedAllocation(allocation)
    setShowDetails(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.seller_id || !formData.space_id) {
      toast.error('Please select both seller and space')
      return
    }
    if (managedZoneIds.length > 0) {
      const selectedSpace = spaces.find((s: any) => s.space_id === formData.space_id)
      if (selectedSpace && !managedZoneIds.includes(selectedSpace.zone_id)) {
        toast.error('You can only create allocations for spaces in your managed zones')
        return
      }
    }
    createMutation.mutate(formData as Allocation)
  }

  const handleTerminate = (id: number) => {
    if (managedZoneIds.length > 0) {
      const allocation = allocations.find((a: Allocation) => a.allocation_id === id)
      if (allocation) {
        const allocationSpace = spaces.find((s: any) => s.space_id === allocation.space_id)
        if (allocationSpace && !managedZoneIds.includes(allocationSpace.zone_id)) {
          toast.error('You can only terminate allocations in your managed zones')
          return
        }
      }
    }
    if (window.confirm('Are you sure you want to terminate this allocation?')) {
      terminateMutation.mutate({ id })
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      deleteMutation.mutate(id)
    }
  }

  const allocationDetailsData = allocationDetails?.data || selectedAllocation
  const payments = allocationPayments?.data || []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Managed Allocations</h1>
        <button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Allocation</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
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
            className="input"
          >
            <option value="all">All Sellers</option>
            {sellers
              .filter((seller: any) => managedZoneIds.length === 0 || managedSellerIds.includes(seller.seller_id || seller.user_id) || (managerId && seller.manager_id === managerId))
              .map((seller: any) => (
              <option key={seller.seller_id || seller.user_id} value={seller.seller_id || seller.user_id}>
                {seller.business_name || seller.full_name || seller.user?.username || 'N/A'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Space</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length > 0 ? (
                allocations.map((allocation: Allocation) => {
                  const seller = sellers.find((s: any) => (s.seller_id || s.user_id) === allocation.seller_id)
                  const space = spaces.find((s: any) => s.space_id === allocation.space_id)
                  const owned = managerId && (allocation as any).manager_id === managerId
                  return (
                    <tr key={allocation.allocation_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {seller?.business_name || seller?.full_name || seller?.user?.username || `Seller #${allocation.seller_id}`}
                      </td>
                      <td className="py-3 px-4">
                        {space?.space_number || space?.space_code || `Space #${allocation.space_id}`}
                      </td>
                      <td className="py-3 px-4">
                        {allocation.start_date ? format(new Date(allocation.start_date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        {allocation.end_date ? format(new Date(allocation.end_date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4 capitalize">{allocation.allocation_type || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {owned ? (
                          <select
                            value={allocation.status}
                            onChange={(e) => {
                              if (window.confirm(`Change allocation status to ${e.target.value}?`)) {
                                updateStatusMutation.mutate({ id: allocation.allocation_id!, status: e.target.value })
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium border-0 ${
                              allocation.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : allocation.status === 'expired'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="terminated">Terminated</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
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
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {owned && allocation.status === 'active' && (
                          <button
                            onClick={() => handleTerminate(allocation.allocation_id!)}
                            className="text-red-600 hover:text-red-700"
                            title="Terminate"
                          >
                            <X size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetails(allocation)}
                          className="text-primary-600 hover:text-primary-700"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No allocations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Allocation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Seller *</label>
                  <select
                    value={formData.seller_id}
                    onChange={(e) => setFormData({ ...formData, seller_id: parseInt(e.target.value) })}
                    className="input"
                    required
                  >
                    <option value={0}>Select Seller</option>
                    {sellers
                      .filter((s: any) => managedZoneIds.length === 0 || managedSellerIds.includes(s.seller_id || s.user_id) || (managerId && s.manager_id === managerId))
                      .map((seller: any) => (
                      <option key={seller.seller_id || seller.user_id} value={seller.seller_id || seller.user_id}>
                        {seller.business_name || seller.full_name || seller.user?.username || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Space *</label>
                  <select
                    value={formData.space_id}
                    onChange={(e) => setFormData({ ...formData, space_id: parseInt(e.target.value) })}
                    className="input"
                    required
                  >
                    <option value={0}>Select Space</option>
                    {spaces.map((space: any) => (
                      <option key={space.space_id} value={space.space_id}>
                        {space.space_number || space.space_code || `Space #${space.space_id}`} - {space.space_type}
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
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Allocation Type</label>
                  <select
                    value={formData.allocation_type}
                    onChange={(e) => setFormData({ ...formData, allocation_type: e.target.value })}
                    className="input"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary">
                  Create Allocation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
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

      {/* Details Modal */}
      {showDetails && allocationDetailsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Allocation Details</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedAllocation(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Allocation Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Allocation ID:</span> {allocationDetailsData.allocation_id}</p>
                  <p><span className="font-medium">Seller ID:</span> {allocationDetailsData.seller_id}</p>
                  <p><span className="font-medium">Space ID:</span> {allocationDetailsData.space_id}</p>
                  <p><span className="font-medium">Start Date:</span> {allocationDetailsData.start_date ? format(new Date(allocationDetailsData.start_date), 'MMM dd, yyyy') : 'N/A'}</p>
                  <p><span className="font-medium">End Date:</span> {allocationDetailsData.end_date ? format(new Date(allocationDetailsData.end_date), 'MMM dd, yyyy') : 'N/A'}</p>
                  <p><span className="font-medium">Type:</span> {allocationDetailsData.allocation_type || 'N/A'}</p>
                  <p><span className="font-medium">Status:</span> {allocationDetailsData.status}</p>
                  {allocationDetailsData.notes && (
                    <p><span className="font-medium">Notes:</span> {allocationDetailsData.notes}</p>
                  )}
                </div>
              </div>
            </div>

            {payments && payments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payments</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3">Payment ID</th>
                        <th className="text-left py-2 px-3">Amount</th>
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment: any) => (
                        <tr key={payment.payment_id} className="border-b border-gray-100">
                          <td className="py-2 px-3">#{payment.payment_id}</td>
                          <td className="py-2 px-3">${payment.amount || 0}</td>
                          <td className="py-2 px-3">{payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'N/A'}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerAllocations


