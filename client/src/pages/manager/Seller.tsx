import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { sellerService } from '../../services/sellerService'
import { authService, RegisterData } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { UserPlus, Check, X, Search, Loader } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const sellerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone_number: z.string().min(6),
  full_name: z.string().min(2),
  id_number: z.string().min(1),
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
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: sellersData, isLoading } = useQuery(
    ['sellers', managerId, search, status],
    () =>
      sellerService.getAll({
        manager_id: managerId || undefined,
        search: search || undefined,
        verification_status: status || undefined,
        limit: 100,
      }),
    { enabled: !!isManager }
  )

  const sellers = (sellersData?.data?.sellers || sellersData?.data || []).filter((s: any) => {
    const mid = managerId != null ? Number(managerId) : null
    return mid == null || Number(s.created_by_manager_id) === mid || Number(s.manager_id) === mid
  })

  const verifyMutation = useMutation(
    async (id: number) => sellerService.updateVerificationStatus(id, 'verified'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellers')
        toast.success('Seller verified')
      },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to verify seller'),
    }
  )

  const rejectMutation = useMutation(
    async (id: number) => sellerService.updateVerificationStatus(id, 'rejected'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellers')
        toast.success('Seller rejected')
      },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to reject seller'),
    }
  )

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
  })

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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Sellers</h1>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center bg-white rounded shadow px-3 py-1">
            <Search className="text-gray-400 mr-2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sellers..."
              className="outline-none px-2 py-1 w-full"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded shadow px-3 py-1">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center bg-blue-600 text-white px-4 py-1 rounded shadow hover:bg-blue-700 transition"
          >
            <UserPlus className="mr-2" /> New Seller
          </button>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        {isLoading ? (
          <div className="p-6 text-center text-gray-600">Loading sellers...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="py-3 px-4 font-medium text-gray-700">Business</th>
                <th className="py-3 px-4 font-medium text-gray-700">Phone</th>
                <th className="py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sellers.map((s: any) => (
                <tr key={s.seller_id || s.user_id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">{s.full_name || s.username}</td>
                  <td className="py-3 px-4">{s.business_name || '—'}</td>
                  <td className="py-3 px-4">{s.phone_number || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      s.verification_status === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : s.verification_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {s.verification_status || 'pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    <button
                      onClick={() => verifyMutation.mutate(s.seller_id)}
                      disabled={verifyMutation.isLoading}
                      className="flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                    >
                      {verifyMutation.isLoading ? <Loader className="animate-spin h-3 w-3 mr-1" /> : <Check className="mr-1 h-3 w-3" />} Verify
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(s.seller_id)}
                      disabled={rejectMutation.isLoading}
                      className="flex items-center px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                    >
                      {rejectMutation.isLoading ? <Loader className="animate-spin h-3 w-3 mr-1" /> : <X className="mr-1 h-3 w-3" />} Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Seller Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Create Seller</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700"><X /></button>
              </div>
              <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input {...register('full_name')} placeholder="Full Name" className="input w-full" />
                  <input {...register('id_number')} placeholder="ID Number" className="input w-full" />
                  <input {...register('phone_number')} placeholder="Phone" className="input w-full" />
                  <input {...register('email')} placeholder="Email" className="input w-full" />
                  <input {...register('username')} placeholder="Username" className="input w-full" />
                  <input {...register('password')} type="password" placeholder="Password" className="input w-full" />
                  <input {...register('business_name')} placeholder="Business Name" className="input w-full" />
                  <input {...register('business_type')} placeholder="Business Type" className="input w-full" />
                  <input {...register('tin_number')} placeholder="TIN Number" className="input w-full" />
                  <input {...register('emergency_contact')} placeholder="Emergency Contact" className="input w-full" />
                  <textarea {...register('address')} placeholder="Address" className="input w-full" rows={3}></textarea>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => reset()} className="btn btn-secondary">Clear</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Create Seller'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ManagerSeller
