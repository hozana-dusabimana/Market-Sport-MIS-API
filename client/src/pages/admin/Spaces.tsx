import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { spaceService, Space } from '../../services/spaceService'
import { zoneService } from '../../services/zoneService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Square, Search, Eye, Filter } from 'lucide-react'

const Spaces = () => {
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [zoneFilter, setZoneFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [formData, setFormData] = useState<Partial<Space>>({
    zone_id: 0,
    space_code: '',
    space_type: 'stall',
    monthly_rate: 0,
    status: 'available',
  })

  const queryClient = useQueryClient()
  // For managers, get their assigned zones first
  const managerId = user?.user_type === 'manager' ? user?.userId : undefined
  const managedZoneIds = user?.user_type === 'manager' && user?.profile?.assigned_zones
    ? user.profile.assigned_zones
    : []

  const { data: zonesData } = useQuery(
    ['zones', managerId],
    () => zoneService.getAll({ manager_id: managerId }),
    {
      retry: false,
      onError: () => {},
    }
  )
  const allZones = zonesData?.data || []
  const zones = managedZoneIds.length > 0
    ? allZones.filter((z: any) => managedZoneIds.includes(z.zone_id))
    : allZones

  const { data: spacesData, isLoading } = useQuery(
    ['spaces', statusFilter, zoneFilter, typeFilter, searchTerm, managedZoneIds],
    () =>
      spaceService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        zone_id: zoneFilter !== 'all' ? parseInt(zoneFilter) : undefined,
        space_type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchTerm || undefined,
      }),
    {
      retry: false,
      onError: () => {},
    }
  )
  
  const allSpaces = spacesData?.data || []
  // For managers, filter spaces by their assigned zones
  const spaces = managedZoneIds.length > 0
    ? allSpaces.filter((s: Space) => managedZoneIds.includes(s.zone_id))
    : allSpaces
  
  const { data: spaceDetails } = useQuery(
    ['space-details', selectedSpace?.space_id],
    () => spaceService.getById(selectedSpace?.space_id!),
    { enabled: !!selectedSpace?.space_id && showDetails, retry: false, onError: () => {} }
  )
  
  const { data: allocationHistoryData } = useQuery(
    ['space-allocation-history', selectedSpace?.space_id],
    () => spaceService.getAllocationHistory(selectedSpace?.space_id!),
    { enabled: !!selectedSpace?.space_id && showDetails, retry: false, onError: () => {} }
  )
  
  const currentAllocation = spaceDetails?.data?.currentAllocation || null
  const allocationHistory = allocationHistoryData?.data || []

  const createMutation = useMutation((space: Space) => spaceService.create(space), {
    onSuccess: () => {
      queryClient.invalidateQueries('spaces')
      toast.success('Space created successfully')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create space')
    },
  })

  const updateMutation = useMutation(
    ({ id, space }: { id: number; space: Partial<Space> }) => spaceService.update(id, space),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('spaces')
        toast.success('Space updated successfully')
        setIsModalOpen(false)
        setEditingSpace(null)
        resetForm()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update space')
      },
    }
  )

  const deleteMutation = useMutation((id: number) => spaceService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('spaces')
      toast.success('Space deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete space')
    },
  })

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => spaceService.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('spaces')
        toast.success('Space status updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update space status')
      },
    }
  )

  const resetForm = () => {
    setFormData({
      zone_id: 0,
      space_code: '',
      space_type: 'stall',
      monthly_rate: 0,
      status: 'available',
    })
  }

  const handleEdit = (space: Space) => {
    setEditingSpace(space)
    setFormData(space)
    setIsModalOpen(true)
  }

  const handleViewDetails = async (space: Space) => {
    setSelectedSpace(space)
    setShowDetails(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For managers, validate that the zone belongs to their managed zones
    if (user?.user_type === 'manager' && managedZoneIds.length > 0) {
      const selectedZoneId = formData.zone_id
      if (selectedZoneId && !managedZoneIds.includes(selectedZoneId)) {
        toast.error('You can only create/edit spaces in your managed zones')
        return
      }
      // When editing, ensure manager can only edit spaces in their managed zones
      if (editingSpace) {
        const spaceZone = editingSpace.zone_id
        if (spaceZone && !managedZoneIds.includes(spaceZone)) {
          toast.error('You can only edit spaces in your managed zones')
          return
        }
      }
    }
    if (editingSpace) {
      updateMutation.mutate({ id: editingSpace.space_id!, space: formData })
    } else {
      createMutation.mutate(formData as Space)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading spaces...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Space Management</h1>
        <button
          onClick={() => {
            setIsModalOpen(true)
            setEditingSpace(null)
            resetForm()
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Space</span>
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Space Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Monthly Rate</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {spaces?.map((space: Space) => {
                const zone = zones.find((z: any) => z.zone_id === space.zone_id)
                return (
                  <tr key={space.space_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{space.space_number || space.space_code}</td>
                    <td className="py-3 px-4">{zone?.zone_name || 'N/A'}</td>
                    <td className="py-3 px-4 capitalize">{space.space_type}</td>
                    <td className="py-3 px-4">${space.monthly_rate || space.daily_rate || 0}</td>
                    <td className="py-3 px-4">
                      <select
                        value={space.status}
                        onChange={(e) => {
                          if (confirm(`Change space status to ${e.target.value}?`)) {
                            updateStatusMutation.mutate({ id: space.space_id!, status: e.target.value })
                          }
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium border-0 ${
                          space.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : space.status === 'occupied'
                            ? 'bg-blue-100 text-blue-800'
                            : space.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="reserved">Reserved</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(space)}
                          className="text-primary-600 hover:text-primary-700"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {(user?.user_type !== 'manager' || managedZoneIds.includes(space.zone_id)) && (
                          <>
                            <button
                              onClick={() => {
                                if (user?.user_type === 'manager' && !managedZoneIds.includes(space.zone_id)) {
                                  toast.error('You can only edit spaces in your managed zones')
                                  return
                                }
                                handleEdit(space)
                              }}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                if (user?.user_type === 'manager' && !managedZoneIds.includes(space.zone_id)) {
                                  toast.error('You can only delete spaces in your managed zones')
                                  return
                                }
                                if (confirm('Are you sure you want to delete this space?')) {
                                  deleteMutation.mutate(space.space_id!)
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingSpace ? 'Edit Space' : 'Create New Space'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Zone *</label>
                <select
                  value={formData.zone_id}
                  onChange={(e) => setFormData({ ...formData, zone_id: parseInt(e.target.value) })}
                  className="input"
                  required
                >
                  <option value={0}>Select Zone</option>
                  {zones.map((zone: any) => (
                    <option key={zone.zone_id} value={zone.zone_id}>
                      {zone.zone_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Space Number/Code *</label>
                <input
                  type="text"
                  value={formData.space_number || formData.space_code || ''}
                  onChange={(e) => setFormData({ ...formData, space_number: e.target.value, space_code: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Size (sqm)</label>
                <input
                  type="number"
                  value={formData.size_sqm || ''}
                  onChange={(e) => setFormData({ ...formData, size_sqm: parseInt(e.target.value) })}
                  className="input"
                  placeholder="Square meters"
                />
              </div>
              <div>
                <label className="label">Daily Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.daily_rate || ''}
                  onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) })}
                  className="input"
                  placeholder="Daily rate"
                />
              </div>
              <div>
                <label className="label">Weekly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weekly_rate || ''}
                  onChange={(e) => setFormData({ ...formData, weekly_rate: parseFloat(e.target.value) })}
                  className="input"
                  placeholder="Weekly rate"
                />
              </div>
              <div>
                <label className="label">Space Type *</label>
                <select
                  value={formData.space_type}
                  onChange={(e) => setFormData({ ...formData, space_type: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="stall">Stall</option>
                  <option value="kiosk">Kiosk</option>
                  <option value="stand">Stand</option>
                </select>
              </div>
              <div>
                <label className="label">Monthly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_rate || ''}
                  onChange={(e) => setFormData({ ...formData, monthly_rate: parseFloat(e.target.value) })}
                  className="input"
                  placeholder="Monthly rate"
                />
              </div>
              <div>
                <label className="label">Features</label>
                <textarea
                  value={formData.features || ''}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Space features (e.g., electricity, water, etc.)"
                />
              </div>
              <div>
                <label className="label">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="input"
                  required
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingSpace ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingSpace(null)
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

export default Spaces


