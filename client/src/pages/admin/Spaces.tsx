import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { spaceService, Space } from '../../services/spaceService'
import { zoneService } from '../../services/zoneService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { 
  Plus, Edit, Trash2, Square, Search, Eye, Filter, X, 
  MapPin, DollarSign, Calendar, Zap, HardHat, Clock
} from 'lucide-react'

// Explicit Tailwind Styles
const classNames = {
  card: 'bg-white p-6 rounded-xl shadow-lg border border-gray-100',
  btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-md',
  btnSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-5 rounded-xl transition-colors',
  input: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow',
  select: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none bg-white',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  modalBackdrop: 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4',
  modalContent: 'bg-white rounded-xl shadow-2xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto',
}

const spaceTypes = ['stall', 'kiosk', 'stand']
const spaceStatuses = ['available', 'occupied', 'maintenance', 'reserved']

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800 border-green-200';
    case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'reserved': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

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
    daily_rate: 0, // Added based on modal
    weekly_rate: 0, // Added based on modal
    size_sqm: 0, // Added based on modal
    features: '', // Added based on modal
    status: 'available',
  })

  const queryClient = useQueryClient()
  const isManager = user?.user_type === 'manager'
  const managerId = isManager ? user?.userId : undefined
  const managedZoneIds = isManager && user?.profile?.assigned_zones
    ? user.profile.assigned_zones
    : []

  // Fetch all zones (filtered by manager if necessary)
  const { data: zonesData } = useQuery(
    ['zones', managerId],
    () => zoneService.getAll({ manager_id: managerId }),
    { retry: false, onError: () => {}, staleTime: 60000 }
  )
  const allZones = zonesData?.data || []
  
  // Filter zones client-side based on `assigned_zones` for manager view/form select
  const zones = managedZoneIds.length > 0
    ? allZones.filter((z: any) => managedZoneIds.includes(z.zone_id))
    : allZones

  // Fetch spaces based on filters
  const { data: spacesData, isLoading } = useQuery(
    ['spaces', statusFilter, zoneFilter, typeFilter, searchTerm],
    () =>
      spaceService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        zone_id: zoneFilter !== 'all' ? parseInt(zoneFilter) : undefined,
        space_type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchTerm || undefined,
      }),
    { retry: false, onError: () => {}, staleTime: 30000 }
  )
  
  const allSpaces = spacesData?.data || []
  // Manager RBAC: Further filter spaces if client-side filtering needed (redundant if backend filter by zone_id works, but safe)
  const spaces = isManager && managedZoneIds.length > 0
    ? allSpaces.filter((s: Space) => managedZoneIds.includes(s.zone_id))
    : allSpaces
  
  // Fetch details for the selected space
  const { data: spaceDetails, isLoading: isLoadingDetails } = useQuery(
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

  // --- Mutations ---
  const createMutation = useMutation((space: Space) => spaceService.create(space), {
    onSuccess: () => {
      queryClient.invalidateQueries('spaces')
      toast.success('Space created successfully!')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create space.')
    },
  })

  const updateMutation = useMutation(
    ({ id, space }: { id: number; space: Partial<Space> }) => spaceService.update(id, space),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('spaces')
        queryClient.invalidateQueries(['space-details', editingSpace?.space_id])
        toast.success('Space updated successfully!')
        setIsModalOpen(false)
        setEditingSpace(null)
        resetForm()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update space.')
      },
    }
  )

  const deleteMutation = useMutation((id: number) => spaceService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('spaces')
      toast.success('Space deleted successfully.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete space.')
    },
  })

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) => spaceService.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('spaces')
        queryClient.invalidateQueries(['space-details', selectedSpace?.space_id])
        toast.success('Space status updated successfully.')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update space status.')
      },
    }
  )

  // --- Handlers ---
  const resetForm = () => {
    setFormData({
      zone_id: 0,
      space_code: '',
      space_type: 'stall',
      monthly_rate: 0,
      daily_rate: 0,
      weekly_rate: 0,
      size_sqm: 0,
      features: '',
      status: 'available',
    })
  }

  const handleEdit = (space: Space) => {
    setEditingSpace(space)
    // Ensure all rates/fields are present in formData, defaulting to 0/''
    setFormData({
      ...space,
      space_code: space.space_code || space.space_number,
      daily_rate: space.daily_rate || 0,
      weekly_rate: space.weekly_rate || 0,
      monthly_rate: space.monthly_rate || 0,
      size_sqm: space.size_sqm || 0,
      features: space.features || '',
    })
    setIsModalOpen(true)
  }

  const handleViewDetails = (space: Space) => {
    setSelectedSpace(space)
    setShowDetails(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.zone_id === 0) {
      toast.error('Please select a Zone.')
      return
    }

    // Manager RBAC validation
    if (isManager && managedZoneIds.length > 0) {
      const selectedZoneId = formData.zone_id
      const spaceZoneId = editingSpace?.zone_id || selectedZoneId

      if (spaceZoneId && !managedZoneIds.includes(spaceZoneId)) {
        toast.error('You can only manage spaces in your assigned zones.')
        return
      }
    }
    
    // Cleanup/normalize rate fields
    const spaceToSubmit: Space = {
      ...formData as Space,
      daily_rate: formData.daily_rate || 0,
      weekly_rate: formData.weekly_rate || 0,
      monthly_rate: formData.monthly_rate || 0,
      size_sqm: formData.size_sqm || 0,
      // Use space_code if space_number isn't explicitly provided (or vice versa)
      space_code: formData.space_code || formData.space_number || '', 
    }

    if (editingSpace) {
      updateMutation.mutate({ id: editingSpace.space_id!, space: spaceToSubmit })
    } else {
      createMutation.mutate(spaceToSubmit)
    }
  }

  if (isLoading) {
    return <div className="text-center py-16 text-xl text-blue-600">Loading space inventory...</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-900">Space Management 📐</h1>
        <button
          onClick={() => {
            setIsModalOpen(true)
            setEditingSpace(null)
            resetForm()
          }}
          className={`${classNames.btnPrimary} flex items-center space-x-2`}
        >
          <Plus size={20} />
          <span>Add Space</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className={`${classNames.card} mb-8`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search code or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${classNames.input} pl-10`}
            />
          </div>
          
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className={classNames.select}
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
            className={classNames.select}
          >
            <option value="all">All Types</option>
            {spaceTypes.map((type) => (
              <option key={type} value={type} className='capitalize'>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={classNames.select}
          >
            <option value="all">All Statuses</option>
            {spaceStatuses.map((status) => (
              <option key={status} value={status} className='capitalize'>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spaces Table */}
      <div className={classNames.card}>
        {spaces.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No spaces found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Space Code</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Zone</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Monthly Rate</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {spaces.map((space: Space) => {
                  const zone = allZones.find((z: any) => z.zone_id === space.zone_id)
                  const canManage = !isManager || managedZoneIds.includes(space.zone_id)
                  
                  // FIX: Explicitly convert rates to float to ensure .toFixed() works.
                  const monthlyRate = parseFloat(space.monthly_rate as any) || 0
                  const dailyRate = parseFloat(space.daily_rate as any) || 0
                  const displayRate = monthlyRate > 0 ? monthlyRate : dailyRate

                  return (
                    <tr key={space.space_id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{space.space_number || space.space_code}</td>
                      <td className="py-3 px-4 text-sm">{zone?.zone_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm capitalize">{space.space_type}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        ${displayRate.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={space.status}
                          onChange={(e) => {
                            if (!canManage) {
                              toast.error('You are not authorized to change the status of this space.')
                              return
                            }
                            if (confirm(`Change space status to ${e.target.value}?`)) {
                              updateStatusMutation.mutate({ id: space.space_id!, status: e.target.value })
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium border border-transparent focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-shadow ${getStatusColor(space.status)}`}
                          disabled={!canManage}
                        >
                          {spaceStatuses.map(s => (
                            <option key={s} value={s} className='bg-white text-gray-900'>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(space)}
                            className="text-gray-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleEdit(space)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete space ${space.space_code}?`)) {
                                    deleteMutation.mutate(space.space_id!)
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Space Creation/Edit Modal */}
      {isModalOpen && (
        <div className={classNames.modalBackdrop}>
          <div className={classNames.modalContent}>
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-2xl font-bold text-blue-900">
                {editingSpace ? 'Edit Space' : 'Create New Space'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditingSpace(null); resetForm(); }} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Zone Selector */}
              <div>
                <label className={classNames.label}>Zone *</label>
                <select
                  value={formData.zone_id}
                  onChange={(e) => setFormData({ ...formData, zone_id: parseInt(e.target.value) })}
                  className={classNames.select}
                  required
                  // Disable zone change if editing and user is manager
                  disabled={editingSpace && isManager && !managedZoneIds.includes(editingSpace.zone_id)}
                >
                  <option value={0}>Select Zone</option>
                  {zones.map((zone: any) => (
                    <option key={zone.zone_id} value={zone.zone_id}>
                      {zone.zone_name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Space Details */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className={classNames.label}>Space Code *</label>
                  <input
                    type="text"
                    value={formData.space_code || formData.space_number || ''}
                    onChange={(e) => setFormData({ ...formData, space_code: e.target.value })}
                    className={classNames.input}
                    required
                  />
                </div>
                <div>
                  <label className={classNames.label}>Space Type *</label>
                  <select
                    value={formData.space_type}
                    onChange={(e) => setFormData({ ...formData, space_type: e.target.value as any })}
                    className={classNames.select}
                    required
                  >
                    {spaceTypes.map(type => (
                      <option key={type} value={type} className='capitalize'>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rates */}
              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <label className={classNames.label}>Daily Rate ($)</label>
                  <input
                    type="number" step="0.01"
                    value={formData.daily_rate || ''}
                    onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) })}
                    className={classNames.input}
                  />
                </div>
                <div>
                  <label className={classNames.label}>Weekly Rate ($)</label>
                  <input
                    type="number" step="0.01"
                    value={formData.weekly_rate || ''}
                    onChange={(e) => setFormData({ ...formData, weekly_rate: parseFloat(e.target.value) })}
                    className={classNames.input}
                  />
                </div>
                <div>
                  <label className={classNames.label}>Monthly Rate ($)</label>
                  <input
                    type="number" step="0.01"
                    value={formData.monthly_rate || ''}
                    onChange={(e) => setFormData({ ...formData, monthly_rate: parseFloat(e.target.value) })}
                    className={classNames.input}
                  />
                </div>
              </div>
              
              {/* Size and Status */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className={classNames.label}>Size (sqm)</label>
                  <input
                    type="number"
                    value={formData.size_sqm || ''}
                    onChange={(e) => setFormData({ ...formData, size_sqm: parseInt(e.target.value) })}
                    className={classNames.input}
                  />
                </div>
                <div>
                  <label className={classNames.label}>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className={classNames.select}
                    required
                  >
                    {spaceStatuses.map(status => (
                      <option key={status} value={status} className='capitalize'>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={classNames.label}>Features</label>
                <textarea
                  value={formData.features || ''}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className={classNames.input}
                  rows={2}
                  placeholder="Space features (e.g., electricity, water, high ceiling)"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className={`${classNames.btnPrimary} flex-1`} disabled={createMutation.isLoading || updateMutation.isLoading}>
                  {createMutation.isLoading || updateMutation.isLoading ? 'Processing...' : (editingSpace ? 'Update Space' : 'Create Space')}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingSpace(null); resetForm(); }}
                  className={`${classNames.btnSecondary} flex-1`}
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
        <div className={classNames.modalBackdrop}>
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-6">
              <h2 className="text-2xl font-bold text-blue-900">Space Details: {selectedSpace.space_code || selectedSpace.space_number}</h2>
              <button
                onClick={() => { setShowDetails(false); setSelectedSpace(null); }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            {isLoadingDetails ? (
              <div className="text-center py-8">Loading space details...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <DetailBox label="Zone" value={zones.find(z => z.zone_id === selectedSpace.zone_id)?.zone_name || 'N/A'} icon={MapPin} />
                  <DetailBox label="Type" value={selectedSpace.space_type.toUpperCase()} icon={Square} />
                  <DetailBox label="Size" value={`${selectedSpace.size_sqm || 'N/A'} sqm`} icon={Square} />
                  <DetailBox label="Status" value={selectedSpace.status.toUpperCase()} icon={Square} isStatus={true} status={selectedSpace.status} />
                </div>
                
                {/* Rates Section */}
                <div className="border-t pt-6 mt-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Rental Rates</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <RatePill label="Daily" rate={selectedSpace.daily_rate} color="teal" />
                    <RatePill label="Weekly" rate={selectedSpace.weekly_rate} color="orange" />
                    <RatePill label="Monthly" rate={selectedSpace.monthly_rate} color="blue" />
                  </div>
                </div>

                {/* Features & Current Allocation */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Information</h3>
                  <div className='grid grid-cols-2 gap-6'>
                    <div>
                      <h4 className='text-lg font-semibold text-gray-700 mb-2 flex items-center'><Zap size={18} className='mr-2 text-yellow-600'/> Features</h4>
                      <p className='text-sm text-gray-600'>{selectedSpace.features || 'No specific features listed.'}</p>
                    </div>
                    {currentAllocation && (
                      <div>
                        <h4 className='text-lg font-semibold text-gray-700 mb-2 flex items-center'><HardHat size={18} className='mr-2 text-red-600'/> Current Occupant</h4>
                        <div className='bg-red-50 p-3 rounded-lg border border-red-200 text-sm'>
                          <p className='font-bold text-red-800'>{currentAllocation.client_name || 'Allocated Client'}</p>
                          <p className='text-red-700'>Start: {new Date(currentAllocation.start_date).toLocaleDateString()}</p>
                          <p className='text-red-700'>End: {currentAllocation.end_date ? new Date(currentAllocation.end_date).toLocaleDateString() : 'Ongoing'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Allocation History Table */}
                {allocationHistory.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Clock size={18} className='mr-2 text-gray-600'/> Allocation History ({allocationHistory.length})</h3>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-bold text-gray-600">Client Name</th>
                            <th className="text-left py-3 px-4 font-bold text-gray-600">Start Date</th>
                            <th className="text-left py-3 px-4 font-bold text-gray-600">End Date</th>
                            <th className="text-right py-3 px-4 font-bold text-gray-600">Total Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allocationHistory.map((history: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="py-2 px-4 text-gray-800 font-medium">{history.client_name || 'N/A'}</td>
                              <td className="py-2 px-4">{new Date(history.start_date).toLocaleDateString()}</td>
                              <td className="py-2 px-4">{history.end_date ? new Date(history.end_date).toLocaleDateString() : 'N/A'}</td>
                              {/* FIX: Use parseFloat for total_revenue */}
                              <td className="py-2 px-4 text-right font-semibold text-sm text-green-700">
                                ${(parseFloat(history.total_revenue) || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
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
      <Icon size={16} className="text-blue-600 mr-2" />
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
    </div>
    {isStatus ? (
      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${getStatusColor(status)}`}>
        {value}
      </span>
    ) : (
      <p className="text-lg font-bold text-gray-900">{value}</p>
    )}
  </div>
)

const RatePill = ({ label, rate, color }) => {
  const colorMap = {
    teal: 'border-teal-400 bg-teal-50 text-teal-800',
    blue: 'border-blue-400 bg-blue-50 text-blue-800',
    orange: 'border-orange-400 bg-orange-50 text-orange-800',
  }
  const colorClass = colorMap[color] || 'border-gray-400 bg-gray-50 text-gray-800'

  return (
    <div className={`p-4 border-2 rounded-xl flex flex-col items-center ${colorClass}`}>
      <DollarSign size={24} />
      <p className="text-2xl font-bold mt-2">
        {/* FIX: Use parseFloat for rate */}
        ${(parseFloat(rate) || 0).toFixed(2)}
      </p>
      <p className="text-xs font-semibold uppercase mt-1 opacity-80">{label}</p>
    </div>
  )
}

export default Spaces