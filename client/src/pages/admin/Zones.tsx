import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { zoneService, Zone } from '../../services/zoneService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Search, Eye, X, MapPin, Square, DollarSign, User } from 'lucide-react'

// Explicit Tailwind Styles for readability and consistency
const classNames = {
  card: 'bg-white p-6 rounded-xl shadow-lg border border-gray-100',
  btnPrimary: 'bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-md',
  btnSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-5 rounded-xl transition-colors',
  input: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  modalBackdrop: 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4',
  modalContent: 'bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto',
}

const Zones = () => {
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
    manager_id: undefined,
    total_spaces: 0,
    status: 'active',
  })

  const queryClient = useQueryClient()
  
  // Determine if the user is a manager for filtering purposes
  const isManager = user?.user_type === 'manager'
  const managerId = isManager ? user?.userId : undefined

  // Primary Zone List Query
  const { data, isLoading } = useQuery(
    ['zones', statusFilter, searchTerm, managerId],
    () => zoneService.getAll({ 
      status: statusFilter !== 'all' ? statusFilter : undefined, 
      search: searchTerm || undefined,
      manager_id: isManager ? managerId : undefined, // Only filter by manager ID if manager
    }),
    { retry: false, onError: () => {}, staleTime: 60000 }
  )
  
  const allZones = data?.data || []
  
  // Refined filtering logic (backend filter is better, but this handles client-side consistency)
  const managedZoneIds = isManager && user?.profile?.assigned_zones
    ? user.profile.assigned_zones
    : []

  const zones = isManager && managedZoneIds.length > 0
    ? allZones.filter((z) => managedZoneIds.includes(z.zone_id!))
    : allZones
  
  // Zone Details Query (Combines stats and spaces for efficiency)
  const { data: zoneDetails, isLoading: isLoadingDetails } = useQuery(
    ['zone-details', selectedZone?.zone_id],
    () => zoneService.getById(selectedZone?.zone_id!),
    { enabled: !!selectedZone?.zone_id && showDetails, retry: false, onError: () => {} }
  )
  
  const zoneStatistics = zoneDetails?.data?.stats
  const spacesInZone = zoneDetails?.data?.spaces || []

  // --- Mutations ---
  const createMutation = useMutation((zone: Zone) => zoneService.create(zone), {
    onSuccess: () => {
      queryClient.invalidateQueries('zones')
      toast.success('Zone created successfully!')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create zone.')
    },
  })

  const updateMutation = useMutation(
    ({ id, zone }: { id: number; zone: Partial<Zone> }) => zoneService.update(id, zone),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('zones')
        toast.success('Zone updated successfully!')
        setIsModalOpen(false)
        setEditingZone(null)
        resetForm()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update zone.')
      },
    }
  )

  const deleteMutation = useMutation((id: number) => zoneService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('zones')
      toast.success('Zone deleted successfully.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete zone.')
    },
  })

  // --- Handlers ---
  const resetForm = () => {
    setFormData({
      zone_name: '',
      zone_code: '',
      description: '',
      location: '',
      manager_id: undefined,
      total_spaces: 0,
      status: 'active',
    })
  }

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone)
    setFormData(zone)
    setIsModalOpen(true)
  }

  const handleViewDetails = (zone: Zone) => {
    setSelectedZone(zone)
    setShowDetails(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Authorization check for managers (prevent unauthorized editing)
    if (isManager) {
      if (!editingZone) {
        // Assign zone to manager on creation
        formData.manager_id = user.userId
      } else {
        // Prevent editing/deleting zones not explicitly assigned
        if (!managedZoneIds.includes(editingZone.zone_id!)) {
          toast.error('You are not authorized to edit this zone.')
          return
        }
      }
    }
    
    // Execute mutation
    if (editingZone) {
      updateMutation.mutate({ id: editingZone.zone_id!, zone: formData })
    } else {
      createMutation.mutate(formData as Zone)
    }
  }

  // --- Rendering ---
  if (isLoading) {
    return <div className="text-center py-16 text-xl text-teal-600">Loading zones data...</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-900">Zone Management 🗺️</h1>
        <button
          onClick={() => {
            setIsModalOpen(true)
            setEditingZone(null)
            resetForm()
          }}
          className={`${classNames.btnPrimary} flex items-center space-x-2`}
        >
          <Plus size={20} />
          <span>Add Zone</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className={`${classNames.card} mb-8`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by zone name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${classNames.input} pl-10`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${classNames.input} md:w-48 flex-shrink-0`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Zone Table */}
      <div className={classNames.card}>
        {zones.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No zones found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Zone Code</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Zone Name</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Total Spaces</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {zones.map((zone: Zone) => (
                  <tr key={zone.zone_id} className="hover:bg-teal-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{zone.zone_code}</td>
                    <td className="py-3 px-4 text-sm">{zone.zone_name}</td>
                    <td className="py-3 px-4 text-sm">{zone.location || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          zone.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {zone.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{zone.total_spaces || 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(zone)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {/* Action buttons with RBAC logic */}
                        {(!isManager || managedZoneIds.includes(zone.zone_id!)) && (
                          <>
                            <button
                              onClick={() => handleEdit(zone)}
                              className="text-teal-600 hover:text-teal-800 p-1 rounded-full hover:bg-teal-100 transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete zone ${zone.zone_code}?`)) {
                                  deleteMutation.mutate(zone.zone_id!)
                                }
                              }}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Zone Creation/Edit Modal */}
      {isModalOpen && (
        <div className={classNames.modalBackdrop}>
          <div className={classNames.modalContent}>
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-2xl font-bold text-blue-900">
                {editingZone ? 'Edit Zone' : 'Create New Zone'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditingZone(null); resetForm(); }} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={classNames.label}>Zone Code *</label>
                <input
                  type="text"
                  value={formData.zone_code}
                  onChange={(e) => setFormData({ ...formData, zone_code: e.target.value })}
                  className={classNames.input}
                  required
                />
              </div>
              <div>
                <label className={classNames.label}>Zone Name *</label>
                <input
                  type="text"
                  value={formData.zone_name}
                  onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                  className={classNames.input}
                  required
                />
              </div>
              <div>
                <label className={classNames.label}>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={classNames.input}
                />
              </div>
              <div>
                <label className={classNames.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={classNames.input}
                  rows={3}
                />
              </div>
              <div>
                <label className={classNames.label}>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className={classNames.input}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className={`${classNames.btnPrimary} flex-1`} disabled={createMutation.isLoading || updateMutation.isLoading}>
                  {createMutation.isLoading || updateMutation.isLoading ? 'Processing...' : (editingZone ? 'Update Zone' : 'Create Zone')}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingZone(null); resetForm(); }}
                  className={`${classNames.btnSecondary} flex-1`}
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
        <div className={classNames.modalBackdrop}>
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-2xl font-bold text-blue-900">Zone Details: {selectedZone.zone_name}</h2>
              <button
                onClick={() => { setShowDetails(false); setSelectedZone(null); }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            {isLoadingDetails && <div className="text-center py-8">Loading details...</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <DetailBox label="Zone Code" value={selectedZone.zone_code} icon={MapPin} />
              <DetailBox label="Location" value={selectedZone.location || 'N/A'} icon={MapPin} />
              <DetailBox label="Status" value={selectedZone.status.toUpperCase()} icon={Square} isStatus={true} status={selectedZone.status} />
              <div className="md:col-span-3">
                <label className={classNames.label}>Description</label>
                <p className="text-gray-800 text-sm">{selectedZone.description || 'No description provided.'}</p>
              </div>
            </div>

            {/* Statistics Section */}
            {zoneStatistics && (
              <div className="border-t pt-6 mt-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Zone Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatPill label="Total Spaces" value={zoneStatistics.total_spaces || 0} color="teal" />
                  <StatPill label="Occupied" value={zoneStatistics.occupied_spaces || 0} color="blue" />
                  <StatPill label="Total Allocations" value={zoneStatistics.total_allocations || 0} color="purple" />
                  <StatPill label="Total Revenue" value={`RWF ${(zoneStatistics.total_revenue || 0).toFixed(2)}`} color="orange" />
                </div>
              </div>
            )}

            {/* Spaces in Zone Table */}
            {spacesInZone && spacesInZone.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Assigned Spaces ({spacesInZone.length})</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-bold text-gray-600">Space No.</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-600">Type</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-600">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spacesInZone.map((space: any) => (
                        <tr key={space.space_id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 text-gray-800 font-medium">{space.space_number || space.space_code}</td>
                          <td className="py-2 px-4 capitalize">{space.space_type}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              space.status === 'available' ? 'bg-green-100 text-green-800' :
                              space.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {space.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right font-semibold text-sm">
                            RWF {(space.monthly_rate || space.daily_rate || 0).toFixed(2)}
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

// Utility components for clean details view
const DetailBox = ({ label, value, icon: Icon, isStatus, status }) => (
  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
    <div className="flex items-center mb-1">
      <Icon size={16} className="text-teal-600 mr-2" />
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
    </div>
    {isStatus ? (
      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${
        status === 'active' ? 'bg-green-200 text-green-900' : 'bg-gray-200 text-gray-900'
      }`}>
        {value}
      </span>
    ) : (
      <p className="text-lg font-bold text-gray-900">{value}</p>
    )}
  </div>
)

const StatPill = ({ label, value, color }) => {
  const colorMap = {
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  }
  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <div className="flex items-center mt-1">
        <div className={`w-2 h-2 rounded-full mr-2 ${colorMap[color]}`}></div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default Zones