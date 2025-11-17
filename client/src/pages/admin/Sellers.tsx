import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
// Mock imports for independent execution
import { sellerService, Seller } from '../../services/sellerService'
import toast from 'react-hot-toast'
import { Search, Eye, Pencil, Trash2, UserPlus, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format } from 'date-fns'

// --- Mock Services and Types (For runnable demonstration) ---

// -----------------------------------------------------------

const AdminSellersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    business_name: '',
    phone_number: '',
    email: '',
    status: '' as Seller['status'] | ''
  })

  const queryClient = useQueryClient()

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const { data, isLoading } = useQuery(
    ['admin-sellers', debouncedSearchTerm],
    () =>
      sellerService.getAll({
        search: debouncedSearchTerm || undefined,
      })
  )

  // Normalize sellers data from backend into a flat array
  const sellersRaw: any = data
  let sellers: Seller[] = []
  if (Array.isArray(sellersRaw)) {
    sellers = sellersRaw
  } else if (Array.isArray(sellersRaw?.sellers)) {
    sellers = sellersRaw.sellers
  } else if (Array.isArray(sellersRaw?.data)) {
    sellers = sellersRaw.data
  } else if (Array.isArray(sellersRaw?.data?.sellers)) {
    sellers = sellersRaw.data.sellers
  }

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm])

  const totalSellers = sellers.length
  const totalPages = Math.max(1, Math.ceil(totalSellers / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedSellers = sellers.slice(startIndex, endIndex)

  const updateSellerMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Seller> }) => sellerService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-sellers')
        toast.success('Seller updated successfully')
        setShowEdit(false)
        setSelectedSeller(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update seller')
      },
    }
  )

  const deleteSellerMutation = useMutation((id: number) => sellerService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-sellers')
      toast.success('Seller deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete seller')
    },
  })

  const handleViewDetails = (seller: Seller) => {
    setSelectedSeller(seller)
    setShowDetails(true)
  }

  const handleOpenEdit = (seller: Seller) => {
    setSelectedSeller(seller)
    setEditForm({
      full_name: seller.full_name || '',
      business_name: seller.business_name || '',
      phone_number: seller.phone_number || '',
      email: seller.email || '',
      status: seller.status || 'active',
    })
    setShowEdit(true)
  }

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSeller) return

    if (!editForm.full_name.trim() || !editForm.business_name.trim()) {
      toast.error('Full name and business name are required')
      return
    }

    updateSellerMutation.mutate({
      id: selectedSeller.seller_id || selectedSeller.user_id,
      data: {
        full_name: editForm.full_name.trim(),
        business_name: editForm.business_name.trim(),
        phone_number: editForm.phone_number || undefined,
        email: editForm.email || undefined,
        status: (editForm.status as Seller['status']) || 'active',
      },
    })
  }

  const handleDeleteSeller = (seller: Seller) => {
    const label = seller.full_name || seller.business_name || `Seller #${seller.seller_id || seller.user_id}`
    if (confirm(`Are you sure you want to delete ${label}? This action cannot be undone.`)) {
      deleteSellerMutation.mutate(seller.seller_id || seller.user_id)
    }
  }

  const handleGoToRegistration = () => {
    // Adjust this path to match your actual seller registration route
    window.location.href = '/seller-registration'
  }

  if (isLoading) {
    return <div className="text-center py-12 text-blue-600 font-medium">Loading sellers...</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sellers Management</h1>
          <p className="text-gray-500 text-sm mt-1">View, manage, and maintain all registered sellers.</p>
        </div>
        <button
          onClick={handleGoToRegistration}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Register New Seller
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, business, or contact..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-500">
            Total sellers: <span className="font-semibold text-gray-800">{totalSellers}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="sticky top-0 bg-white shadow-sm z-10 border-b border-gray-200">
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Business</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Registered</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSellers.map((seller) => (
                  <tr key={seller.seller_id || seller.user_id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {seller.full_name || seller.username || seller.user?.username || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex flex-col">
                        <span>{seller.business_name || 'N/A'}</span>
                        <span className="text-xs text-gray-500">{seller.business_type || ''}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex flex-col">
                        <span>{seller.phone_number || 'N/A'}</span>
                        <span className="text-xs text-gray-500">{seller.email || ''}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          seller.status === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : seller.status === 'suspended'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {seller.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {seller.registration_date
                        ? format(new Date(seller.registration_date), 'MMM dd, yyyy')
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(seller)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(seller)}
                          className="text-amber-600 hover:text-amber-800 p-1.5 rounded-full hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                          title="Edit seller"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSeller(seller)}
                          className="text-gray-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                          title="Delete seller"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalSellers === 0 && (
            <div className="py-8 text-center text-gray-500 text-sm">No sellers found.</div>
          )}

          {totalSellers > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3 border-t pt-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{totalSellers === 0 ? 0 : startIndex + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(endIndex, totalSellers)}</span> of{' '}
                <span className="font-semibold">{totalSellers}</span> sellers
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
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Seller Details</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedSeller(null)
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Full Name</p>
                  <p className="text-gray-900 font-medium">{selectedSeller.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Username</p>
                  <p className="text-gray-900 font-medium">{selectedSeller.username || selectedSeller.user?.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                  <p className="text-gray-900">{selectedSeller.email || selectedSeller.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                  <p className="text-gray-900">{selectedSeller.phone_number || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Business Name</p>
                  <p className="text-gray-900 font-medium">{selectedSeller.business_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Business Type</p>
                  <p className="text-gray-900">{selectedSeller.business_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">TIN</p>
                  <p className="text-gray-900">{selectedSeller.tin_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Emergency Contact</p>
                  <p className="text-gray-900">{selectedSeller.emergency_contact || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
                <p className="text-gray-900">{selectedSeller.address || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 mt-1 rounded-full text-xs font-semibold border ${
                      selectedSeller.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : selectedSeller.status === 'suspended'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {selectedSeller.status || 'unknown'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Registered</p>
                  <p className="text-gray-900">
                    {selectedSeller.registration_date
                      ? format(new Date(selectedSeller.registration_date), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Seller</h2>
              <button
                onClick={() => {
                  setShowEdit(false)
                  setSelectedSeller(null)
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Business Name</label>
                <input
                  type="text"
                  name="business_name"
                  value={editForm.business_name}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter business name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={editForm.phone_number}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                </div>
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
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(false)
                    setSelectedSeller(null)
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

export default AdminSellersPage