import { useQuery } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { paymentService } from '../../services/paymentService'
import { Download, CreditCard, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { authService } from '../../services/authService'
import { useMemo, useState } from 'react'

type PaymentItem = {
  payment_id: number
  amount: number | string
  payment_method?: string
  mobile_money_provider?: string
  payment_date?: string
  status?: 'completed' | 'pending' | 'failed' | string
}

const SellerPayments = () => {
  const { user } = useAuthStore()
  const userId = user?.userId

  // Fetch user profile to derive seller_id
  const { data: userProfileData, isLoading: userProfileLoading } = useQuery(
    ['user-profile', userId],
    () => authService.getProfile(),
    { enabled: !!userId, retry: false, onError: () => {} }
  )
  const sellerId = userProfileData?.data?.profile?.seller_id || userProfileData?.data?.user_id || userId

  // Fetch payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery(
    ['seller-payments', sellerId],
    () => paymentService.getAll({ seller_id: sellerId }),
    { enabled: !!sellerId, retry: false, onError: () => {} }
  )

  const paymentsList: PaymentItem[] = useMemo(() => (paymentsData?.data || []) as PaymentItem[], [paymentsData])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [method, setMethod] = useState<'all' | 'mobile_money' | 'bank_transfer' | 'cash' | 'card'>('all')

  const filteredPayments: PaymentItem[] = useMemo(() => {
    const q = search.toLowerCase()
    return paymentsList.filter((p: PaymentItem) => {
      const matchesText = !q ||
        String(p.payment_id).toLowerCase().includes(q) ||
        String(p.amount).toLowerCase().includes(q) ||
        (p.payment_method || '').toLowerCase().includes(q) ||
        (p.payment_date ? format(new Date(p.payment_date), 'MMM dd, yyyy').toLowerCase().includes(q) : false)
      const matchesStatus = status === 'all' || p.status === status
      const methodLabel = (p.payment_method && p.payment_method.trim().length > 0)
        ? p.payment_method
        : p.mobile_money_provider === 'lanari'
          ? 'mobile_money'
          : p.mobile_money_provider || 'unknown'
      const matchesMethod = method === 'all' || methodLabel === method
      return matchesText && matchesStatus && matchesMethod
    })
  }, [paymentsList, search, status, method])

  const exportCsv = () => {
    const rows = [['Payment ID', 'Amount', 'Method', 'Date', 'Status']]
    filteredPayments.forEach((p) => {
      const methodLabel = p.payment_method && p.payment_method.trim().length > 0
        ? p.payment_method
        : p.mobile_money_provider === 'lanari'
        ? 'mobile_money_lanari'
        : p.mobile_money_provider || 'unknown'
      rows.push([
        String(p.payment_id),
        String(Number(p.amount || 0).toFixed(2)),
        methodLabel,
        p.payment_date ? format(new Date(p.payment_date), 'yyyy-MM-dd') : '',
        String(p.status || '')
      ])
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payments.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (userProfileLoading || paymentsLoading) {
    return <div className="text-center py-12">Loading payments...</div>
  }

  // Ensure all amounts are numbers
  const totalPaid = paymentsList.reduce((sum: number, p: PaymentItem) => {
    const amount = Number(p.amount) || 0
    return sum + (p.status === 'completed' ? amount : 0)
  }, 0)

  const pendingAmount = paymentsList.reduce((sum: number, p: PaymentItem) => {
    const amount = Number(p.amount) || 0
    return sum + (p.status === 'pending' ? amount : 0)
  }, 0)

 const totalRevenue = paymentsList.reduce((sum: number, p: PaymentItem) => {
  return sum + (Number(p.amount) || 0)
}, 0)


  return (
    <div className="container space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Payments</h1>
          <p className="text-gray-600 mt-1">View, filter, and export your payment history.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Filters */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="label">Search</label>
            <input className="input" placeholder="ID, amount, method, date" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value as 'all' | 'completed' | 'pending' | 'failed')}>
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="label">Method</label>
            <select className="input" value={method} onChange={e => setMethod(e.target.value as 'all' | 'mobile_money' | 'bank_transfer' | 'cash' | 'card')}>
              <option value="all">All</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>
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
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => {
                  const methodLabel = payment.payment_method && payment.payment_method.trim().length > 0
                    ? payment.payment_method
                    : payment.mobile_money_provider === 'lanari'
                    ? 'mobile_money_lanari'
                    : payment.mobile_money_provider || 'unknown'
                  return (
                    <tr key={payment.payment_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">#{payment.payment_id}</td>
                      <td className="py-3 px-4 font-medium">${Number(payment.amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 capitalize">{methodLabel.replace('_', ' ')}</td>
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
                          onClick={async () => {
                            try {
                              const blob = await paymentService.generateReceipt(payment.payment_id)
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `receipt-${payment.payment_id}.pdf`
                              a.click()
                              window.URL.revokeObjectURL(url)
                            } catch (err) {
                              console.error('Receipt download failed:', err)
                              // Receipt generation might not be available, silently fail
                            }
                          }}
                          className="text-primary-600 hover:text-primary-700"
                          title="Download Receipt"
                        >
                          <Download size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })
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
