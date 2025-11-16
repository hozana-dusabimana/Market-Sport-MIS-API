import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { paymentService, Payment } from '../../services/paymentService'
import { allocationService } from '../../services/allocationService'
import { sellerService } from '../../services/sellerService'
import { spaceService } from '../../services/spaceService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Download, DollarSign } from 'lucide-react'
import { format, subMonths } from 'date-fns'

const Payments = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))

  const [formData, setFormData] = useState<Partial<Payment>>({
    allocation_id: 0,
    seller_id: 0,
    amount: 0,
    payment_method: 'mobile_money',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'completed',
  })

  // Get zones managed by logged-in user
  const managedZoneIds =
    user?.user_type === 'manager' && user?.profile?.assigned_zones
      ? user.profile.assigned_zones
      : []

  /** ───────────────────────────────
   *  FETCH DATA
   *  ─────────────────────────────── */
  const { data: allocationsData } = useQuery(
    ['allocations', managedZoneIds],
    () => allocationService.getAll(),
    { enabled: true, retry: false }
  )

  const { data: spacesData } = useQuery(
    ['spaces', managedZoneIds],
    () => spaceService.getAll(),
    { enabled: true, retry: false }
  )

  const { data: sellersData } = useQuery(
    ['sellers'],
    () => sellerService.getAll(),
    { retry: false }
  )

  const { data: paymentsData, isLoading } = useQuery(
    ['payments', statusFilter, methodFilter, dateFrom, dateTo],
    () =>
      paymentService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payment_method: methodFilter !== 'all' ? methodFilter : undefined,
        date_from: dateFrom,
        date_to: dateTo,
      }),
    { retry: false }
  )

  const { data: revenueData } = useQuery(
    ['revenue-total', dateFrom, dateTo],
    () => paymentService.getTotalRevenue({ date_from: dateFrom, date_to: dateTo }),
    { retry: false }
  )

  const { data: revenueByMethod } = useQuery(
    ['revenue-by-method', dateFrom, dateTo],
    () => paymentService.getRevenueByMethod({ date_from: dateFrom, date_to: dateTo }),
    { retry: false }
  )

  /** ───────────────────────────────
   *  DATA PREPARATION
   *  ─────────────────────────────── */
  const allPayments = paymentsData?.data || []
  const allAllocations = allocationsData?.data || []
  const allSpaces = spacesData?.data || []
  const sellers = sellersData?.data?.sellers || sellersData?.data || []

  // Filter data for managers only
  const managedSpaces = managedZoneIds.length
    ? allSpaces.filter((s) => managedZoneIds.includes(s.zone_id))
    : allSpaces
  const managedSpaceIds = managedSpaces.map((s) => s.space_id)

  const managedAllocations = managedZoneIds.length
    ? allAllocations.filter((a) => managedSpaceIds.includes(a.space_id))
    : allAllocations
  const managedAllocationIds = managedAllocations.map((a) => a.allocation_id)

  const payments = managedZoneIds.length
    ? allPayments.filter((p) => managedAllocationIds.includes(p.allocation_id))
    : allPayments

  const totalRevenue = revenueData?.data?.total_revenue || 0

  /** ───────────────────────────────
   *  MUTATIONS
   *  ─────────────────────────────── */
  const createMutation = useMutation(
    (payment: Payment) => {
      // Restrict manager creation
      if (user?.user_type === 'manager' && managedZoneIds.length) {
        if (!managedAllocationIds.includes(payment.allocation_id)) {
          toast.error('You can only record payments for your managed zones.')
          throw new Error('Unauthorized')
        }
      }
      return paymentService.create(payment)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('payments')
        toast.success('Payment recorded successfully')
        setIsModalOpen(false)
        resetForm()
      },
      onError: (err: any) => {
        if (err.message !== 'Unauthorized') {
          toast.error(err.response?.data?.message || 'Failed to record payment')
        }
      },
    }
  )

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => paymentService.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('payments')
        toast.success('Payment status updated successfully')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to update payment status')
      },
    }
  )

  /** ───────────────────────────────
   *  HELPERS
   *  ─────────────────────────────── */
  const resetForm = () => {
    setFormData({
      allocation_id: 0,
      seller_id: 0,
      amount: 0,
      payment_method: 'mobile_money',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'completed',
      mobile_money_number: '',
      mobile_money_provider: '',
      payment_reference: '',
      transaction_id: '',
      notes: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData as Payment)
  }

  /** ───────────────────────────────
   *  RENDER
   *  ─────────────────────────────── */
  if (isLoading) return <div className="text-center py-12">Loading payments...</div>

  return (
    <div>
      {/* ─────────── HEADER ─────────── */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <button
          onClick={() => {
            setIsModalOpen(true)
            resetForm()
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Record Payment</span>
        </button>
      </div>

      {/* ─────────── STATS ─────────── */}
      {totalRevenue > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg font-semibold">
  {Number(totalRevenue || 0).toFixed(2)}
</p>

                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(dateFrom), 'MMM dd')} - {format(new Date(dateTo), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {revenueByMethod?.data?.length > 0 && (
            <div className="card col-span-2">
              <p className="text-sm font-medium text-gray-600 mb-3">Revenue by Payment Method</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {revenueByMethod.data.map((method: any) => (
                  <div key={method.payment_method} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 capitalize">{method.payment_method?.replace('_', ' ')}</p>
                    <p className="text-lg font-bold">${(method.total || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────── FILTERS ─────────── */}
      <div className="card mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="input w-auto">
          <option value="all">All Methods</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
      </div>

      {/* ─────────── TABLE ─────────── */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Seller</th>
              <th className="text-left py-3 px-4">Amount</th>
              <th className="text-left py-3 px-4">Method</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: Payment) => {
              const seller = sellers.find(
                (s: any) => s.seller_id === p.seller_id || s.user_id === p.seller_id
              )
              return (
                <tr key={p.payment_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">#{p.payment_id}</td>
                  <td className="py-3 px-4">{seller?.full_name || seller?.business_name || p.seller_id}</td>
                  <td className="py-3 px-4 font-medium">${p.amount}</td>
                  <td className="py-3 px-4 capitalize">{p.payment_method?.replace('_', ' ')}</td>
                  <td className="py-3 px-4">{format(new Date(p.payment_date), 'MMM dd, yyyy')}</td>
                  <td className="py-3 px-4">
                    <select
                      value={p.status}
                      onChange={(e) => {
                        if (confirm(`Change payment status to ${e.target.value}?`)) {
                          updateStatusMutation.mutate({ id: p.payment_id!, status: e.target.value })
                        }
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium border-0 ${
                        p.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : p.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : p.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {p.status === 'completed' && (
                      <button
                        onClick={() => {
                          paymentService
                            .generateReceipt(p.payment_id!)
                            .then((blob) => {
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `receipt-${p.payment_id}.pdf`
                              a.click()
                            })
                            .catch(() => toast.error('Receipt generation not available'))
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
            })}
          </tbody>
        </table>
      </div>

      {/* ─────────── MODAL ─────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Seller *</label>
                  <select
                    value={formData.seller_id || 0}
                    onChange={(e) => setFormData({ ...formData, seller_id: parseInt(e.target.value) })}
                    className="input"
                    required
                  >
                    <option value={0}>Select Seller</option>
                    {sellers.map((s: any) => (
                      <option key={s.seller_id} value={s.seller_id}>
                        {s.full_name || s.business_name || `Seller ${s.seller_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Allocation *</label>
                  <select
                    value={formData.allocation_id || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, allocation_id: parseInt(e.target.value) })
                    }
                    className="input"
                    required
                  >
                    <option value={0}>Select Allocation</option>
                    {managedAllocations
                      .filter((a: any) => a.seller_id === formData.seller_id || !formData.seller_id)
                      .map((a: any) => (
                        <option key={a.allocation_id} value={a.allocation_id}>
                          Allocation #{a.allocation_id} - Space {a.space_id}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="label">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) })
                    }
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_method: e.target.value as any })
                    }
                    className="input"
                    required
                  >
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                {formData.payment_method === 'mobile_money' && (
                  <>
                    <div>
                      <label className="label">Mobile Money Number *</label>
                      <input
                        type="tel"
                        value={formData.mobile_money_number || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, mobile_money_number: e.target.value })
                        }
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Provider</label>
                      <select
                        value={formData.mobile_money_provider || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, mobile_money_provider: e.target.value })
                        }
                        className="input"
                      >
                        <option value="">Select Provider</option>
                        <option value="mtn">MTN</option>
                        <option value="airtel">Airtel</option>
                        <option value="orange">Orange</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="label">Payment Date *</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_date: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Reference</label>
                  <input
                    type="text"
                    value={formData.payment_reference || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_reference: e.target.value })
                    }
                    className="input"
                    placeholder="Transaction reference"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="btn btn-primary"
                >
                  {createMutation.isLoading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
