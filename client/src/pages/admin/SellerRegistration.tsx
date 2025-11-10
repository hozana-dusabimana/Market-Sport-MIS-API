import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService, RegisterData } from '../../services/authService'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

const sellerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone_number: z.string().min(10, 'Invalid phone number'),
  full_name: z.string().min(2, 'Full name is required'),
  id_number: z.string().min(1, 'ID number is required'),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  tin_number: z.string().optional(),
  emergency_contact: z.string().optional(),
  address: z.string().optional(),
})

type SellerFormData = z.infer<typeof sellerSchema>

const SellerRegistration = () => {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
  })

  const onSubmit = async (data: SellerFormData) => {
    setIsLoading(true)
    try {
      const registerData: RegisterData = {
        ...data,
        user_type: 'seller',
        registration_date: new Date().toISOString().split('T')[0],
      }
      const response = await authService.register(registerData)
      if (response.success) {
        toast.success('Seller registered successfully!')
        reset()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Seller Registration</h1>
      </div>

      <div className="card max-w-3xl">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
            <UserPlus className="w-6 h-6 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Register New Seller</h2>
          <p className="text-gray-600 mt-1">Fill in the seller's information to create their account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                {...register('full_name')}
                className="input"
                placeholder="Enter full name"
                required
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="label">ID Number *</label>
              <input
                type="text"
                {...register('id_number')}
                className="input"
                placeholder="Enter ID number"
                required
              />
              {errors.id_number && (
                <p className="mt-1 text-sm text-red-600">{errors.id_number.message}</p>
              )}
            </div>

            <div>
              <label className="label">Username *</label>
              <input
                type="text"
                {...register('username')}
                className="input"
                placeholder="Choose a username"
                required
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                {...register('email')}
                className="input"
                placeholder="Enter email address"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Phone Number *</label>
              <input
                type="tel"
                {...register('phone_number')}
                className="input"
                placeholder="Enter phone number"
                required
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
              )}
            </div>

            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                {...register('password')}
                className="input"
                placeholder="Create a password"
                required
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="label">Business Name</label>
              <input
                type="text"
                {...register('business_name')}
                className="input"
                placeholder="Enter business name"
              />
            </div>

            <div>
              <label className="label">Business Type</label>
              <input
                type="text"
                {...register('business_type')}
                className="input"
                placeholder="e.g., Retail, Food, etc."
              />
            </div>

            <div>
              <label className="label">TIN Number</label>
              <input
                type="text"
                {...register('tin_number')}
                className="input"
                placeholder="Enter TIN number"
              />
            </div>

            <div>
              <label className="label">Emergency Contact</label>
              <input
                type="tel"
                {...register('emergency_contact')}
                className="input"
                placeholder="Enter emergency contact"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Address</label>
              <textarea
                {...register('address')}
                className="input"
                rows={3}
                placeholder="Enter address"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" disabled={isLoading} className="btn btn-primary">
              {isLoading ? 'Registering...' : 'Register Seller'}
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="btn btn-secondary"
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SellerRegistration


