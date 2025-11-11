import { useQuery } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { paymentService } from '../../services/paymentService'
import { sellerService } from '../../services/sellerService'
import { Download, CreditCard, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const SellerPayments = () => {
  const { user } = useAuthStore()
  const userId = user?.userId

  // Fetch seller profile
  const { data: sellerProfileResponse, isLoading: profileLoading } = useQuery(
    ['seller-profile', userId],
    () => sellerService.getAll({ id: userId }),
    { enabled: !!userId && user?.user_type === 'seller', retry: false, onError: () => {} }
  )

  const sellerProfile = sellerProfileResponse?.data?.sellers?.[0] || sellerProfileResponse?.data
  const sellerId = sellerProfile?.seller_id || sellerProfile?.user_id || userId

  // Fetch payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery(
    ['seller-payments', sellerId],
    () => paymentService.getAll({ seller_id: sellerId }),
    { enabled: !!sellerId, retry: false, onError: () => {} }
  )

  const payments = paymentsData?.data || []

  if (profileLoading || paymentsLoading) {
    return <div className="text-center py-12">Loading payments...</div>
  }

  // Ensure all amounts are numbers
  const totalPaid = payments.reduce((sum: number, p: any) => {
    const amount = Number(p.amount) || 0
    return sum + (p.status === 'completed' ? amount : 0)
  }, 0)

  const pendingAmount = payments.reduce((sum: number, p: any) => {
    const amount = Number(p.amount) || 0
    return sum + (p.status === 'pending' ? amount : 0)
  }, 0)

 const totalRevenue = payments.reduce((sum: number, p: any) => {
  return sum + (Number(p.amount) || 0)
}, 0)


  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Payments</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${pendingAmount.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment: any) => (
                  <tr key={payment.payment_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">#{payment.payment_id}</td>
                    <td className="py-3 px-4 font-medium">${Number(payment.amount || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : payment.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {payment.status === 'completed' && (
                        <button
                          onClick={() => {
                            paymentService.generateReceipt(payment.payment_id).then((blob) => {
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `receipt-${payment.payment_id}.pdf`
                              a.click()
                            })
                          }}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Download size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No payment history
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SellerPayments
