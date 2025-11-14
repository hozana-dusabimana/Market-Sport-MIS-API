import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
// Mock imports for independent execution
 import { authService, RegisterData } from '../../services/authService'
import toast from 'react-hot-toast'
import { UserPlus, Loader2 } from 'lucide-react'

// --- Mock Services and Types (For runnable demonstration) ---
interface RegisterData {
    username: string;
    email: string;
    password?: string;
    phone_number: string;
    full_name: string;
    id_number: string;
    user_type: 'seller';
    registration_date: string;
    business_name?: string;
    business_type?: string;
    tin_number?: string;
    emergency_contact?: string;
    address?: string;
}



// -----------------------------------------------------------

const sellerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone_number: z.string().min(10, 'Invalid phone number (10+ digits)').max(15, 'Phone number too long'),
  full_name: z.string().min(2, 'Full name is required'),
  id_number: z.string().min(1, 'ID number is required'),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  tin_number: z.string().optional(),
  emergency_contact: z.string().optional(),
  address: z.string().optional(),
})

type SellerFormData = z.infer<typeof sellerSchema>

// Helper component for cleaner input rendering
const FormField = ({ id, label, register, error, type = 'text', placeholder, children, required = false }: any) => (
    <div className="flex flex-col space-y-1">
        <label htmlFor={id} className="text-sm font-semibold text-gray-700 flex items-center">
            {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {type === 'textarea' ? (
            <textarea
                id={id}
                {...register(id)}
                placeholder={placeholder}
                rows={3}
                className={`w-full p-3 border rounded-lg focus:ring-2 transition duration-150 ease-in-out ${
                    error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                }`}
            />
        ) : (
            <input
                id={id}
                type={type}
                {...register(id)}
                placeholder={placeholder}
                className={`w-full p-3 border rounded-lg focus:ring-2 transition duration-150 ease-in-out ${
                    error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                }`}
            />
        )}
        {error && (
            <p className="mt-1 text-xs text-red-600 font-medium flex items-center">
                {error.message}
            </p>
        )}
        {children}
    </div>
);


const SellerRegistration = () => {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
        username: '',
        email: '',
        password: '',
        phone_number: '',
        full_name: '',
        id_number: '',
    }
  })

  const onSubmit = async (data: SellerFormData) => {
    setIsLoading(true)
    try {
      // Ensure business fields are included even if undefined
      const registerData: RegisterData = {
        ...data,
        user_type: 'seller',
        registration_date: new Date().toISOString().split('T')[0],
      }
      
      // Removed password from the data if it was set as optional, but Zod schema requires it.
      // We keep 'password' as RegisterData type implies it's required for registration.

      const response = await authService.register(registerData)
      if (response.success) {
        toast.success(`Seller "${data.full_name}" registered successfully!`)
        reset()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please check the details and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Seller Registration</h1>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl max-w-4xl mx-auto border border-gray-100">
        <div className="mb-8 border-b pb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-full mb-3 shadow-md">
            <UserPlus className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Create New Seller Account</h2>
          <p className="text-gray-500 mt-1">Please provide accurate personal and business details for verification.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Personal Credentials */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 flex items-center">
                Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                id="full_name" 
                label="Full Name" 
                register={register} 
                error={errors.full_name} 
                placeholder="John Doe" 
                required
              />

              <FormField 
                id="id_number" 
                label="National ID/Passport Number" 
                register={register} 
                error={errors.id_number} 
                placeholder="e.g., 123456789X" 
                required
              />

              <FormField 
                id="username" 
                label="Username" 
                register={register} 
                error={errors.username} 
                placeholder="unique_seller_name" 
                required
              />

              <FormField 
                id="email" 
                label="Email Address" 
                register={register} 
                error={errors.email} 
                type="email"
                placeholder="contact@business.com" 
                required
              />
              
              <FormField 
                id="phone_number" 
                label="Phone Number" 
                register={register} 
                error={errors.phone_number} 
                type="tel"
                placeholder="e.g., +123 456 7890" 
                required
              />

              <FormField 
                id="password" 
                label="Password" 
                register={register} 
                error={errors.password} 
                type="password"
                placeholder="Must be at least 6 characters" 
                required
              />
            </div>
          </div>
          
          {/* Section 2: Business Details (Optional) */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 flex items-center">
                Business Details <span className="text-sm font-normal text-gray-400 ml-3">(Optional)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <FormField 
                id="business_name" 
                label="Business Name" 
                register={register} 
                error={errors.business_name} 
                placeholder="The Best Shop LLC"
              />

              <FormField 
                id="business_type" 
                label="Business Type" 
                register={register} 
                error={errors.business_type} 
                placeholder="Retail, Service, Manufacturing, etc."
              />

              <FormField 
                id="tin_number" 
                label="Tax Identification Number (TIN)" 
                register={register} 
                error={errors.tin_number} 
                placeholder="Enter TIN"
              />

              <FormField 
                id="emergency_contact" 
                label="Emergency Contact Phone" 
                register={register} 
                error={errors.emergency_contact} 
                type="tel"
                placeholder="Contact person's phone number"
              />

              <div className="md:col-span-2">
                <FormField 
                  id="address" 
                  label="Business Address" 
                  register={register} 
                  error={errors.address} 
                  type="textarea"
                  placeholder="Street Address, City, State/Province"
                />
              </div>

            </div>
          </div>


          <div className="flex space-x-4 pt-6 justify-end border-t mt-8">
            <button
              type="button"
              onClick={() => reset()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Clear Form
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className={`px-6 py-3 flex items-center justify-center rounded-lg font-bold text-white transition-all duration-300 shadow-lg 
                ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/50'}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Seller Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SellerRegistration