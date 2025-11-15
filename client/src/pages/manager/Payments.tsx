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

const ManagerPayments = () => {
  const { user } = useAuthStore()
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

  const queryClient = useQueryClient()
  const managedZoneIds = user?.profile?.assigned_zones || []
  const managerId = (user as any)?.profile?.manager_id || (user as any)?.profile?.id || (user as any)?.manager_id || null

  const { data: allocationsData } = useQuery(['allocations-for-payments', managedZoneIds], () => allocationService.getAll(), { retry: false, onError: () => {} })
  const { data: spacesData } = useQuery(['spaces-for-payments', managedZoneIds], () => spaceService.getAll(), { retry: false, onError: () => {} })
  const { data: paymentsData, isLoading } = useQuery(['payments', statusFilter, methodFilter, dateFrom, dateTo, managedZoneIds], () => paymentService.getAll({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    payment_method: methodFilter !== 'all' ? methodFilter : undefined,
    date_from: dateFrom,
    date_to: dateTo,
  }), { retry: false, onError: () => {} })
  const { data: sellersData } = useQuery(['sellers-list-payments', managerId], () => sellerService.getAll(managerId ? { manager_id: managerId } : undefined), { retry: false, onError: () => {} })

  const allPayments = paymentsData?.data || []
  const allocations = allocationsData?.data || []
  const allSpaces = spacesData?.data || []
  const sellers = sellersData?.data?.sellers || sellersData?.data || []

  const managedSpaces = managedZoneIds.length > 0 ? allSpaces.filter((s: any) => managedZoneIds.includes(s.zone_id)) : allSpaces
  const managedAllocations = managedZoneIds.length > 0
    ? allocations.filter((a: any) => managedSpaces.map((s: any) => s.space_id).includes(a.space_id) || (managerId && a.manager_id === managerId))
    : allocations
  const payments = managedZoneIds.length > 0
    ? allPayments.filter((p: Payment) => managedAllocations.map((a: any) => a.allocation_id).includes(p.allocation_id))
    : allPayments

  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
  const revenueByMethod = payments.reduce((acc: Record<string, number>, p: any) => {
    const key = p.payment_method || 'unknown'
    acc[key] = (acc[key] || 0) + (Number(p.amount) || 0)
    return acc
  }, {})

  const createMutation = useMutation((payment: Payment) => paymentService.create(payment), {
    onSuccess: () => {
      queryClient.invalidateQueries('payments')
      toast.success('Payment recorded successfully')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to record payment'),
  })

  const resetForm = () => {
    setFormData({
      allocation_id: 0,
      seller_id: 0,
      amount: 0,
      payment_method: 'mobile_money',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'completed',
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

  if (isLoading) return <div className="flex justify-center items-center h-screen text-gray-500 text-lg">Loading payments...</div>

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Managed Payments</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded shadow hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Record Payment
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <h2 className="text-xl font-semibold">${totalRevenue.toFixed(2)}</h2>
          </div>
          <DollarSign size={28} className="text-green-500" />
        </div>
        {Object.entries(revenueByMethod).map(([method, total]) => (
          <div key={method} className="p-4 bg-white rounded shadow flex flex-col justify-center items-start">
            <p className="text-gray-500 capitalize text-sm">{method.replace('_', ' ')}</p>
            <h3 className="text-lg font-medium">${total.toFixed(2)}</h3>
          </div>
        ))}
      </section>

      <section className="flex flex-col md:flex-row gap-3 mb-6 items-center">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="all">All Methods</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
      </section>

      <section className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {['ID', 'Seller', 'Amount', 'Method', 'Date', 'Status', 'Actions'].map((title) => (
                <th key={title} className="px-4 py-3 text-left text-sm font-medium text-gray-600">{title}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.length > 0 ? payments.map(p => {
              const seller = sellers.find((s: any) => (s.seller_id || s.user_id) === p.seller_id)
              return (
                <tr key={p.payment_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">#{p.payment_id}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{seller?.business_name || seller?.full_name || `Seller #${p.seller_id}`}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">${Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{p.payment_method.replace('_',' ')}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{format(new Date(p.payment_date), 'MMM dd, yyyy')}</td>
                  <td className={`px-4 py-2 text-sm font-medium capitalize ${p.status === 'completed' ? 'text-green-600' : p.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {p.status}
                  </td>
                  <td className="px-4 py-2">
                    {p.status === 'completed' && (
                      <button onClick={async () => {
                        const blob = await paymentService.generateReceipt(p.payment_id!)
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `receipt-${p.payment_id}.pdf`
                        a.click()
                      }} className="p-2 rounded hover:bg-gray-100 transition">
                        <Download size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No payments found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Record Payment</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <select value={formData.seller_id} onChange={e => setFormData({...formData, seller_id: parseInt(e.target.value)})} required className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value={0}>Select Seller</option>
                {sellers.map((s: any) => <option key={s.seller_id || s.user_id} value={s.seller_id || s.user_id}>{s.business_name || s.full_name}</option>)}
              </select>
              <select value={formData.allocation_id} onChange={e => setFormData({...formData, allocation_id: parseInt(e.target.value)})} required className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value={0}>Select Allocation</option>
                {managedAllocations.map((a: any) => <option key={a.allocation_id} value={a.allocation_id}>Allocation #{a.allocation_id} - Space {a.space_id}</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Amount ($)" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} required className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              <select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value as any})} required className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
              <div className="flex justify-end gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Record Payment</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerPayments
