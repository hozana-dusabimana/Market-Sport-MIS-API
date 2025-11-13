import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { sellerService } from '../../services/sellerService'
import { authService, RegisterData } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { UserPlus, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

const sellerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone_number: z.string().min(6, 'Invalid phone number'),
  full_name: z.string().min(2, 'Full name is required'),
  id_number: z.string().min(1, 'ID number is required'),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  tin_number: z.string().optional(),
  emergency_contact: z.string().optional(),
  address: z.string().optional(),
})

type SellerFormData = z.infer<typeof sellerSchema>

const ManagerSeller = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isManager = user?.user_type === 'manager'
  const managerId = (user as any)?.profile?.manager_id || (user as any)?.manager_id || (user as any)?.id || null

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: sellersData, isLoading } = useQuery(
    ['sellers', managerId, search, status],
    () => sellerService.getAll({ manager_id: managerId || undefined, search: search || undefined, verification_status: status || undefined, limit: 100 }),
    { enabled: !!isManager, keepPreviousData: true }
  )

  const sellers = (sellersData?.data?.sellers || sellersData?.data || []).filter((s: any) => {
    const createdBy = Number(s.created_by_manager_id)
    const mid = managerId != null ? Number(managerId) : null
    if (mid == null) return true
    return createdBy === mid || Number(s.manager_id) === mid
  })

  const verifyMutation = useMutation(
    async (id: number) => sellerService.updateVerificationStatus(id, 'verified'),
    {
      onSuccess: () => { queryClient.invalidateQueries('sellers'); toast.success('Seller verified') },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to verify seller'),
    }
  )

  const rejectMutation = useMutation(
    async (id: number) => sellerService.updateVerificationStatus(id, 'rejected'),
    {
      onSuccess: () => { queryClient.invalidateQueries('sellers'); toast.success('Seller rejected') },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to reject seller'),
    }
  )

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SellerFormData>({ resolver: zodResolver(sellerSchema) })

  const onCreate = async (data: SellerFormData) => {
    try {
      const payload: RegisterData = {
        ...data,
        user_type: 'seller',
        registration_date: new Date().toISOString().split('T')[0],
        manager_id: managerId || undefined,
      }
      const res = await authService.register(payload)
      if (res?.success) {
        toast.success('Seller created')
        setShowCreate(false)
        reset()
        queryClient.invalidateQueries('sellers')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create seller')
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Sellers</h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center border rounded-lg px-2">
            <Search size={16} className="text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input border-0 focus:ring-0"
              placeholder="Search sellers..."
            />
          </div>
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn btn-primary flex items-center" onClick={() => setShowCreate(true)}>
            <UserPlus size={18} className="mr-2" /> New Seller
          </button>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Business</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s: any) => (
                  <tr key={s.seller_id || s.user_id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4">{s.full_name || s.username || 'N/A'}</td>
                    <td className="py-2 pr-4">{s.business_name || '—'}</td>
                    <td className="py-2 pr-4">{s.phone_number || s.user?.phone_number || '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.verification_status === 'verified' || s.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : s.verification_status === 'rejected' || s.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {s.verification_status || s.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 space-x-2">
                      <button
                        className="btn btn-xs btn-primary inline-flex items-center"
                        onClick={() => verifyMutation.mutate(s.seller_id)}
                        disabled={verifyMutation.isLoading}
                      >
                        {verifyMutation.isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 size={14} className="mr-1" />} Verify
                      </button>
                      <button
                        className="btn btn-xs btn-secondary inline-flex items-center"
                        onClick={() => rejectMutation.mutate(s.seller_id)}
                        disabled={rejectMutation.isLoading}
                      >
                        {rejectMutation.isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <XCircle size={14} className="mr-1" />} Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create Seller</h2>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Close</button>
            </div>
            <form onSubmit={handleSubmit(onCreate)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Full Name</label>
                <input className="input" {...register('full_name')} />
                {errors.full_name && <p className="text-red-600 text-xs mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="label">ID Number</label>
                <input className="input" {...register('id_number')} />
                {errors.id_number && <p className="text-red-600 text-xs mt-1">{errors.id_number.message}</p>}
              </div>
              <div>
                <label className="label">Username</label>
                <input className="input" {...register('username')} />
                {errors.username && <p className="text-red-600 text-xs mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" {...register('email')} />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" {...register('phone_number')} />
                {errors.phone_number && <p className="text-red-600 text-xs mt-1">{errors.phone_number.message}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" {...register('password')} />
                {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Business Name</label>
                <input className="input" {...register('business_name')} />
              </div>
              <div>
                <label className="label">Business Type</label>
                <input className="input" {...register('business_type')} />
              </div>
              <div>
                <label className="label">TIN</label>
                <input className="input" {...register('tin_number')} />
              </div>
              <div>
                <label className="label">Emergency Contact</label>
                <input className="input" {...register('emergency_contact')} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea className="input" rows={3} {...register('address')} />
              </div>
              <div className="md:col-span-2 flex items-center justify-end space-x-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => reset()}>Clear</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (<span className="inline-flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</span>) : 'Create Seller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerSeller
