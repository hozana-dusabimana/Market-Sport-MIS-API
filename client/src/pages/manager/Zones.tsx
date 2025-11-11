import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { zoneService, Zone } from '../../services/zoneService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react'

const ManagerZones = () => {
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [formData, setFormData] = useState<Partial<Zone>>({
    zone_name: '',
    zone_code: '',
    description: '',
    location: '',
    manager_id: user?.userId,
    total_spaces: 0,
    status: 'active',
  })

  const queryClient = useQueryClient()
  
  // Filter by manager's assigned zones
  const managedZoneIds = user?.user_type === 'manager' && user?.profile?.assigned_zones
    ? user.profile.assigned_zones
    : []
  
  const managerId = user?.userId
  const { data, isLoading } = useQuery(
    ['zones', statusFilter, searchTerm, managerId],
    () => zoneService.getAll({ 
      status: statusFilter !== 'all' ? statusFilter : undefined, 
      search: searchTerm || undefined,
      manager_id: managerId,
    }),
    {
      retry: false,
      onError: () => {},
    }
  )
  
  const allZones = data?.data || []
  // Filter by assigned zones
  const zones = managedZoneIds.length > 0
    ? allZones.filter((z: Zone) => managedZoneIds.includes(z.zone_id!))
    : allZones
  
  const { data: zoneStats } = useQuery(
    ['zone-stats', selectedZone?.zone_id],
    () => zoneService.getStatistics(selectedZone?.zone_id!),
    { enabled: !!selectedZone?.zone_id && showDetails, retry: false, onError: () => {} }
  )
  
  const { data: zoneSpaces } = useQuery(
    ['zone-spaces', selectedZone?.zone_id],
    () => zoneService.getSpaces(selectedZone?.zone_id!),
    { enabled: !!selectedZone?.zone_id && showDetails, retry: false, onError: () => {} }
  )
  
  const { data: zoneDetails } = useQuery(
    ['zone-details', selectedZone?.zone_id],
    () => zoneService.getById(selectedZone?.zone_id!),
    { enabled: !!selectedZone?.zone_id && showDetails, retry: false, onError: () => {} }
  )
  
  const zoneStatistics = zoneDetails?.data?.stats || zoneStats?.data
  const spacesInZone = zoneDetails?.data?.spaces || zoneSpaces?.data || []

  const createMutation = useMutation((zone: Zone) => zoneService.create(zone), {
    onSuccess: () => {
      queryClient.invalidateQueries('zones')
      toast.success('Zone created successfully')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create zone')
    },
  })

  const updateMutation = useMutation(
    ({ id, zone }: { id: number; zone: Partial<Zone> }) => zoneService.update(id, zone),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('zones')
        toast.success('Zone updated successfully')
        setIsModalOpen(false)
        setEditingZone(null)
        resetForm()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update zone')
      },
    }
  )

  const deleteMutation = useMutation((id: number) => zoneService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('zones')
      toast.success('Zone deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete zone')
    },
  })

  const resetForm = () => {
    setFormData({
      zone_name: '',
      zone_code: '',
      description: '',
      location: '',
      manager_id: user?.userId,
      total_spaces: 0,
      status: 'active',
    })
    setEditingZone(null)
  }

  const handleEdit = (zone: Zone) => {
    if (managedZoneIds.length > 0 && !managedZoneIds.includes(zone.zone_id!)) {
      toast.error('You can only edit zones assigned to you')
      return
    }
    setEditingZone(zone)
    setFormData({
      zone_name: zone.zone_name,
      zone_code: zone.zone_code,
      description: zone.description || '',
      location: zone.location || '',
      manager_id: zone.manager_id || user?.userId,
      total_spaces: zone.total_spaces || 0,
      status: zone.status,
    })
    setIsModalOpen(true)
  }

  const handleViewDetails = (zone: Zone) => {
    setSelectedZone(zone)
    setShowDetails(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For managers, ensure they can only create/edit zones in their assigned zones
    if (user?.user_type === 'manager') {
      // When creating, assign zone to manager
      if (!editingZone) {
        formData.manager_id = user.userId
      } else {
        // When editing, ensure manager can only edit their own zones
        if (!managedZoneIds.includes(editingZone.zone_id!)) {
          toast.error('You can only edit zones assigned to you')
          return
        }
      }
    }
    if (editingZone) {
      updateMutation.mutate({ id: editingZone.zone_id!, zone: formData })
    } else {
      createMutation.mutate(formData as Zone)
    }
  }

  const handleDelete = (id: number, zone: Zone) => {
    if (managedZoneIds.length > 0 && !managedZoneIds.includes(zone.zone_id!)) {
      toast.error('You can only delete zones assigned to you')
      return
    }
    if (window.confirm('Are you sure you want to delete this zone?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredZones = zones.filter((zone: Zone) => {
    const matchesSearch = !searchTerm || 
      zone.zone_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.zone_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || zone.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading zones...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Managed Zones</h1>
        <button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Zone</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search zones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Zones Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Spaces</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredZones.length > 0 ? (
                filteredZones.map((zone: Zone) => (
                  <tr key={zone.zone_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{zone.zone_code}</td>
                    <td className="py-3 px-4">{zone.zone_name}</td>
                    <td className="py-3 px-4 text-gray-600">{zone.description || 'N/A'}</td>
                    <td className="py-3 px-4">{zone.total_spaces || 0}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          zone.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {zone.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(zone)}
                          className="text-primary-600 hover:text-primary-700"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(zone)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.zone_id!, zone)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No zones found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingZone ? 'Edit Zone' : 'Create Zone'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Zone Code *</label>
                  <input
                    type="text"
                    value={formData.zone_code}
                    onChange={(e) => setFormData({ ...formData, zone_code: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Zone Name *</label>
                  <input
                    type="text"
                    value={formData.zone_name}
                    onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Total Spaces</label>
                  <input
                    type="number"
                    value={formData.total_spaces}
                    onChange={(e) => setFormData({ ...formData, total_spaces: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary">
                  {editingZone ? 'Update' : 'Create'}
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

      {/* Zone Details Modal */}
      {showDetails && selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Zone Details: {selectedZone.zone_name}</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedZone(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Zone Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Code:</span> {selectedZone.zone_code}</p>
                  <p><span className="font-medium">Name:</span> {selectedZone.zone_name}</p>
                  <p><span className="font-medium">Description:</span> {selectedZone.description || 'N/A'}</p>
                  <p><span className="font-medium">Location:</span> {selectedZone.location || 'N/A'}</p>
                  <p><span className="font-medium">Status:</span> {selectedZone.status}</p>
                  <p><span className="font-medium">Total Spaces:</span> {selectedZone.total_spaces || 0}</p>
                </div>
              </div>

              {zoneStatistics && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Statistics</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Total Spaces:</span> {zoneStatistics.total_spaces || 0}</p>
                    <p><span className="font-medium">Available:</span> {zoneStatistics.available || 0}</p>
                    <p><span className="font-medium">Occupied:</span> {zoneStatistics.occupied || 0}</p>
                    <p><span className="font-medium">Maintenance:</span> {zoneStatistics.maintenance || 0}</p>
                    <p><span className="font-medium">Occupancy Rate:</span> {zoneStatistics.occupancy_rate || 0}%</p>
                  </div>
                </div>
              )}
            </div>

            {spacesInZone && spacesInZone.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Spaces in Zone</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3">Space Number</th>
                        <th className="text-left py-2 px-3">Type</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-left py-2 px-3">Monthly Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spacesInZone.map((space: any) => (
                        <tr key={space.space_id} className="border-b border-gray-100">
                          <td className="py-2 px-3">{space.space_number || space.space_code || 'N/A'}</td>
                          <td className="py-2 px-3">{space.space_type || 'N/A'}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              space.status === 'available' ? 'bg-green-100 text-green-800' :
                              space.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {space.status}
                            </span>
                          </td>
                          <td className="py-2 px-3">${space.monthly_rate || space.daily_rate || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerZones


