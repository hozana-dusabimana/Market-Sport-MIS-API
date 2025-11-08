import { useQuery } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { allocationService } from '../../services/allocationService'
import { Square, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { demoAllocations, useDemoData } from '../../utils/demoData'

const SellerSpaces = () => {
  const { user } = useAuthStore()

  const { data: allocationsData, isLoading } = useQuery(
    'seller-allocations',
    () => allocationService.getAll({ seller_id: user?.userId }),
    { enabled: !!user?.userId, retry: false, onError: () => {} }
  )
  const allocations = useDemoData(allocationsData, demoAllocations.filter((a: any) => a.seller_id === 1))

  if (isLoading) {
    return <div className="text-center py-12">Loading your spaces...</div>
  }

  const activeAllocations = allocations?.data?.filter((a: any) => a.status === 'active') || []
  const expiredAllocations = allocations?.data?.filter((a: any) => a.status === 'expired') || []

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Spaces</h1>

      {activeAllocations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Allocations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAllocations.map((allocation: any) => (
              <div key={allocation.allocation_id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Square className="w-6 h-6 text-primary-600" />
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Space #{allocation.space_id}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>
                      Started: {format(new Date(allocation.start_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign size={16} />
                    <span className="font-semibold text-gray-900">
                      ${allocation.monthly_rate}/month
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expiredAllocations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Allocations</h2>
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Space ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Monthly Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredAllocations.map((allocation: any) => (
                    <tr key={allocation.allocation_id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{allocation.space_id}</td>
                      <td className="py-3 px-4">
                        {format(new Date(allocation.start_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        {allocation.end_date
                          ? format(new Date(allocation.end_date), 'MMM dd, yyyy')
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">${allocation.monthly_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeAllocations.length === 0 && expiredAllocations.length === 0 && (
        <div className="card text-center py-12">
          <Square className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You don't have any space allocations yet.</p>
        </div>
      )}
    </div>
  )
}

export default SellerSpaces


