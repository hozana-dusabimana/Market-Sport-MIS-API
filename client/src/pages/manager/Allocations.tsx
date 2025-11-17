import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { allocationService, Allocation } from '../../services/allocationService'
import { spaceService } from '../../services/spaceService'
import { sellerService } from '../../services/sellerService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, X, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const ManagerAllocations = () => {
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sellerFilter, setSellerFilter] = useState<string>('all')
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    allocation_type: 'monthly' as Allocation['allocation_type'],
    status: 'active' as Allocation['status'],
    notes: '' as string,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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

  const { data: allocationsData, isLoading: allocationsLoading } = useQuery(
    ['manager-allocations', statusFilter, sellerFilter],
    () =>
      allocationService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        seller_id: sellerFilter !== 'all' ? Number(sellerFilter) : undefined,
      })
  )

  const { data: spacesData } = useQuery(['spaces'], () => spaceService.getAvailable())
  const { data: sellersData } = useQuery(['sellers'], () => sellerService.getAll(managerId ? { manager_id: managerId } : undefined))

  const allocations = allocationsData?.data || allocationsData || []
  const spaces = spacesData?.data || []
  const sellers = sellersData?.data?.sellers || sellersData?.data || []

  const createMutation = useMutation((allocation: Allocation) => allocationService.create(allocation), {
    onSuccess: () => {
      queryClient.invalidateQueries('manager-allocations')
      toast.success('Allocation created successfully')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create allocation')
    },
  })

  const updateMutation = useMutation(
    (payload: { id: number; data: Partial<Allocation> }) => allocationService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('manager-allocations')
        toast.success('Allocation updated successfully')
        setShowEdit(false)
        setSelectedAllocation(null)
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to update allocation')
      },
    }
  )

  const deleteMutation = useMutation((id: number) => allocationService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('manager-allocations')
      toast.success('Allocation deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete allocation')
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

  const handleViewDetails = (allocation: Allocation) => {
    setSelectedAllocation(allocation)
    setShowDetails(true)
  }

  const handleOpenEdit = (allocation: Allocation) => {
    setSelectedAllocation(allocation)
    setEditForm({
      start_date: allocation.start_date ? format(new Date(allocation.start_date), 'yyyy-MM-dd') : '',
      end_date: allocation.end_date ? format(new Date(allocation.end_date), 'yyyy-MM-dd') : '',
      allocation_type: allocation.allocation_type || 'monthly',
      status: allocation.status || 'active',
      notes: (allocation as any).notes || '',
    })
    setShowEdit(true)
  }

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAllocation?.allocation_id) return
    updateMutation.mutate({
      id: selectedAllocation.allocation_id,
      data: {
        start_date: editForm.start_date,
        end_date: editForm.end_date || null,
        allocation_type: editForm.allocation_type,
        status: editForm.status,
        notes: editForm.notes,
      },
    })
  }

  const handleDeleteAllocation = (allocation: Allocation) => {
    if (!allocation.allocation_id) return
    if (!window.confirm('Are you sure you want to delete this allocation? This action cannot be undone.')) {
      return
    }
    deleteMutation.mutate(allocation.allocation_id)
  }

  const totalAllocations = allocations.length
  const totalPages = totalAllocations > 0 ? Math.ceil(totalAllocations / pageSize) : 1
  const safePage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedAllocations = allocations.slice(startIndex, endIndex)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Managed Allocations</h1>
          <p className="text-gray-600 mt-1">View and manage allocations across your zones.</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Create Allocation</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="input w-48"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="label">Seller</label>
            <select
              value={sellerFilter}
              onChange={(e) => {
                setSellerFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="input w-56"
            >
              <option value="all">All Sellers</option>
              {sellers.map((seller: any) => (
                <option key={seller.seller_id || seller.user_id} value={seller.seller_id || seller.user_id}>
                  {seller.business_name || seller.full_name || 'N/A'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="input w-24"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Allocations</h2>
          <span className="text-sm text-gray-500">Total: {totalAllocations}</span>
        </div>
        <div className="overflow-x-auto -mx-4 sm:-mx-6">
          <div className="inline-block min-w-full align-middle px-4 sm:px-6">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Seller</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Space</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Start Date</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">End Date</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {allocationsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                      Loading allocations...
                    </td>
                  </tr>
                ) : paginatedAllocations.length > 0 ? (
                  paginatedAllocations.map((allocation: Allocation) => {
                    const seller = sellers.find((s: any) => (s.seller_id || s.user_id) === allocation.seller_id)
                    const space = spaces.find((s: any) => s.space_id === allocation.space_id)
                    return (
                      <tr key={allocation.allocation_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{seller?.business_name || 'N/A'}</span>
                            {seller?.full_name && (
                              <span className="text-xs text-gray-500">{seller.full_name}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-medium text-gray-900">
                            {space?.space_number || `Space #${allocation.space_id}`}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {allocation.start_date
                            ? format(new Date(allocation.start_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="px-3 py-2">
                          {allocation.end_date
                            ? format(new Date(allocation.end_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="px-3 py-2 capitalize">{allocation.allocation_type || 'N/A'}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                              ${allocation.status === 'active'
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : allocation.status === 'expired'
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                : allocation.status === 'terminated'
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : 'bg-gray-50 text-gray-700 border border-gray-100'
                              }
                            `}
                          >
                            {allocation.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleViewDetails(allocation)}
                              className="p-1.5 rounded border border-transparent text-blue-600 hover:text-blue-700 hover:border-blue-100"
                              aria-label="View allocation details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(allocation)}
                              className="p-1.5 rounded border border-transparent text-amber-600 hover:text-amber-700 hover:border-amber-100"
                              aria-label="Edit allocation"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAllocation(allocation)}
                              className="p-1.5 rounded border border-transparent text-red-600 hover:text-red-700 hover:border-red-100"
                              aria-label="Delete allocation"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                      No allocations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalAllocations > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3 border-t pt-4 text-sm text-gray-600">
            <div>
              Showing{' '}
              <span className="font-medium">{totalAllocations === 0 ? 0 : startIndex + 1}</span>
              {' '}
              to{' '}
              <span className="font-medium">{Math.min(endIndex, totalAllocations)}</span>
              {' '}
              of{' '}
              <span className="font-medium">{totalAllocations}</span>
              {' '}allocations
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded text-xs border flex items-center justify-center ${
                        page === safePage
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
              <button
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
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

      {/* Details Modal */}
      {showDetails && selectedAllocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">Allocation Details</h2>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => {
                  setShowDetails(false)
                  setSelectedAllocation(null)
                }}
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Seller ID</p>
                <p className="font-medium text-gray-900">{selectedAllocation.seller_id}</p>
              </div>
              <div>
                <p className="text-gray-500">Space ID</p>
                <p className="font-medium text-gray-900">{selectedAllocation.space_id}</p>
              </div>
              <div>
                <p className="text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">
                  {selectedAllocation.start_date
                    ? format(new Date(selectedAllocation.start_date), 'MMM dd, yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">End Date</p>
                <p className="font-medium text-gray-900">
                  {selectedAllocation.end_date
                    ? format(new Date(selectedAllocation.end_date), 'MMM dd, yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Type</p>
                <p className="font-medium text-gray-900">{selectedAllocation.allocation_type}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{selectedAllocation.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selectedAllocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Allocation</h2>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => {
                  setShowEdit(false)
                  setSelectedAllocation(null)
                }}
                aria-label="Close edit"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={editForm.start_date}
                    onChange={handleEditChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={editForm.end_date}
                    onChange={handleEditChange}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Allocation Type</label>
                  <select
                    name="allocation_type"
                    value={editForm.allocation_type}
                    onChange={handleEditChange}
                    className="input"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="input"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  name="notes"
                  value={editForm.notes}
                  onChange={handleEditChange}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(false)
                    setSelectedAllocation(null)
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updateMutation.isLoading}
                >
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
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
