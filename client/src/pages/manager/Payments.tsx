import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { paymentService, Payment } from '../../services/paymentService'
import { allocationService } from '../../services/allocationService'
import { sellerService } from '../../services/sellerService'
import { spaceService } from '../../services/spaceService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Download, CreditCard, DollarSign } from 'lucide-react'
import { format, subMonths } from 'date-fns'

const ManagerPayments = () => {
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>(format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [formData, setFormData] = useState<Partial<Payment>>({
    allocation_id: 0,
    seller_id: 0,
    amount: 0,
    payment_method: 'mobile_money',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'completed',
  })

  const queryClient = useQueryClient()
  const managedZoneIds = user?.profile?.assigned_zones || []

  // Fetch allocations to filter payments by manager's zones
  const { data: allocationsData } = useQuery(
    ['allocations-for-payments', managedZoneIds],
    () => allocationService.getAll(),
    { retry: false, onError: () => {} }
  )

  // Fetch spaces to get space-zone mapping
  const { data: spacesData } = useQuery(
    ['spaces-for-payments', managedZoneIds],
    () => spaceService.getAll(),
    { retry: false, onError: () => {} }
  )

  const { data: paymentsData, isLoading } = useQuery(
    ['payments', statusFilter, methodFilter, dateFrom, dateTo, managedZoneIds],
    () => paymentService.getAll({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      payment_method: methodFilter !== 'all' ? methodFilter : undefined,
      date_from: dateFrom,
      date_to: dateTo,
    }),
    { retry: false, onError: () => {} }
  )
  
  const { data: revenueData } = useQuery(
    ['revenue-total', dateFrom, dateTo],
    () => paymentService.getTotalRevenue({ date_from: dateFrom, date_to: dateTo }),
    { retry: false, onError: () => {} }
  )
  
  const { data: revenueByZone } = useQuery(
    ['revenue-by-zone', dateFrom, dateTo],
    () => paymentService.getRevenueByZone({ date_from: dateFrom, date_to: dateTo }),
    { retry: false, onError: () => {} }
  )
  
  const { data: revenueByMethod } = useQuery(
    ['revenue-by-method', dateFrom, dateTo],
    () => paymentService.getRevenueByMethod({ date_from: dateFrom, date_to: dateTo }),
    { retry: false, onError: () => {} }
  )
  
  const { data: allocationsListData } = useQuery('allocations-list', () => allocationService.getAll(), {
    retry: false,
    onError: () => {},
  })
  
  const { data: sellersData } = useQuery('sellers-list-payments', () => sellerService.getAll(), {
    retry: false,
    onError: () => {},
  })
  
  const allPayments = paymentsData?.data || []
  const allAllocationsForPayments = allocationsData?.data || allocationsListData?.data || []
  const allSpacesFromPayments = spacesData?.data || []
  const sellers = sellersData?.data?.sellers || sellersData?.data || []

  // Filter payments by managed zones (through allocations -> spaces -> zones)
  const managedSpacesForPayments = managedZoneIds.length > 0
    ? allSpacesFromPayments.filter((s: any) => managedZoneIds.includes(s.zone_id))
    : allSpacesFromPayments
  const managedSpaceIdsForPayments = managedSpacesForPayments.map((s: any) => s.space_id)
  const managedAllocationsForPayments = managedZoneIds.length > 0
    ? allAllocationsForPayments.filter((a: any) => managedSpaceIdsForPayments.includes(a.space_id))
    : allAllocationsForPayments
  const managedAllocationIdsForPayments = managedAllocationsForPayments.map((a: any) => a.allocation_id)
  const payments = managedZoneIds.length > 0
    ? allPayments.filter((p: Payment) => managedAllocationIdsForPayments.includes(p.allocation_id))
    : allPayments
  const allocations = managedZoneIds.length > 0 ? managedAllocationsForPayments : allAllocationsForPayments
  const totalRevenue = Number(revenueData?.data?.total_revenue) || 0

  const createMutation = useMutation((payment: Payment) => {
    if (managedZoneIds.length > 0) {
      const paymentAllocation = allocations.find((a: any) => a.allocation_id === payment.allocation_id)
      if (paymentAllocation && !managedAllocationIdsForPayments.includes(payment.allocation_id)) {
        toast.error('You can only create payments for allocations in your managed zones')
        throw new Error('Unauthorized payment')
      }
    }
    return paymentService.create(payment)
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('payments')
      toast.success('Payment recorded successfully')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      if (error.message !== 'Unauthorized payment') {
        toast.error(error.response?.data?.message || 'Failed to record payment')
      }
    },
  })

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => paymentService.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('payments')
        toast.success('Payment status updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update payment status')
      },
    }
  )

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
    if (!formData.allocation_id || !formData.seller_id || !formData.amount) {
      toast.error('Please fill in all required fields')
      return
    }
    createMutation.mutate(formData as Payment)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading payments...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Managed Payments</h1>
        <button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Revenue Summary */}
      {totalRevenue > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(dateFrom), 'MMM dd')} - {format(new Date(dateTo), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          {revenueByMethod?.data && revenueByMethod.data.length > 0 && (
            <div className="card col-span-2">
              <p className="text-sm font-medium text-gray-600 mb-3">Revenue by Payment Method</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {revenueByMethod.data.map((method: any) => (
                  <div key={method.payment_method} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 capitalize">{method.payment_method?.replace('_', ' ')}</p>
                    <p className="text-lg font-bold text-gray-900">${(Number(method.total) || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Methods</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment: Payment) => {
                  const seller = sellers.find((s: any) => (s.seller_id || s.user_id) === payment.seller_id)
                  return (
                    <tr key={payment.payment_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">#{payment.payment_id}</td>
                      <td className="py-3 px-4">
                        {seller?.business_name || seller?.full_name || seller?.user?.username || `Seller #${payment.seller_id}`}
                      </td>
                      <td className="py-3 px-4 font-medium">${Number(payment.amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 capitalize">{payment.payment_method?.replace('_', ' ')}</td>
                      <td className="py-3 px-4">
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={payment.status}
                          onChange={(e) => {
                            if (window.confirm(`Change payment status to ${e.target.value}?`)) {
                              updateStatusMutation.mutate({ id: payment.payment_id!, status: e.target.value })
                            }
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 ${
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : payment.status === 'failed'
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
                        {payment.status === 'completed' && (
                          <button
                            onClick={async () => {
                              try {
                                const blob = await paymentService.generateReceipt(payment.payment_id!)
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `receipt-${payment.payment_id}.pdf`
                                a.click()
                                window.URL.revokeObjectURL(url)
                              } catch (error: any) {
                                console.error('Receipt download failed:', error)
                                toast.error('Receipt generation not available')
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
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Record Payment</h2>
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
                    {sellers.map((seller: any) => (
                      <option key={seller.seller_id || seller.user_id} value={seller.seller_id || seller.user_id}>
                        {seller.business_name || seller.full_name || seller.user?.username || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Allocation *</label>
                  <select
                    value={formData.allocation_id}
                    onChange={(e) => setFormData({ ...formData, allocation_id: parseInt(e.target.value) })}
                    className="input"
                    required
                  >
                    <option value={0}>Select Allocation</option>
                    {allocations
                      .filter((a: any) => !formData.seller_id || a.seller_id === formData.seller_id)
                      .map((allocation: any) => (
                        <option key={allocation.allocation_id} value={allocation.allocation_id}>
                          Allocation #{allocation.allocation_id} - Space {allocation.space_id}
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
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                    className="input"
                    required
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                {formData.payment_method === 'mobile_money' && (
                  <>
                    <div>
                      <label className="label">Mobile Money Number *</label>
                      <input
                        type="tel"
                        value={formData.mobile_money_number || ''}
                        onChange={(e) => setFormData({ ...formData, mobile_money_number: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Mobile Money Provider</label>
                      <select
                        value={formData.mobile_money_provider || ''}
                        onChange={(e) => setFormData({ ...formData, mobile_money_provider: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Payment Reference</label>
                  <input
                    type="text"
                    value={formData.payment_reference || ''}
                    onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                    className="input"
                    placeholder="Transaction reference number"
                  />
                </div>
                <div>
                  <label className="label">Transaction ID</label>
                  <input
                    type="text"
                    value={formData.transaction_id || ''}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    className="input"
                    placeholder="Transaction ID"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary">
                  Record Payment
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
    </div>
  )
}

export default ManagerPayments

