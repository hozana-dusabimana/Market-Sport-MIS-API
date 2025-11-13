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
    daily_rate: 0,
    weekly_rate: 0,
    monthly_rate: 0,
    size_sqm: 0,
    features: '',
    status: 'available',
  })

  const queryClient = useQueryClient()
  const managerId = (user as any)?.profile?.manager_id || (user as any)?.profile?.id || (user as any)?.manager_id || null
  const managedZoneIds = user?.profile?.assigned_zones || []

  // Fetch zones
  const { data: zonesData } = useQuery(
    ['zones', managerId],
    () => zoneService.getAll(managerId ? { manager_id: managerId } : undefined),
    { retry: false, onError: () => {} }
  )
  const allZones = zonesData?.data || []
  const zones = managedZoneIds.length > 0
    ? allZones.filter((z: any) => managedZoneIds.includes(z.zone_id) || (managerId && z.manager_id === managerId))
    : allZones

  // Fetch spaces
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

  // Fetch space details
  const { data: spaceDetails } = useQuery(
    ['space-details', selectedSpace?.space_id],
    () => spaceService.getById(selectedSpace!.space_id),
    { enabled: !!selectedSpace?.space_id && showDetails, retry: false, onError: () => {} }
  )
  const { data: allocationHistoryData } = useQuery(
    ['space-allocation-history', selectedSpace?.space_id],
    () => spaceService.getAllocationHistory(selectedSpace!.space_id),
    { enabled: !!selectedSpace?.space_id && showDetails, retry: false, onError: () => {} }
  )
  const { data: availabilityData } = useQuery(
    ['space-availability', selectedSpace?.space_id],
    () => spaceService.checkAvailability(selectedSpace!.space_id),
    { enabled: !!selectedSpace?.space_id && showDetails, retry: false, onError: () => {} }
  )

  const currentAllocation = spaceDetails?.data?.currentAllocation || null
  const allocationHistory = allocationHistoryData?.data || []
  const isAvailable = availabilityData?.data?.available || false

  // Mutations
  const createMutation = useMutation((space: Space) => spaceService.create(space), {
    onSuccess: () => {
      queryClient.invalidateQueries('spaces')
      toast.success('Space created successfully')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      if (error?.response?.status !== 403) {
        toast.error(error.response?.data?.message || 'Failed to create space')
      }
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
        if (error?.response?.status !== 403) {
          toast.error(error.response?.data?.message || 'Failed to update space')
        }
      },
    }
  )

  const deleteMutation = useMutation((id: number) => spaceService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('spaces')
      toast.success('Space deleted successfully')
    },
    onError: (error: any) => {
      if (error?.response?.status !== 403) {
        toast.error(error.response?.data?.message || 'Failed to delete space')
      }
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
        if (error?.response?.status !== 403) {
          toast.error(error.response?.data?.message || 'Failed to update space status')
        }
      },
    }
  )

  const resetForm = () => {
    setFormData({
      zone_id: 0,
      space_number: '',
      space_type: 'stall',
      daily_rate: 0,
      weekly_rate: 0,
      monthly_rate: 0,
      size_sqm: 0,
      features: '',
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
      space_number: space.space_number,
      space_type: space.space_type,
      daily_rate: space.daily_rate,
      weekly_rate: space.weekly_rate,
      monthly_rate: space.monthly_rate,
      size_sqm: space.size_sqm,
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
    if (managedZoneIds.length > 0 && !managedZoneIds.includes(formData.zone_id!)) {
      toast.error('You can only create spaces in your managed zones')
      return
    }
    const payload: Partial<Space> = {
      zone_id: formData.zone_id,
      space_number: formData.space_number,
      space_type: formData.space_type,
      daily_rate: formData.daily_rate,
      weekly_rate: formData.weekly_rate,
      monthly_rate: formData.monthly_rate,
      size_sqm: formData.size_sqm,
      features: formData.features,
      status: formData.status,
    }

    if (editingSpace) {
      updateMutation.mutate({ id: editingSpace.space_id!, space: payload })
    } else {
      createMutation.mutate(payload as Space)
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
      (space.space_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || space.status === statusFilter
    const matchesZone = zoneFilter === 'all' || space.zone_id === parseInt(zoneFilter)
    const matchesType = typeFilter === 'all' || space.space_type === typeFilter
    return matchesSearch && matchesStatus && matchesZone && matchesType
  })

  if (isLoading) return <div className="text-center py-12">Loading spaces...</div>

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Managed Spaces</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true) }}
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
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Reserved</option>
          </select>
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="input">
            <option value="all">All Zones</option>
            {zones.map(zone => <option key={zone.zone_id} value={zone.zone_id}>{zone.zone_name}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input">
            <option value="all">All Types</option>
            <option value="stall">Stall</option>
            <option value="kiosk">Kiosk</option>
            <option value="stand">Stand</option>
            <option value="standard">Standard</option>
          </select>
        </div>
      </div>

      {/* Spaces Table */}
      <div className="card overflow-x-auto">
        <table className="table">
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
            {filteredSpaces.length > 0 ? filteredSpaces.map(space => {
              const zone = zones.find(z => z.zone_id === space.zone_id)
              const owned = managerId && (space as any).manager_id === managerId
              return (
                <tr key={space.space_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{space.space_number}</td>
                  <td className="py-3 px-4">{zone?.zone_name || 'N/A'}</td>
                  <td className="py-3 px-4 capitalize">{space.space_type}</td>
                  <td className="py-3 px-4">{space.size_sqm || 'N/A'}</td>
                  <td className="py-3 px-4">${space.monthly_rate || 0}</td>
                  <td className="py-3 px-4">
                    {owned ? (
                      <select
                        value={space.status}
                        onChange={(e) => {
                          if (managedZoneIds.length > 0 && !managedZoneIds.includes(space.zone_id)) {
                            toast.error('You can only modify spaces in your managed zones')
                            return
                          }
                          if (window.confirm(`Change status to ${e.target.value}?`)) {
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
                    ) : (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          space.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : space.status === 'occupied'
                            ? 'bg-blue-100 text-blue-800'
                            : space.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {space.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleViewDetails(space)} className="text-primary-600 hover:text-primary-700" title="View Details"><Eye size={18} /></button>
                      {owned && (
                        <>
                          <button onClick={() => handleEdit(space)} className="text-blue-600 hover:text-blue-700" title="Edit"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(space.space_id!, space.zone_id)} className="text-red-600 hover:text-red-700" title="Delete"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">No spaces found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto slide-up">
            <h2 className="text-2xl font-bold mb-4">{editingSpace ? 'Edit Space' : 'Create Space'}</h2>
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
                    {zones.map(zone => <option key={zone.zone_id} value={zone.zone_id}>{zone.zone_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">Space Number *</label>
                  <input
                    type="text"
                    value={formData.space_number}
                    onChange={(e) => setFormData({ ...formData, space_number: e.target.value })}
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
                    <option value="standard">Standard</option>
                  </select>
                </div>

                <div>
                  <label className="label">Size (sqm)</label>
                  <input
                    type="number"
                    value={formData.size_sqm || ''}
                    onChange={(e) => setFormData({ ...formData, size_sqm: parseInt(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, weekly_rate: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, monthly_rate: parseFloat(e.target.value) || 0 })}
                    className="input"
                    placeholder="Monthly rate"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Features</label>
                  <textarea
                    value={formData.features || ''}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="input"
                    placeholder="Describe features"
                  />
                </div>

                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingSpace(null); resetForm() }} className="btn btn-gray">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSpace ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerSpaces
