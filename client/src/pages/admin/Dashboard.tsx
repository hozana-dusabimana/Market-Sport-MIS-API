import { useQuery } from 'react-query'
import { zoneService } from '../../services/zoneService'
import { spaceService } from '../../services/spaceService'
import { paymentService } from '../../services/paymentService'
import { allocationService } from '../../services/allocationService'
import { userService } from '../../services/userService'
import { sellerService } from '../../services/sellerService'
import { MapPin, Square, CreditCard, Users, TrendingUp, DollarSign, UserCheck } from 'lucide-react'
import { format } from 'date-fns'

const AdminDashboard = () => {
  const { data: zones } = useQuery('zones', () => zoneService.getAll())
  const { data: spaces } = useQuery('spaces', () => spaceService.getAll())
  const { data: payments } = useQuery('payments', () =>
    paymentService.getAll({
      start_date: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    })
  )
  const { data: allocations } = useQuery('allocations', () => allocationService.getAll())
  const { data: userStats } = useQuery('user-statistics', () => userService.getStatistics())
  const { data: sellerStatusCount } = useQuery('seller-status-count', () => sellerService.countByStatus())

  const stats = [
    {
      name: 'Total Zones',
      value: zones?.data?.length || 0,
      icon: MapPin,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Spaces',
      value: spaces?.data?.length || 0,
      icon: Square,
      color: 'bg-green-500',
    },
    {
      name: 'Active Allocations',
      value: allocations?.data?.filter((a: any) => a.status === 'active')?.length || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Monthly Revenue',
      value: `$${payments?.data?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ]

  const availableSpaces = spaces?.data?.filter((s: any) => s.status === 'available')?.length || 0
  const totalSpaces = spaces?.data?.length || 0
  const occupancyRate = totalSpaces > 0 ? ((totalSpaces - availableSpaces) / totalSpaces) * 100 : 0

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {userStats?.data && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userStats.data.map((stat: any) => (
              <div key={stat.user_type} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 capitalize">{stat.user_type}s</span>
                  <UserCheck className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.total || 0}</p>
                <div className="flex space-x-4 mt-2 text-xs">
                  <span className="text-green-600">Active: {stat.active || 0}</span>
                  <span className="text-red-600">Suspended: {stat.suspended || 0}</span>
                  <span className="text-gray-600">Inactive: {stat.inactive || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sellerStatusCount?.data && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Verification Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sellerStatusCount.data.map((stat: any) => (
              <div key={stat.verification_status} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 capitalize">{stat.verification_status}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    stat.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                    stat.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {stat.verification_status}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.count || 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Occupancy Rate</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-primary-600 h-4 rounded-full transition-all"
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {occupancyRate.toFixed(1)}% occupied ({totalSpaces - availableSpaces} / {totalSpaces} spaces)
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full btn btn-primary text-left">Register New Seller</button>
            <button className="w-full btn btn-secondary text-left">Create New Zone</button>
            <button className="w-full btn btn-secondary text-left">View Reports</button>
            <button className="w-full btn btn-secondary text-left">Manage Notifications</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard


