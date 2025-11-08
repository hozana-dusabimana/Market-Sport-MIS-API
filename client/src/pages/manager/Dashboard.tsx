import { useQuery } from 'react-query'
import { zoneService } from '../../services/zoneService'
import { spaceService } from '../../services/spaceService'
import { allocationService } from '../../services/allocationService'
import { MapPin, Square, Users, TrendingUp } from 'lucide-react'
import { demoZones, demoSpaces, demoAllocations, useDemoData } from '../../utils/demoData'

const ManagerDashboard = () => {
  const { data: zonesData } = useQuery('zones', () => zoneService.getAll(), {
    retry: false,
    onError: () => {},
  })
  const { data: spacesData } = useQuery('spaces', () => spaceService.getAll(), {
    retry: false,
    onError: () => {},
  })
  const { data: allocationsData } = useQuery('allocations', () => allocationService.getAll(), {
    retry: false,
    onError: () => {},
  })

  const zones = useDemoData(zonesData, demoZones)
  const spaces = useDemoData(spacesData, demoSpaces)
  const allocations = useDemoData(allocationsData, demoAllocations)

  const stats = [
    {
      name: 'Managed Zones',
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
  ]

  const availableSpaces = spaces?.data?.filter((s: any) => s.status === 'available')?.length || 0
  const totalSpaces = spaces?.data?.length || 0
  const occupancyRate = totalSpaces > 0 ? ((totalSpaces - availableSpaces) / totalSpaces) * 100 : 0

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manager Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
    </div>
  )
}

export default ManagerDashboard


