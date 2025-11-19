import { useQuery } from 'react-query'
import { useAuthStore } from '../../store/authStore'
import { allocationService } from '../../services/allocationService'
import { sellerService } from '../../services/sellerService'
import { spaceService } from '../../services/spaceService'
import { Square, Calendar, DollarSign } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { authService } from '../../services/authService'

const SellerSpaces = () => {
  const { user } = useAuthStore()
  const userId = user?.userId

  // Get user profile to derive seller_id
  const { data: userProfileData, isLoading: userProfileLoading } = useQuery(
    ['user-profile', userId],
    () => authService.getProfile(),
    { enabled: !!userId, retry: false, onError: () => {} }
  )
  const sellerId = userProfileData?.data?.profile?.seller_id || userProfileData?.data?.user_id || userId

  // Get allocations
  const { data: allocationsData, isLoading: allocationsLoading } = useQuery(
    ['seller-allocations', sellerId],
    () => allocationService.getAll({ seller_id: sellerId }),
    { enabled: !!sellerId, retry: false, onError: () => {} }
  )
  const allocations = allocationsData?.data || []

  // Fetch space details
  const spaceIds = allocations.map((a: any) => a.space_id).filter(Boolean)
  const { data: spacesData } = useQuery(
    ['spaces', spaceIds],
    () => Promise.all(spaceIds.map((id: number) => spaceService.getById(id))),
    { enabled: spaceIds.length > 0, retry: false, onError: () => {} }
  )
  const spaces = spacesData?.map((s: any) => s?.data).filter(Boolean) || []
  const spaceMap = new Map(spaces.map((s: any) => [s?.space_id, s]))

  if (userProfileLoading || allocationsLoading) {
    return <div className="text-center py-12">Loading your spaces...</div>
  }

  const activeAllocations = allocations.filter((a: any) => a.status === 'active')
  const expiredAllocations = allocations.filter((a: any) => a.status === 'expired' || a.status === 'terminated')

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Spaces</h1>

      {/* Active Allocations */}
      {activeAllocations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Allocations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAllocations.map((allocation: any) => {
              const space = spaceMap.get(allocation.space_id)
              const monthlyRate = Number(space?.monthly_rate || space?.daily_rate || 0).toFixed(2)
              return (
                <div key={allocation.allocation_id} className="card p-4 shadow-sm hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <Square className="w-6 h-6 text-primary-600" />
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {space?.space_number || space?.space_code || `Space #${allocation.space_id}`}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} />
                      <span>Started: {allocation.start_date ? format(parseISO(allocation.start_date), 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                    {allocation.end_date && (
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>Ends: {format(parseISO(allocation.end_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <DollarSign size={16} />
                      <span className="font-semibold text-gray-900">RWF {monthlyRate}/month</span>
                    </div>
                    {space?.zone_id && (
                      <div className="text-xs text-gray-500 mt-1">
                        Zone: {space.zone_id}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Previous Allocations */}
      {expiredAllocations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Allocations</h2>
          <div className="card p-4 shadow-sm">
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
                    const monthlyRate = Number(space?.monthly_rate || space?.daily_rate || 0).toFixed(2)
                    return (
                      <tr key={allocation.allocation_id} className="border-b border-gray-100">
                        <td className="py-3 px-4">{space?.space_number || space?.space_code || `Space #${allocation.space_id}`}</td>
                        <td className="py-3 px-4">{allocation.start_date ? format(parseISO(allocation.start_date), 'MMM dd, yyyy') : 'N/A'}</td>
                        <td className="py-3 px-4">{allocation.end_date ? format(parseISO(allocation.end_date), 'MMM dd, yyyy') : 'N/A'}</td>
                        <td className="py-3 px-4">RWF {monthlyRate}</td>
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

      {/* No allocations */}
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
