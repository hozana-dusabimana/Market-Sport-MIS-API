import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { sellerService, Seller } from '../../services/sellerService'
import toast from 'react-hot-toast'
import { Search, Eye, UserCheck, UserX, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

const Sellers = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Seller>>({})
  const [sellerStats, setSellerStats] = useState<any>(null)
  const [sellerAllocations, setSellerAllocations] = useState<any[]>([])
  const [sellerPayments, setSellerPayments] = useState<any[]>([])
  const queryClient = useQueryClient()

  // 🔹 Fetch Sellers
  const { data, isLoading } = useQuery(
    ['sellers', statusFilter, searchTerm],
    () =>
      sellerService.getAll({
        verification_status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      })
  )

  const sellers = data?.data?.sellers || data?.data || []

  // 🔹 Verify / Reject
  const verifyMutation = useMutation(
    ({ id, status }: { id: number; status: 'verified' | 'rejected' }) =>
      sellerService.updateVerificationStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellers')
        toast.success('Seller verification updated!')
      },
      onError: (error: any) =>
        toast.error(error.response?.data?.message || 'Failed to update verification status'),
    }
  )

  const handleVerify = (seller: Seller, status: 'verified' | 'rejected') => {
    if (confirm(`Are you sure you want to ${status} this seller?`)) {
      verifyMutation.mutate({ id: seller.seller_id!, status })
    }
  }

  // 🔹 Delete Seller
  const deleteMutation = useMutation(
    (id: number) => sellerService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellers')
        toast.success('Seller deleted successfully!')
      },
      onError: (error: any) =>
        toast.error(error.response?.data?.message || 'Failed to delete seller'),
    }
  )

  const handleDelete = (seller: Seller) => {
    if (confirm(`Are you sure you want to delete ${seller.full_name}?`)) {
      deleteMutation.mutate(seller.seller_id!)
    }
  }

  // 🔹 Update Seller
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Seller> }) =>
      sellerService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellers')
        toast.success('Seller updated successfully!')
        setShowEditModal(false)
      },
      onError: (error: any) =>
        toast.error(error.response?.data?.message || 'Failed to update seller'),
    }
  )

  const handleEdit = (seller: Seller) => {
    setEditForm(seller)
    setShowEditModal(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.seller_id) return
    updateMutation.mutate({ id: editForm.seller_id, data: editForm })
  }

  // 🔹 View Details
  const handleViewDetails = async (seller: Seller) => {
    try {
      const response = await sellerService.getById(seller.seller_id!)
      if (response.success) {
        setSelectedSeller(response.data)
        setShowDetails(true)

        const [stats, alloc, pay] = await Promise.allSettled([
          sellerService.getStatistics(seller.seller_id!),
          sellerService.getAllocations(seller.seller_id!),
          sellerService.getPayments(seller.seller_id!),
        ])

        if (stats.status === 'fulfilled') setSellerStats(stats.value.data)
        if (alloc.status === 'fulfilled') setSellerAllocations(alloc.value.data || [])
        if (pay.status === 'fulfilled') setSellerPayments(pay.value.data || [])
      }
    } catch {
      toast.error('Failed to load seller details')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) return <div className="text-center py-12">Loading sellers...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Seller Management</h1>
        <Link to="/seller-registration" className="btn btn-primary">Register New Seller</Link>
      </div>

      {/* 🔍 Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, business, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* 📋 Seller List */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Name</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Business</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Email</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Status</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Registered</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller: Seller) => (
              <tr key={seller.seller_id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{seller.full_name}</td>
                <td className="py-3 px-4">{seller.business_name || 'N/A'}</td>
                <td className="py-3 px-4">{seller.email || 'N/A'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(seller.verification_status || 'pending')}`}>
                    {seller.verification_status || 'pending'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {seller.registration_date
                    ? format(new Date(seller.registration_date), 'MMM dd, yyyy')
                    : 'N/A'}
                </td>
                <td className="py-3 px-4 flex gap-2">
                  <button onClick={() => handleViewDetails(seller)} className="text-blue-600 hover:text-blue-700" title="View">
                    <Eye size={18} />
                  </button>
                  <button onClick={() => handleEdit(seller)} className="text-green-600 hover:text-green-700" title="Edit">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(seller)} className="text-red-600 hover:text-red-700" title="Delete">
                    <Trash2 size={18} />
                  </button>
                  {seller.verification_status === 'pending' && (
                    <>
                      <button onClick={() => handleVerify(seller, 'verified')} className="text-green-600 hover:text-green-700" title="Verify">
                        <UserCheck size={18} />
                      </button>
                      <button onClick={() => handleVerify(seller, 'rejected')} className="text-red-600 hover:text-red-700" title="Reject">
                        <UserX size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!sellers.length && <div className="text-center py-8 text-gray-500">No sellers found</div>}
      </div>

      {/* 🧾 Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Seller</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input
                type="text"
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="input w-full"
                placeholder="Full Name"
              />
              <input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="input w-full"
                placeholder="Email"
              />
              <input
                type="text"
                value={editForm.business_name || ''}
                onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                className="input w-full"
                placeholder="Business Name"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👁️ Details Modal (same as your old one) */}
      {showDetails && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Seller Details</h2>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <p><b>Name:</b> {selectedSeller.full_name}</p>
            <p><b>Email:</b> {selectedSeller.email}</p>
            <p><b>Business:</b> {selectedSeller.business_name}</p>
            <p><b>Status:</b> {selectedSeller.verification_status}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sellers
