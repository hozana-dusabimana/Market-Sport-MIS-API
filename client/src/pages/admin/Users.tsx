import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { userService, User } from '../../services/userService'
import toast from 'react-hot-toast'
import { Search, UserCheck, UserX, Eye, Users, Shield, UserCog } from 'lucide-react'
import { format } from 'date-fns'

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['users', typeFilter, statusFilter, searchTerm],
    () =>
      userService.getAll({
        user_type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      })
  )

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

  const handleStatusChange = (user: User, status: 'active' | 'suspended' | 'inactive') => {
    if (confirm(`Are you sure you want to ${status} this user?`)) {
      updateStatusMutation.mutate({ id: user.user_id!, status })
    }
  }

  const handleViewDetails = async (user: User) => {
    try {
      const response = await userService.getById(user.user_id!)
      if (response.success) {
        setSelectedUser(response.data)
        setShowDetails(true)
      }
    } catch (error: any) {
      toast.error('Failed to load user details')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadge = (type: string) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      seller: 'bg-green-100 text-green-800',
    }
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading users...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      </div>

      {statistics?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statistics.data.map((stat: any) => (
            <div key={stat.user_type} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{stat.user_type}s</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.total || 0}</p>
                  <div className="flex space-x-2 mt-2 text-xs">
                    <span className="text-green-600">Active: {stat.active || 0}</span>
                    <span className="text-red-600">Suspended: {stat.suspended || 0}</span>
                  </div>
                </div>
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by username, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Types</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="seller">Seller</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((user: User) => (
                <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{user.username}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadge(user.user_type)}`}>
                      {user.user_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.last_login
                      ? format(new Date(user.last_login), 'MMM dd, yyyy HH:mm')
                      : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    {user.created_at
                      ? format(new Date(user.created_at), 'MMM dd, yyyy')
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="text-primary-600 hover:text-primary-700"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(user, 'suspended')}
                          className="text-red-600 hover:text-red-700"
                          title="Suspend User"
                        >
                          <UserX size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user, 'active')}
                          className="text-green-600 hover:text-green-700"
                          title="Activate User"
                        >
                          <UserCheck size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.data?.length && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}
        </div>
      </div>

      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">User Details</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedUser(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <p className="text-gray-900">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="text-gray-900">{selectedUser.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User Type</label>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadge(selectedUser.user_type)}`}>
                    {selectedUser.user_type}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(selectedUser.status)}`}>
                    {selectedUser.status}
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
    </div>
  )
}

export default UsersPage

