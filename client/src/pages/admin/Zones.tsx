import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { zoneService, Zone } from '../../services/zoneService'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, MapPin, Search, Eye } from 'lucide-react'

const Zones = () => {
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
    status: 'active',
  })

  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery(
    ['zones', statusFilter, searchTerm],
    () => zoneService.getAll({ status: statusFilter !== 'all' ? statusFilter : undefined, search: searchTerm || undefined })
  )
  
  const { data: zoneStats } = useQuery(
    ['zone-stats', selectedZone?.zone_id],
    () => zoneService.getStatistics(selectedZone?.zone_id!),
    { enabled: !!selectedZone?.zone_id && showDetails }
  )
  
  const { data: zoneSpaces } = useQuery(
    ['zone-spaces', selectedZone?.zone_id],
    () => zoneService.getSpaces(selectedZone?.zone_id!),
    { enabled: !!selectedZone?.zone_id && showDetails }
  )

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
      status: 'active',
    })
  }

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone)
    setFormData(zone)
    setIsModalOpen(true)
  }

  const handleViewDetails = async (zone: Zone) => {
    setSelectedZone(zone)
    setShowDetails(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingZone) {
      updateMutation.mutate({ id: editingZone.zone_id!, zone: formData })
    } else {
      createMutation.mutate(formData as Zone)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading zones...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Zone Management</h1>
        <button
          onClick={() => {
            setIsModalOpen(true)
            setEditingZone(null)
            resetForm()
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Zone</span>
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search zones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((zone: Zone) => (
                <tr key={zone.zone_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{zone.zone_code}</td>
                  <td className="py-3 px-4 font-medium">{zone.zone_name}</td>
                  <td className="py-3 px-4">{zone.location || 'N/A'}</td>
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(zone)}
                        className="text-blue-600 hover:text-blue-700"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(zone)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this zone?')) {
                            deleteMutation.mutate(zone.zone_id!)
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={18} />
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
            <h2 className="text-2xl font-bold mb-4">
              {editingZone ? 'Edit Zone' : 'Create New Zone'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div>
                <label className="label">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="input"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingZone ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingZone(null)
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

      {showDetails && selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Zone Details: {selectedZone.zone_name}</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedZone(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Zone Code</label>
                <p className="text-gray-900">{selectedZone.zone_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedZone.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedZone.status}
                </span>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">Location</label>
                <p className="text-gray-900">{selectedZone.location || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900">{selectedZone.description || 'N/A'}</p>
              </div>
            </div>
            {zoneStats?.data && (
              <div className="border-t pt-4 mb-4">
                <h3 className="text-lg font-semibold mb-3">Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Spaces</label>
                    <p className="text-2xl font-bold text-gray-900">{zoneStats.data.total_spaces || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Occupied</label>
                    <p className="text-2xl font-bold text-gray-900">{zoneStats.data.occupied_spaces || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Allocations</label>
                    <p className="text-2xl font-bold text-gray-900">{zoneStats.data.total_allocations || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Revenue</label>
                    <p className="text-2xl font-bold text-gray-900">${zoneStats.data.total_revenue || 0}</p>
                  </div>
                </div>
              </div>
            )}
            {zoneSpaces?.data && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Spaces in Zone</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Space Code</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Monthly Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneSpaces.data.map((space: any) => (
                        <tr key={space.space_id} className="border-b">
                          <td className="py-2">{space.space_code || space.space_number}</td>
                          <td className="py-2 capitalize">{space.space_type}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              space.status === 'available' ? 'bg-green-100 text-green-800' :
                              space.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {space.status}
                            </span>
                          </td>
                          <td className="py-2">${space.monthly_rate || 0}</td>
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

export default Zones


