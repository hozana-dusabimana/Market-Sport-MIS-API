import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { paymentService, Payment } from '../../services/paymentService'
import toast from 'react-hot-toast'
import { Plus, Download, CreditCard } from 'lucide-react'
import { format } from 'date-fns'

const Payments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Payment>>({
    allocation_id: 0,
    seller_id: 0,
    amount: 0,
    payment_method: 'mobile_money',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending',
  })

  const queryClient = useQueryClient()
  const { data: payments, isLoading } = useQuery('payments', () => paymentService.getAll())

  const createMutation = useMutation((payment: Payment) => paymentService.create(payment), {
    onSuccess: () => {
      queryClient.invalidateQueries('payments')
      toast.success('Payment recorded successfully')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment')
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
      status: 'pending',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData as Payment)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading payments...</div>
  }

  return (
    <div>
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

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments?.data?.map((payment: Payment) => (
                <tr key={payment.payment_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">#{payment.payment_id}</td>
                  <td className="py-3 px-4">{payment.seller_id}</td>
                  <td className="py-3 px-4 font-medium">${payment.amount}</td>
                  <td className="py-3 px-4 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                  <td className="py-3 px-4">
                    {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={payment.status}
                      onChange={(e) => {
                        if (confirm(`Change payment status to ${e.target.value}?`)) {
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Generate receipt
                          paymentService.generateReceipt(payment.payment_id!).then((blob) => {
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `receipt-${payment.payment_id}.pdf`
                            a.click()
                          }).catch(() => {
                            toast.error('Failed to generate receipt')
                          })
                        }}
                        className="text-primary-600 hover:text-primary-700"
                        title="Download Receipt"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Record Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Allocation ID *</label>
                <input
                  type="number"
                  value={formData.allocation_id || ''}
                  onChange={(e) => setFormData({ ...formData, allocation_id: parseInt(e.target.value) })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Seller ID *</label>
                <input
                  type="number"
                  value={formData.seller_id || ''}
                  onChange={(e) => setFormData({ ...formData, seller_id: parseInt(e.target.value) })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
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
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone_number || ''}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="input"
                    required
                  />
                </div>
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
                <label className="label">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="btn btn-secondary flex-1"
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

export default Payments


