import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { allocationService, Allocation } from '../../services/allocationService'
import { spaceService } from '../../services/spaceService'
import { sellerService } from '../../services/sellerService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, X, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const Allocations = () => {
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sellerFilter, setSellerFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    allocation_type: 'monthly',
    status: 'active' as Allocation['status'],
    notes: '' as string,
  })
  const [formData, setFormData] = useState<Partial<Allocation>>({
    seller_id: 0,
    space_id: 0,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    allocation_type: 'monthly',
    status: 'active',
  })

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Allocation> }) => allocationService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allocations')
        toast.success('Allocation updated successfully')
        setShowEdit(false)
        setSelectedAllocation(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update allocation')
      },
    }
  )

  const deleteMutation = useMutation((id: number) => allocationService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('allocations')
      queryClient.invalidateQueries('spaces')
      toast.success('Allocation deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete allocation')
    },
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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, sellerFilter])

  // Client-side pagination for allocations
  const totalAllocations = allocations.length
  const totalPages = Math.max(1, Math.ceil(totalAllocations / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedAllocations = allocations.slice(startIndex, endIndex)

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

  const handleViewDetails = (allocation: Allocation) => {
    setSelectedAllocation(allocation)
    setShowDetails(true)
  }

  const handleOpenEdit = (allocation: Allocation) => {
    setSelectedAllocation(allocation)
    setEditForm({
      start_date: allocation.start_date,
      end_date: allocation.end_date || '',
      allocation_type: allocation.allocation_type || 'monthly',
      status: allocation.status,
      notes: allocation.notes || '',
    })
    setShowEdit(true)
  }

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAllocation) return

    if (!editForm.start_date) {
      toast.error('Start date is required')
      return
    }

    updateMutation.mutate({
      id: selectedAllocation.allocation_id!,
      data: {
        start_date: editForm.start_date,
        end_date: editForm.end_date || undefined,
        allocation_type: editForm.allocation_type,
        status: editForm.status,
        notes: editForm.notes || undefined,
      },
    })
  }

  const handleDeleteAllocation = (allocation: Allocation) => {
    if (!allocation.allocation_id) return
    if (confirm('Are you sure you want to delete this allocation? This action cannot be undone.')) {
      deleteMutation.mutate(allocation.allocation_id)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Space Allocations</h1>
          <p className="text-sm text-gray-500">Manage seller space assignments across all zones.</p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true)
            resetForm()
          }}
          className="mt-4 sm:mt-0 flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-semibold shadow-sm hover:bg-blue-700 transition duration-200 text-sm"
        >
          <Plus size={18} />
          <span>New Allocation</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
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
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Seller</label>
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
        <div className="flex items-end">
          <div className="text-xs text-gray-500 bg-white rounded-lg border border-gray-200 px-3 py-2 w-full sm:w-auto">
            <span className="font-semibold text-gray-800">{totalAllocations}</span> total allocations
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100">
        {isLoading ? (
          <div className="p-6 text-center text-gray-600">Loading allocations...</div>
        ) : totalAllocations === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No allocations found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
                    <tr>
                      {['Seller', 'Space', 'Start Date', 'End Date', 'Status', 'Actions'].map((title) => (
                        <th key={title} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedAllocations.map((allocation: Allocation) => {
                      const seller = sellers.find((s: any) => s.seller_id === allocation.seller_id || s.user_id === allocation.seller_id)
                      const space = spaces.find((s: any) => s.space_id === allocation.space_id)
                      return (
                        <tr key={allocation.allocation_id} className="hover:bg-blue-50/40">
                          <td className="px-6 py-3 text-sm text-gray-900">
                            {seller?.full_name || seller?.business_name || allocation.seller_id}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">
                            {space?.space_number || space?.space_code || allocation.space_id}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700">
                            {format(new Date(allocation.start_date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700">
                            {allocation.end_date ? format(new Date(allocation.end_date), 'MMM dd, yyyy') : 'N/A'}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              allocation.status === 'active'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : allocation.status === 'expired'
                                ? 'bg-gray-50 text-gray-700 border border-gray-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {allocation.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewDetails(allocation)}
                                className="inline-flex items-center justify-center p-1.5 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(allocation)}
                                className="inline-flex items-center justify-center p-1.5 rounded-full text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                                title="Edit allocation"
                              >
                                <Pencil size={16} />
                              </button>
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
                                  className="inline-flex items-center justify-center p-1.5 rounded-full text-red-600 hover:text-red-800 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                                  title="Terminate allocation"
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAllocation(allocation)}
                                className="inline-flex items-center justify-center p-1.5 rounded-full text-gray-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                                title="Delete allocation"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3 border-t pt-4 px-4 pb-2">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{totalAllocations === 0 ? 0 : startIndex + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(endIndex, totalAllocations)}</span> of{' '}
                <span className="font-semibold">{totalAllocations}</span> allocations
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    currentPage === 1
                      ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1
                    const isActive = page === currentPage
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors border ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value) || 10)
                    setCurrentPage(1)
                  }}
                  className="ml-2 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </>
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

      {/* Details Modal */}
      {showDetails && selectedAllocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Allocation Details</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedAllocation(null)
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Seller ID</p>
                  <p className="text-gray-900 font-medium">{selectedAllocation.seller_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Space ID</p>
                  <p className="text-gray-900 font-medium">{selectedAllocation.space_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Start Date</p>
                  <p className="text-gray-900">{format(new Date(selectedAllocation.start_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">End Date</p>
                  <p className="text-gray-900">
                    {selectedAllocation.end_date
                      ? format(new Date(selectedAllocation.end_date), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Allocation Type</p>
                  <p className="text-gray-900">{selectedAllocation.allocation_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 mt-1 rounded-full text-xs font-semibold border ${
                      selectedAllocation.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : selectedAllocation.status === 'expired'
                        ? 'bg-gray-50 text-gray-700 border-gray-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {selectedAllocation.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Created At</p>
                  <p className="text-gray-900">
                    {selectedAllocation.created_at
                      ? format(new Date(selectedAllocation.created_at), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Updated At</p>
                  <p className="text-gray-900">
                    {selectedAllocation.updated_at
                      ? format(new Date(selectedAllocation.updated_at), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Notes</p>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedAllocation.notes || 'No notes provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selectedAllocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Allocation</h2>
              <button
                onClick={() => {
                  setShowEdit(false)
                  setSelectedAllocation(null)
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={editForm.start_date}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={editForm.end_date}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Allocation Type</label>
                  <select
                    name="allocation_type"
                    value={editForm.allocation_type}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={editForm.notes}
                  onChange={handleEditChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any relevant notes about this allocation"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(false)
                    setSelectedAllocation(null)
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow-sm"
                >
                  Save Changes
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
