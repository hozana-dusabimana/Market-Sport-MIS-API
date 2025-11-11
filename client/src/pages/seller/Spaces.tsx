import { useQuery } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { allocationService } from '../../services/allocationService'
import { sellerService } from '../../services/sellerService'
import { spaceService } from '../../services/spaceService'
import { Square, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

const SellerSpaces = () => {
  const { user } = useAuthStore()

  // First get seller profile to get seller_id
  const userId = user?.userId
  const { data: sellerProfileResponse, isLoading: profileLoading } = useQuery(
    ['seller-profile', userId],
    () => sellerService.getAll({ id: userId }),
    { enabled: !!userId && user?.user_type === 'seller', retry: false, onError: () => {} }
  )

  // Extract seller_id from response
  const sellerProfile = sellerProfileResponse?.data?.sellers?.[0] || sellerProfileResponse?.data
  const sellerId = sellerProfile?.seller_id || sellerProfile?.user_id || userId

  const { data: allocationsData, isLoading: allocationsLoading } = useQuery(
    ['seller-allocations', sellerId],
    () => allocationService.getAll({ seller_id: sellerId }),
    { enabled: !!sellerId, retry: false, onError: () => {} }
  )

  const allocations = allocationsData?.data || []

  // Fetch space details for each allocation
  const spaceIds = allocations.map((a: any) => a.space_id).filter(Boolean)
  const { data: spacesData } = useQuery(
    ['spaces', spaceIds],
    () => Promise.all(spaceIds.map((id: number) => spaceService.getById(id))),
    { enabled: spaceIds.length > 0, retry: false, onError: () => {} }
  )

  const spaces = spacesData?.map((s: any) => s?.data) || []

  // Create a map of space_id to space details
  const spaceMap = new Map(spaces.map((s: any) => [s?.space_id, s]))

  if (profileLoading || allocationsLoading) {
    return <div className="text-center py-12">Loading your spaces...</div>
  }

  const activeAllocations = allocations.filter((a: any) => a.status === 'active') || []
  const expiredAllocations = allocations.filter((a: any) => a.status === 'expired' || a.status === 'terminated') || []

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
                  {spaceMap.get(allocation.space_id)?.space_number || spaceMap.get(allocation.space_id)?.space_code || `Space #${allocation.space_id}`}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>
                      Started: {format(new Date(allocation.start_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {allocation.end_date && (
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} />
                      <span>
                        Ends: {format(new Date(allocation.end_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <DollarSign size={16} />
                    <span className="font-semibold text-gray-900">
                      ${(spaceMap.get(allocation.space_id)?.monthly_rate || spaceMap.get(allocation.space_id)?.daily_rate || 0).toFixed(2)}/month
                    </span>
                  </div>
                  {spaceMap.get(allocation.space_id)?.zone_id && (
                    <div className="text-xs text-gray-500 mt-1">
                      Zone: {spaceMap.get(allocation.space_id)?.zone_id}
                    </div>
                  )}
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Space Number</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Monthly Rate</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredAllocations.map((allocation: any) => {
                    const space = spaceMap.get(allocation.space_id)
                    return (
                      <tr key={allocation.allocation_id} className="border-b border-gray-100">
                        <td className="py-3 px-4">{space?.space_number || space?.space_code || `Space #${allocation.space_id}`}</td>
                        <td className="py-3 px-4">
                          {format(new Date(allocation.start_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          {allocation.end_date
                            ? format(new Date(allocation.end_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">${(space?.monthly_rate || space?.daily_rate || 0).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            allocation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                            allocation.status === 'terminated' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {allocation.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
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


