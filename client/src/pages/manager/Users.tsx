import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { userService, User } from '../../services/userService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { sellerService } from '../../services/sellerService'
import { Search, Eye, Trash2, Edit3 } from 'lucide-react'
import { format } from 'date-fns'

const ManagerUsersPage = () => {
  const { user: currentUser } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  
  // Create user form schema - managers can only create sellers
  const createUserSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone_number: z.string().min(1, 'Phone number is required'),
    user_type: z.enum(['seller']),
    full_name: z.string().optional(),
    id_number: z.string().optional(),
    business_name: z.string().optional(),
    business_type: z.string().optional(),
    tin_number: z.string().optional(),
    emergency_contact: z.string().optional(),
    address: z.string().optional(),
    registration_date: z.string().optional(),
  })
  type CreateUserFormData = z.infer<typeof createUserSchema>

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  })

  const createUserMutation = useMutation(
    (data: CreateUserFormData) => userService.createUser(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('manager-users')
        toast.success('Seller created successfully')
        setShowCreate(false)
        resetCreateForm()
      },
      onError: (error: unknown) => {
        const message = 
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        toast.error(message || 'Failed to create seller')
      },
    }
  )

  const onCreateUser = (data: CreateUserFormData) => {
    createUserMutation.mutate(data)
  }

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['manager-users', searchTerm],
    async () => {
      const result = await userService.getAll({
        search: searchTerm || undefined,
      })
      
      // Normalize service response
      const allUsers = Array.isArray(result) ? result : result?.users || result?.data || []
      
      // Filter to show only sellers and the current manager
      const filtered = allUsers.filter((u: User) => 
        u.user_type === 'seller' || u.user_id === currentUser?.userId
      )
      
      return filtered
    }
  )

  // Normalize service response: service may return array or { users, pagination }
  const users = Array.isArray(data) ? data : []

  const handleViewDetails = async (user: User) => {
    try {
      const response = await userService.getById(user.user_id!)
      if (response.success) {
        setSelectedUser(response.data)
        setShowDetails(true)
      }
    } catch (error: unknown) {
      toast.error('Failed to load user details')
    }
  }

  // Seller-specific data when viewing details
  const sellerId = selectedUser?.user_id
  const start_date = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd')
  const end_date = format(new Date(), 'yyyy-MM-dd')

  const { data: allocations } = useQuery([
    'seller-allocations',
    sellerId,
  ], () => sellerService.getAllocations(sellerId!), {
    enabled: !!sellerId && selectedUser?.user_type === 'seller' && showDetails,
  })

  const { data: payments } = useQuery([
    'seller-payments',
    sellerId,
  ], () => sellerService.getPayments(sellerId!, { start_date, end_date }), {
    enabled: !!sellerId && selectedUser?.user_type === 'seller' && showDetails,
  })

  const { data: sellerStats } = useQuery([
    'seller-statistics',
    sellerId,
  ], () => sellerService.getStatistics(sellerId!), {
    enabled: !!sellerId && selectedUser?.user_type === 'seller' && showDetails,
  })

  // Edit user form schema
  const editUserSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email'),
    phone_number: z.string().min(1, 'Phone number is required'),
  })
  type EditUserFormData = z.infer<typeof editUserSchema>

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEditForm } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  })

  // Edit user modal state
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    if (selectedUser) {
      resetEditForm({
        username: selectedUser.username,
        email: selectedUser.email,
        phone_number: selectedUser.phone_number,
      })
    }
  }, [selectedUser, resetEditForm])

  const editUserMutation = useMutation(
    ({ id, data }: { id: number; data: EditUserFormData }) =>
      userService.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('manager-users')
        toast.success('Seller updated successfully')
        setShowEdit(false)
        setShowDetails(false)
      },
      onError: (error: unknown) => {
        const message = 
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        toast.error(message || 'Failed to update seller')
      },
    }
  )

  const deleteUserMutation = useMutation((id: number) => userService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('manager-users')
      toast.success('Seller deleted successfully')
    },
    onError: (error: unknown) => {
      const message = 
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message || 'Failed to delete seller')
    },
  })

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.user_id!)
    }
  }

  const onEditUser = (formData: EditUserFormData) => {
    if (!selectedUser) return
    editUserMutation.mutate({ id: selectedUser.user_id!, data: formData })
  }



  if (isLoading) {
    return <div className="text-center py-12">Loading users...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-00">Seller Management</h1>
      </div>
      
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create Seller</h2>
              <button
                onClick={() => {
                  setShowCreate(false)
                  resetCreateForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit(onCreateUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Username *</label>
                  <input type="text" {...registerCreate('username')} className="input" />
                  {createErrors.username && <p className="text-xs text-red-600">{createErrors.username.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email *</label>
                  <input type="email" {...registerCreate('email')} className="input" />
                  {createErrors.email && <p className="text-xs text-red-600">{createErrors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Password *</label>
                  <input type="password" {...registerCreate('password')} className="input" />
                  {createErrors.password && <p className="text-xs text-red-600">{createErrors.password.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number *</label>
                  <input type="text" {...registerCreate('phone_number')} className="input" />
                  {createErrors.phone_number && <p className="text-xs text-red-600">{createErrors.phone_number.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Name</label>
                  <input type="text" {...registerCreate('business_name')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Type</label>
                  <input type="text" {...registerCreate('business_type')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">TIN Number</label>
                  <input type="text" {...registerCreate('tin_number')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                  <input type="text" {...registerCreate('emergency_contact')} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <input type="text" {...registerCreate('address')} className="input" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full mt-4" disabled={createUserMutation.isLoading}>
                {createUserMutation.isLoading ? 'Creating...' : 'Create Seller'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEdit && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Seller</h2>
              <button
                onClick={() => {
                  setShowEdit(false)
                  setSelectedUser(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit(onEditUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <input type="text" {...registerEdit('username')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <input type="email" {...registerEdit('email')} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <input type="text" {...registerEdit('phone_number')} className="input" />
                </div>
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => { setShowEdit(false); setSelectedUser(null); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editUserMutation.isLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
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
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: User) => (
                <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{user.username}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.phone_number || 'N/A'}</td>
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
                      {user.user_id !== currentUser?.userId && (
                        <>
                          <button
                            onClick={() => { setSelectedUser(user); setShowEdit(true); setShowDetails(false); }}
                            className="text-indigo-600 hover:text-indigo-700"
                            title="Edit Seller"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Seller"
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
          {!users.length && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}
        </div>
      </div>

      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Seller Details</h2>
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

export default ManagerUsersPage
