import { useQuery } from 'react-query'
import { sellerService, Seller } from '../../services/sellerService'
import { X, AlertCircle, DollarSign, MapPin, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface SellerDetailsModalProps {
  seller: Seller | null
  isOpen: boolean
  onClose: () => void
}

export const SellerDetailsModal = ({ seller, isOpen, onClose }: SellerDetailsModalProps) => {
  const sellerId = seller?.id
  const start_date = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd')
  const end_date = format(new Date(), 'yyyy-MM-dd')

  const { data: allocations, isLoading: allocLoading } = useQuery(
    ['seller-allocations', sellerId],
    () => sellerService.getAllocations(sellerId!),
    { enabled: !!sellerId && isOpen }
  )

  const { data: payments, isLoading: paymentLoading } = useQuery(
    ['seller-payments', sellerId],
    () => sellerService.getPayments(sellerId!, { start_date, end_date }),
    { enabled: !!sellerId && isOpen }
  )

  const { data: sellerStats, isLoading: statsLoading } = useQuery(
    ['seller-statistics', sellerId],
    () => sellerService.getStatistics(sellerId!),
    { enabled: !!sellerId && isOpen }
  )

  if (!isOpen || !seller) return null

  const totalAllocations = allocations?.length || 0
  const activeAllocations = allocations?.filter((a) => a.status === 'active')?.length || 0
  const totalPayments = payments?.reduce((sum: number, p) => sum + (p.amount || 0), 0) || 0
  const completedPayments = payments?.filter((p) => p.status === 'completed')?.length || 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{seller.business_name || seller.user?.username}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {seller.business_type && `${seller.business_type} • `}
              Registered: {format(new Date(seller.registration_date), 'MMM dd, yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Seller Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-600 uppercase">Contact</p>
              <p className="text-sm text-gray-900 mt-1">{seller.user?.email}</p>
              <p className="text-sm text-gray-900">{seller.phone_number}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-600 uppercase">Address</p>
              <p className="text-sm text-gray-900 mt-1">{seller.address || 'N/A'}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 uppercase">Active Allocations</p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">{activeAllocations}</p>
                  <p className="text-xs text-blue-600 mt-1">of {totalAllocations} total</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-300" />
              </div>
            </div>

            <div className="card bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase">Total Payments</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">RWF {totalPayments.toFixed(2)}</p>
                  <p className="text-xs text-green-600 mt-1">{completedPayments} completed</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-300" />
              </div>
            </div>

            <div className="card bg-purple-50 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700 uppercase">Status</p>
                  <p className={`text-sm font-semibold mt-2 ${
                    seller.status === 'active' ? 'text-green-600' :
                    seller.status === 'inactive' ? 'text-gray-600' :
                    'text-red-600'
                  }`}>
                    {seller.status?.toUpperCase()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-300" />
              </div>
            </div>
          </div>

          {/* Allocations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin size={20} />
              <span>Space Allocations</span>
            </h3>
            {allocLoading ? (
              <div className="text-center py-4 text-gray-500">Loading allocations...</div>
            ) : allocations && allocations.length ? (
              <div className="space-y-2">
                {allocations.map((a) => (
                  <div key={a.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{a.space_code}</div>
                        <div className="text-sm text-gray-600">{a.zone_name}</div>
                        <div className="flex space-x-4 mt-2 text-xs text-gray-600">
                          <span>Rate: ${a.monthly_rate}/mo</span>
                          <span>Start: {format(new Date(a.start_date), 'MMM dd, yyyy')}</span>
                          {a.end_date && <span>End: {format(new Date(a.end_date), 'MMM dd, yyyy')}</span>}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        a.status === 'active' ? 'bg-green-100 text-green-800' :
                        a.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {a.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No allocations found</p>
              </div>
            )}
          </div>

          {/* Payments */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign size={20} />
              <span>Payments (Last 30 Days)</span>
            </h3>
            {paymentLoading ? (
              <div className="text-center py-4 text-gray-500">Loading payments...</div>
            ) : payments && payments.length ? (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">RWF {p.amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">{p.description}</div>
                        <div className="flex space-x-4 mt-2 text-xs text-gray-600">
                          <span>Method: {p.payment_method}</span>
                          <span>Date: {format(new Date(p.payment_date), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.status === 'completed' ? 'bg-green-100 text-green-800' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No payments found in the last 30 days</p>
              </div>
            )}
          </div>

          {/* Statistics */}
          {sellerStats && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <TrendingUp size={20} />
                <span>Statistics</span>
              </h3>
              {statsLoading ? (
                <div className="text-center py-4 text-gray-500">Loading statistics...</div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-xs text-gray-700 font-mono overflow-x-auto">
                    {JSON.stringify(sellerStats, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
