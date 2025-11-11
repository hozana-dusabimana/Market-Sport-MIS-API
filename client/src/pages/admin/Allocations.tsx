import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { allocationService, Allocation } from '../../services/allocationService'
import { spaceService } from '../../services/spaceService'
import toast from 'react-hot-toast'
import { Plus, Calendar, X } from 'lucide-react'
import { format } from 'date-fns'

const Allocations = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Allocation>>({
    seller_id: 0,
    space_id: 0,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    monthly_rate: 0,
    status: 'active',
  })

  const queryClient = useQueryClient()
  const { data: allocations, isLoading } = useQuery('allocations', () => allocationService.getAll())
  const { data: spaces } = useQuery('available-spaces', () => spaceService.getAvailable())

  const createMutation = useMutation((allocation: Allocation) => allocationService.create(allocation), {
    onSuccess: () => {
      queryClient.invalidateQueries('allocations')
      queryClient.invalidateQueries('spaces')
      toast.success('Allocation created successfully')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create allocation')
    },
  })

  const terminateMutation = useMutation(
    ({ id, reason }: { id: number; reason?: string }) => allocationService.terminate(id, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allocations')
        queryClient.invalidateQueries('spaces')
        toast.success('Allocation terminated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to terminate allocation')
      },
    }
  )

  const resetForm = () => {
    setFormData({
      seller_id: 0,
      space_id: 0,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      monthly_rate: 0,
      status: 'active',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData as Allocation)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading allocations...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Space Allocations</h1>
        <button
          onClick={() => {
            setIsModalOpen(true)
            resetForm()
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Allocation</span>
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Space ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Monthly Rate</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations?.data?.map((allocation: Allocation) => (
                <tr key={allocation.allocation_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{allocation.seller_id}</td>
                  <td className="py-3 px-4 font-medium">{allocation.space_id}</td>
                  <td className="py-3 px-4">
                    {format(new Date(allocation.start_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4">${allocation.monthly_rate}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        allocation.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : allocation.status === 'expired'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {allocation.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {allocation.status === 'active' && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to terminate this allocation?')) {
                            terminateMutation.mutate({ id: allocation.allocation_id! })
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    )}
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
            <h2 className="text-2xl font-bold mb-4">Create New Allocation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="label">Space *</label>
                <select
                  value={formData.space_id}
                  onChange={(e) => {
                    const space = spaces?.data?.find((s: any) => s.space_id === parseInt(e.target.value))
                    setFormData({
                      ...formData,
                      space_id: parseInt(e.target.value),
                      monthly_rate: space?.monthly_rate || 0,
                    })
                  }}
                  className="input"
                  required
                >
                  <option value={0}>Select Space</option>
                  {spaces?.data?.map((space: any) => (
                    <option key={space.space_id} value={space.space_id}>
                      {space.space_code} - ${space.monthly_rate}/month
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Monthly Rate ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_rate}
                  onChange={(e) => setFormData({ ...formData, monthly_rate: parseFloat(e.target.value) })}
                  className="input"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Create
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

export default Allocations


