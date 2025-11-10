import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { sellerService, Seller } from '../../services/sellerService'
import toast from 'react-hot-toast'
import { Search, CheckCircle, XCircle, Clock, Eye, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

const Sellers = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [sellerStats, setSellerStats] = useState<any>(null)
  const [sellerAllocations, setSellerAllocations] = useState<any[]>([])
  const [sellerPayments, setSellerPayments] = useState<any[]>([])

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['sellers', statusFilter, searchTerm],
    () =>
      sellerService.getAll({
        verification_status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      })
  )

  const verifyMutation = useMutation(
    ({ id, status }: { id: number; status: 'verified' | 'rejected' }) =>
      sellerService.updateVerificationStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellers')
        toast.success('Verification status updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update verification status')
      },
    }
  )

  const handleVerify = (seller: Seller, status: 'verified' | 'rejected') => {
    if (confirm(`Are you sure you want to ${status === 'verified' ? 'verify' : 'reject'} this seller?`)) {
      verifyMutation.mutate({ id: seller.seller_id!, status })
    }
  }

  const handleViewDetails = async (seller: Seller) => {
    try {
      const response = await sellerService.getById(seller.seller_id!)
      if (response.success) {
        setSelectedSeller(response.data)
        setShowDetails(true)
        
        // Load seller statistics
        try {
          const statsResponse = await sellerService.getStatistics(seller.seller_id!)
          if (statsResponse.success) {
            setSellerStats(statsResponse.data)
          }
        } catch (e) {
          console.error('Failed to load statistics')
        }
        
        // Load seller allocations
        try {
          const allocResponse = await sellerService.getAllocations(seller.seller_id!)
          if (allocResponse.success) {
            setSellerAllocations(allocResponse.data || [])
          }
        } catch (e) {
          console.error('Failed to load allocations')
        }
        
        // Load seller payments
        try {
          const payResponse = await sellerService.getPayments(seller.seller_id!)
          if (payResponse.success) {
            setSellerPayments(payResponse.data || [])
          }
        } catch (e) {
          console.error('Failed to load payments')
        }
      }
    } catch (error: any) {
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

  if (isLoading) {
    return <div className="text-center py-12">Loading sellers...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Seller Management</h1>
        <Link to="/seller-registration" className="btn btn-primary">
          Register New Seller
        </Link>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, business, or ID number..."
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

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Business</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID Number</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Registered</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((seller: Seller) => (
                <tr key={seller.seller_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{seller.full_name}</td>
                  <td className="py-3 px-4">{seller.business_name || 'N/A'}</td>
                  <td className="py-3 px-4">{seller.id_number}</td>
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
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(seller)}
                        className="text-primary-600 hover:text-primary-700"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {seller.verification_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVerify(seller, 'verified')}
                            className="text-green-600 hover:text-green-700"
                            title="Verify"
                          >
                            <UserCheck size={18} />
                          </button>
                          <button
                            onClick={() => handleVerify(seller, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                            title="Reject"
                          >
                            <UserX size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.data?.length && (
            <div className="text-center py-8 text-gray-500">No sellers found</div>
          )}
        </div>
      </div>

      {showDetails && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Seller Details</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedSeller(null)
                  setSellerStats(null)
                  setSellerAllocations([])
                  setSellerPayments([])
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {sellerStats && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Allocations</p>
                      <p className="text-xl font-bold text-gray-900">{sellerStats.total_allocations || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Allocations</p>
                      <p className="text-xl font-bold text-green-600">{sellerStats.active_allocations || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Payments</p>
                      <p className="text-xl font-bold text-gray-900">{sellerStats.total_payments || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Paid</p>
                      <p className="text-xl font-bold text-green-600">${(sellerStats.total_paid || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-900">{selectedSeller.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ID Number</label>
                  <p className="text-gray-900">{selectedSeller.id_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedSeller.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{selectedSeller.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Name</label>
                  <p className="text-gray-900">{selectedSeller.business_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Type</label>
                  <p className="text-gray-900">{selectedSeller.business_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">TIN Number</label>
                  <p className="text-gray-900">{selectedSeller.tin_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Verification Status</label>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(selectedSeller.verification_status || 'pending')}`}>
                    {selectedSeller.verification_status || 'pending'}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{selectedSeller.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                  <p className="text-gray-900">{selectedSeller.emergency_contact || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Registration Date</label>
                  <p className="text-gray-900">
                    {selectedSeller.registration_date
                      ? format(new Date(selectedSeller.registration_date), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              {sellerAllocations.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Allocations ({sellerAllocations.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {sellerAllocations.slice(0, 5).map((alloc: any) => (
                      <div key={alloc.allocation_id} className="bg-gray-50 p-2 rounded text-sm">
                        <p className="font-medium">Space: {alloc.space_code || alloc.space_number} - Zone: {alloc.zone_name || alloc.zone_code}</p>
                        <p className="text-gray-600">Status: {alloc.status} | Started: {format(new Date(alloc.start_date), 'MMM dd, yyyy')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {sellerPayments.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Payments ({sellerPayments.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {sellerPayments.slice(0, 5).map((payment: any) => (
                      <div key={payment.payment_id} className="bg-gray-50 p-2 rounded text-sm">
                        <p className="font-medium">${payment.amount} - {payment.payment_method?.replace('_', ' ')}</p>
                        <p className="text-gray-600">Status: {payment.status} | Date: {format(new Date(payment.payment_date), 'MMM dd, yyyy')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sellers

