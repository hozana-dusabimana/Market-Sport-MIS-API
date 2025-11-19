import { useQuery } from 'react-query'
import { zoneService } from '../../services/zoneService'
import { spaceService } from '../../services/spaceService'
import { paymentService } from '../../services/paymentService'
import { allocationService } from '../../services/allocationService'
import { userService } from '../../services/userService'
import { sellerService } from '../../services/sellerService'
import { MapPin, Square, Users, TrendingUp, DollarSign, UserCheck, Plus, ListChecks, BellRing } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, subMonths } from 'date-fns'

const AdminDashboard = () => {
  // --- Data Fetching ---
  const { data: zonesData, isLoading: loadingZones } = useQuery('zones', () => zoneService.getAll())
  const { data: spacesData, isLoading: loadingSpaces } = useQuery('spaces', () => spaceService.getAll())
  const { data: allocations, isLoading: loadingAllocations } = useQuery('allocations', () => allocationService.getAll())
  const { data: sellerStatusCount, isLoading: loadingSellerStatus } = useQuery('seller-status-count', () => sellerService.getCountByStatus())

  const zones = zonesData?.data || []
  const spaces = spacesData?.data || []
  const allocationsList = allocations?.data || []
  
  // Fetch Monthly Revenue (Last 30 Days)
  const dateFrom = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
  const dateTo = format(new Date(), 'yyyy-MM-dd');
  
  const { data: revenueData, isLoading: loadingRevenue } = useQuery(
    ['revenue-total', dateFrom, dateTo],
    () => paymentService.getTotalRevenue({ date_from: dateFrom, date_to: dateTo }),
    { retry: false, staleTime: 60000 }
  )
  
  const totalRevenue = Number(revenueData?.data?.total_revenue) || 0;

  // --- Calculated Metrics ---
  const availableSpaces = spaces.filter((s) => s.status === 'available').length || 0
  const totalSpaces = spaces.length || 0
  const occupiedSpaces = totalSpaces - availableSpaces;
  const occupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0
  
  // --- Main Stats Cards Data ---
  const stats = [
    {
      name: 'Total Zones',
      value: loadingZones ? '...' : zones.length,
      icon: MapPin,
      color: 'bg-teal-500',
      description: 'Total managed market zones.',
    },
    {
      name: 'Total Spaces',
      value: loadingSpaces ? '...' : totalSpaces,
      icon: Square,
      color: 'bg-blue-500',
      description: 'Total registerable spaces.',
    },
    {
      name: 'Active Allocations',
      value: loadingAllocations ? '...' : allocationsList.filter((a) => a.status === 'active').length,
      icon: Users,
      color: 'bg-purple-500',
      description: 'Currently occupied market spaces.',
    },
    {
      name: 'Monthly Revenue',
      value: loadingRevenue ? '...' : `RWF ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-orange-500',
      description: `Revenue since ${format(subMonths(new Date(), 1), 'MMM d')}.`,
    },
  ];


  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <h1 className="text-3xl font-extrabold text-blue-900 mb-8 border-b border-gray-200 pb-2">
        Market SpotOn Administration
      </h1>

      {/* 🚀 1. Key Performance Indicators (KPI) Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.name} 
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">{stat.description}</p>
            </div>
          )
        })}
      </section>
      
      {/* 📊 2. Detailed Metrics & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Occupancy Rate Card (XL Span 2) */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Market Space Occupancy</h2>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex-1 w-full">
              <div className="w-full bg-gray-200 rounded-full h-4 relative">
                <div
                  className="bg-teal-500 h-4 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${occupancyRate}%` }}
                ></div>
                {/* Visual marker for 50% */}
                <span className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-400/50"></span>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                <span className="font-semibold text-teal-700">{occupancyRate.toFixed(1)}%</span> occupied (
                {occupiedSpaces} out of {totalSpaces} spaces allocated).
              </p>
            </div>
            <div className="flex-shrink-0 text-center">
              <TrendingUp className="w-10 h-10 text-teal-600 mx-auto mb-1" />
              <p className="text-lg font-extrabold text-blue-900">{occupiedSpaces}</p>
              <p className="text-sm text-gray-500">Allocated Spaces</p>
            </div>
            <div className="flex-shrink-0 text-center">
              <Square className="w-10 h-10 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-extrabold text-blue-900">{availableSpaces}</p>
              <p className="text-sm text-gray-500">Available Spaces</p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions (XL Span 1) */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/sellers"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center group"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              <span>Register New Seller</span>
            </Link>
            <Link
              to="/zones"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors flex items-center"
            >
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              <span>Create New Zone</span>
            </Link>
            <Link
              to="/reports"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors flex items-center"
            >
              <ListChecks className="w-5 h-5 mr-2 text-green-600" />
              <span>View Comprehensive Reports</span>
            </Link>
            <Link
              to="/notifications"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors flex items-center"
            >
              <BellRing className="w-5 h-5 mr-2 text-orange-600" />
              <span>Manage Notifications</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* 👤 3. Seller Statistics */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Seller Verification Card */}
        {sellerStatusCount?.data && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Seller Verification Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {sellerStatusCount.data.map((stat) => (
                <div key={stat.verification_status} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600 capitalize">{stat.verification_status}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      stat.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                      stat.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {stat.verification_status}
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold text-blue-900">{stat.count || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      
    </div>
  )
}

export default AdminDashboard