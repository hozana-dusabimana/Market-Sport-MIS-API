import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { userService, User } from '../../services/userService'
import toast from 'react-hot-toast'
import { Search, UserCheck, UserX, Eye, Users, Shield, UserCog, X, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

// Mock types and service calls for independent execution
// NOTE: In a real environment, you would use the actual imports.

// --- Utility Components ---
const StatCard = ({ title, value, active, suspended, icon: Icon, colorClass = 'text-blue-600', bgColor = 'bg-blue-50' }: any) => (
  <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 transform hover:scale-[1.02] transition-transform duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 capitalize">{title}</p>
        <p className="text-3xl font-extrabold text-gray-900 mt-1">{value || 0}</p>
        <div className="flex space-x-3 mt-3 text-xs font-semibold">
          <span className="text-green-600 flex items-center">
            <UserCheck size={14} className="mr-1" /> Active: {active || 0}
          </span>
          <span className="text-red-600 flex items-center">
            <UserX size={14} className="mr-1" /> Suspended: {suspended || 0}
          </span>
        </div>
      </div>
      <div className={`p-3 ${bgColor} rounded-full`}>
        <Icon className={`w-8 h-8 ${colorClass}`} />
      </div>
    </div>
  </div>
)

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('') // 
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone_number: '',
  })

  const queryClient = useQueryClient()

  // 1. Debounce Logic: Update debouncedSearchTerm only after 500ms pause
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    // Cleanup function: This runs if searchTerm changes before the timeout fires
    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      username: user.username,
      email: user.email,
      phone_number: user.phone_number || '',
    })
    setShowEdit(true)
  }

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    if (!editForm.username.trim() || !editForm.email.trim()) {
      toast.error('Username and email are required')
      return
    }
    updateUserMutation.mutate({
      id: selectedUser.user_id,
      data: {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        phone_number: editForm.phone_number || null,
      },
    })
  }

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.user_id)
    }
  }

  // 2. Use the debounced term in useQuery
  const { data, isLoading } = useQuery(
    ['users', typeFilter, statusFilter, debouncedSearchTerm],
    () =>
      userService.getAll({
        user_type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearchTerm || undefined, // 
      })
  )

  // Normalize users data from backend into a flat array
  const rawData: any = data
  let users: User[] = []
  if (Array.isArray(rawData)) {
    users = rawData
  } else if (Array.isArray(rawData?.users)) {
    users = rawData.users
  } else if (Array.isArray(rawData?.data)) {
    users = rawData.data
  } else if (Array.isArray(rawData?.data?.users)) {
    users = rawData.data.users
  }

  // Reset to first page when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, statusFilter, debouncedSearchTerm])

  const totalUsers = users.length
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedUsers = users.slice(startIndex, endIndex)

  const { data: statistics } = useQuery('user-statistics', () => userService.getStatistics())

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: 'active' | 'suspended' | 'inactive' }) =>
      userService.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('User status updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user status')
      },
    }
  )

  const updateUserMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<User> }) => userService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('User updated successfully')
        setShowEdit(false)
        setSelectedUser(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user')
      },
    }
  )

  const deleteUserMutation = useMutation(
    (id: number) => userService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('User deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete user')
      },
    }
  )

  const handleStatusChange = (user: User, status: 'active' | 'suspended' | 'inactive') => {
    // Replaced confirm() with an internal message/modal for compliance, 
    // though using a simple confirm here for mock logic
    if (confirm(`Are you sure you want to change status of ${user.username} to ${status}?`)) {
      updateStatusMutation.mutate({ id: user.user_id!, status })
    }
  }

  const handleViewDetails = async (user: User) => {
    // Setup modal animation state (start hidden)
    setShowDetails(false);
    setSelectedUser(null);
    
    try {
      const response = await userService.getById(user.user_id!)
      const userData = (response as any)?.data || response
      if (userData) {
        setSelectedUser(userData)
        // Set state to true to trigger the modal open (and animation)
        setShowDetails(true)
      }
    } catch (error: any) {
      toast.error('Failed to load user details')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800 border-green-300',
      suspended: 'bg-red-100 text-red-800 border-red-300',
      inactive: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800 border-purple-300',
      manager: 'bg-blue-100 text-blue-800 border-blue-300',
      seller: 'bg-teal-100 text-teal-800 border-teal-300',
      customer: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    }
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  if (isLoading) {
    return <div className="text-center py-12 text-blue-600 font-medium">Loading users...</div>
  }

  const statsRaw: any = statistics
  const statData = Array.isArray(statsRaw)
    ? statsRaw
    : Array.isArray(statsRaw?.data)
    ? statsRaw.data
    : [];

  const adminStat = statData.find((s: any) => s.user_type === 'admin')
  const managerStat = statData.find((s: any) => s.user_type === 'manager')
  const sellerStat = statData.find((s: any) => s.user_type === 'seller')
 

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management 👥</h1>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Admins" value={adminStat?.total} active={adminStat?.active} suspended={adminStat?.suspended} icon={Shield} colorClass='text-purple-600' bgColor='bg-purple-100' />
        <StatCard title="Managers" value={managerStat?.total} active={managerStat?.active} suspended={managerStat?.suspended} icon={UserCog} colorClass='text-blue-600' bgColor='bg-blue-100' />
        <StatCard title="Sellers" value={sellerStat?.total} active={sellerStat?.active} suspended={sellerStat?.suspended} icon={Users} colorClass='text-teal-600' bgColor='bg-teal-100' />
       
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by username, email, or phone (typing pause triggers search)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none bg-white w-full md:w-auto"
          >
            <option value="all">All Types</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="seller">Seller</option>
            <option value="customer">Customer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none bg-white w-full md:w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          {/* SCROLLING BEHAVIOR: Max height and vertical scroll for the table body */}
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* STICKY HEADER: Keeps header visible while scrolling */}
              <thead className="sticky top-0 bg-white shadow-sm z-10 border-b border-gray-200">
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Username</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Last Login</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers?.map((user: User) => (
                  <tr key={user.user_id} className="hover:bg-blue-50/50 transition-colors duration-200">
                    <td className="py-3 px-4 font-medium text-sm text-gray-900">{user.username}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeBadge(user.user_type)}`}>
                        {user.user_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.last_login
                        ? format(new Date(user.last_login), 'MMM dd, yyyy HH:mm')
                        : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.created_at
                        ? format(new Date(user.created_at), 'MMM dd, yyyy')
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 transition-all border border-transparent hover:border-blue-200"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="text-amber-600 hover:text-amber-800 p-1.5 rounded-full hover:bg-amber-100 transition-all border border-transparent hover:border-amber-200"
                          title="Edit User"
                        >
                          <Pencil size={18} />
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(user, 'suspended')}
                            className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100 transition-all border border-transparent hover:border-red-200"
                            title="Suspend User"
                          >
                            <UserX size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user, 'active')}
                            className="text-green-600 hover:text-green-800 p-1.5 rounded-full hover:bg-green-100 transition-all border border-transparent hover:border-green-200"
                            title="Activate User"
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-gray-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-all border border-transparent hover:border-red-200"
                          title="Delete User"
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
          {!users?.length && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}
          {users?.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3 border-t pt-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{totalUsers === 0 ? 0 : startIndex + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(endIndex, totalUsers)}</span> of{' '}
                <span className="font-semibold">{totalUsers}</span> users
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    currentPage === 1
                      ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1
                    const isActive = page === currentPage
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors border ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value) || 10)
                    setCurrentPage(1)
                  }}
                  className="ml-2 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal with Animation */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          {/* Modal content uses transform/scale for subtle pop-in effect */}
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100 opacity-100">
            <div className="flex justify-between items-center border-b pb-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedUser(null)
                }}
                className="text-gray-500 hover:text-gray-700 p-1 transition-colors rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedUser.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`block mt-1 px-3 py-1.5 rounded-full text-sm font-bold w-fit border ${getStatusBadge(selectedUser.status)}`}>
                    {selectedUser.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">User Type</label>
                  <span className={`block mt-1 px-3 py-1.5 rounded-full text-sm font-bold w-fit border ${getTypeBadge(selectedUser.user_type)}`}>
                    {selectedUser.user_type.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created At</label>
                  <p className="text-gray-900">
                    {selectedUser.created_at
                      ? format(new Date(selectedUser.created_at), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Login</label>
                  <p className="text-gray-900">
                    {selectedUser.last_login
                      ? format(new Date(selectedUser.last_login), 'MMM dd, yyyy HH:mm')
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEdit && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100 opacity-100">
            <div className="flex justify-between items-center border-b pb-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit User</h2>
              <button
                onClick={() => {
                  setShowEdit(false)
                  setSelectedUser(null)
                }}
                className="text-gray-500 hover:text-gray-700 p-1 transition-colors rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  value={editForm.phone_number}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(false)
                    setSelectedUser(null)
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow-sm flex items-center"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage