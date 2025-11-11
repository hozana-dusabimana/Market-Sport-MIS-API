import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { spaceService, Space } from '../../services/spaceService'
import { zoneService } from '../../services/zoneService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react'

const ManagerSpaces = () => {
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
    space_number: '',
    space_type: 'stall',
    monthly_rate: 0,
    status: 'available',
  })

  const queryClient = useQueryClient()
  const managerId = user?.userId
  const managedZoneIds = user?.profile?.assigned_zones || []

  const { data: zonesData } = useQuery(
    ['zones', managerId],
    () => zoneService.getAll({ manager_id: managerId }),
    { retry: false, onError: () => {} }
  )
  const allZones = zonesData?.data || []
  const zones = managedZoneIds.length > 0
    ? allZones.filter((z: any) => managedZoneIds.includes(z.zone_id))
    : allZones

  const { data: spacesData, isLoading } = useQuery(
    ['spaces', statusFilter, zoneFilter, typeFilter, searchTerm, managedZoneIds],
    () => spaceService.getAll({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      zone_id: zoneFilter !== 'all' ? parseInt(zoneFilter) : undefined,
      space_type: typeFilter !== 'all' ? typeFilter : undefined,
      search: searchTerm || undefined,
    }),
    { retry: false, onError: () => {} }
  )
  
  const allSpaces = spacesData?.data || []
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
  
  const { data: availabilityData } = useQuery(
    ['space-availability', selectedSpace?.space_id],
    () => spaceService.checkAvailability(selectedSpace?.space_id!),
    { enabled: !!selectedSpace?.space_id && showDetails, retry: false, onError: () => {} }
  )
  
  const currentAllocation = spaceDetails?.data?.currentAllocation || null
  const allocationHistory = allocationHistoryData?.data || []
  const isAvailable = availabilityData?.data?.available || false

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
      space_number: '',
      space_type: 'stall',
      monthly_rate: 0,
      status: 'available',
    })
  }

  const handleEdit = (space: Space) => {
    if (managedZoneIds.length > 0 && !managedZoneIds.includes(space.zone_id)) {
      toast.error('You can only edit spaces in your managed zones')
      return
    }
    setEditingSpace(space)
    setFormData({
      zone_id: space.zone_id,
      space_number: space.space_number || space.space_code || '',
      space_code: space.space_code || space.space_number || '',
      space_type: space.space_type,
      size_sqm: space.size_sqm,
      daily_rate: space.daily_rate,
      weekly_rate: space.weekly_rate,
      monthly_rate: space.monthly_rate,
      features: space.features,
      status: space.status,
    })
    setIsModalOpen(true)
  }

  const handleViewDetails = (space: Space) => {
    if (managedZoneIds.length > 0 && !managedZoneIds.includes(space.zone_id)) {
      toast.error('You can only view spaces in your managed zones')
      return
    }
    setSelectedSpace(space)
    setShowDetails(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (managedZoneIds.length > 0) {
      const selectedZoneId = formData.zone_id
      if (selectedZoneId && !managedZoneIds.includes(selectedZoneId)) {
        toast.error('You can only create/edit spaces in your managed zones')
        return
      }
      if (editingSpace && !managedZoneIds.includes(editingSpace.zone_id)) {
        toast.error('You can only edit spaces in your managed zones')
        return
      }
    }
    if (editingSpace) {
      updateMutation.mutate({ id: editingSpace.space_id!, space: formData })
    } else {
      createMutation.mutate(formData as Space)
    }
  }

  const handleDelete = (id: number, zoneId: number) => {
    if (managedZoneIds.length > 0 && !managedZoneIds.includes(zoneId)) {
      toast.error('You can only delete spaces in your managed zones')
      return
    }
    if (window.confirm('Are you sure you want to delete this space?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredSpaces = spaces.filter((space: Space) => {
    const matchesSearch = !searchTerm || 
      (space.space_number || space.space_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || space.status === statusFilter
    const matchesZone = zoneFilter === 'all' || space.zone_id === parseInt(zoneFilter)
    const matchesType = typeFilter === 'all' || space.space_type === typeFilter
    return matchesSearch && matchesStatus && matchesZone && matchesType
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading spaces...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Managed Spaces</h1>
        <button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Space</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search spaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Reserved</option>
          </select>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Zones</option>
            {zones.map((zone: any) => (
              <option key={zone.zone_id} value={zone.zone_id}>
                {zone.zone_name}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="stall">Stall</option>
            <option value="kiosk">Kiosk</option>
            <option value="stand">Stand</option>
          </select>
        </div>
      </div>

      {/* Spaces Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Space Number</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Size (sqm)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Monthly Rate</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpaces.length > 0 ? (
                filteredSpaces.map((space: Space) => {
                  const zone = zones.find((z: any) => z.zone_id === space.zone_id)
                  return (
                    <tr key={space.space_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{space.space_number || space.space_code || 'N/A'}</td>
                      <td className="py-3 px-4">{zone?.zone_name || 'N/A'}</td>
                      <td className="py-3 px-4 capitalize">{space.space_type}</td>
                      <td className="py-3 px-4">{space.size_sqm || 'N/A'}</td>
                      <td className="py-3 px-4">${space.monthly_rate || space.daily_rate || 0}</td>
                      <td className="py-3 px-4">
                        <select
                          value={space.status}
                          onChange={(e) => {
                            if (window.confirm(`Change space status to ${e.target.value}?`)) {
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
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(space)}
                            className="text-primary-600 hover:text-primary-700"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(space)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(space.space_id!, space.zone_id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No spaces found
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingSpace ? 'Edit Space' : 'Create Space'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="label">Size (sqm)</label>
                  <input
                    type="number"
                    value={formData.size_sqm || ''}
                    onChange={(e) => setFormData({ ...formData, size_sqm: parseInt(e.target.value) || undefined })}
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
                    onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || undefined })}
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
                    onChange={(e) => setFormData({ ...formData, weekly_rate: parseFloat(e.target.value) || undefined })}
                    className="input"
                    placeholder="Weekly rate"
                  />
                </div>
                <div>
                  <label className="label">Monthly Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthly_rate || ''}
                    onChange={(e) => setFormData({ ...formData, monthly_rate: parseFloat(e.target.value) || undefined })}
                    className="input"
                    placeholder="Monthly rate"
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
                <div className="md:col-span-2">
                  <label className="label">Features</label>
                  <textarea
                    value={formData.features || ''}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Space features (e.g., electricity, water, etc.)"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary">
                  {editingSpace ? 'Update' : 'Create'}
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

      {/* Space Details Modal */}
      {showDetails && selectedSpace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Space Details: {selectedSpace.space_number || selectedSpace.space_code}</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedSpace(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Space Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Number:</span> {selectedSpace.space_number || selectedSpace.space_code || 'N/A'}</p>
                  <p><span className="font-medium">Type:</span> {selectedSpace.space_type || 'N/A'}</p>
                  <p><span className="font-medium">Size:</span> {selectedSpace.size_sqm ? `${selectedSpace.size_sqm} sqm` : 'N/A'}</p>
                  <p><span className="font-medium">Status:</span> {selectedSpace.status}</p>
                  <p><span className="font-medium">Daily Rate:</span> ${selectedSpace.daily_rate || 0}</p>
                  <p><span className="font-medium">Weekly Rate:</span> ${selectedSpace.weekly_rate || 0}</p>
                  <p><span className="font-medium">Monthly Rate:</span> ${selectedSpace.monthly_rate || 0}</p>
                  <p><span className="font-medium">Available:</span> {isAvailable ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {currentAllocation && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Current Allocation</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Seller ID:</span> {currentAllocation.seller_id}</p>
                    <p><span className="font-medium">Start Date:</span> {currentAllocation.start_date ? new Date(currentAllocation.start_date).toLocaleDateString() : 'N/A'}</p>
                    <p><span className="font-medium">End Date:</span> {currentAllocation.end_date ? new Date(currentAllocation.end_date).toLocaleDateString() : 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {currentAllocation.status}</p>
                  </div>
                </div>
              )}
            </div>

            {allocationHistory && allocationHistory.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Allocation History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3">Seller ID</th>
                        <th className="text-left py-2 px-3">Start Date</th>
                        <th className="text-left py-2 px-3">End Date</th>
                        <th className="text-left py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocationHistory.map((allocation: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3">{allocation.seller_id}</td>
                          <td className="py-2 px-3">{allocation.start_date ? new Date(allocation.start_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-2 px-3">{allocation.end_date ? new Date(allocation.end_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              allocation.status === 'active' ? 'bg-green-100 text-green-800' :
                              allocation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {allocation.status}
                            </span>
                          </td>
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

export default ManagerSpaces


