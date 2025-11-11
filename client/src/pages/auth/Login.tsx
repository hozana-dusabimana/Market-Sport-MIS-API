import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Store } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

const Login = () => {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      if (response.success) {
        setUser(response.data)
        toast.success('Login successful!')
        navigate('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50 p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex">
        {/* Left Promotional Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 to-teal-600 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-700 rounded-full opacity-20 -mr-32 -mb-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-700 rounded-full opacity-10 -mr-48 -mb-48"></div>
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <div className="mb-8">
              <Store className="w-16 h-16 mb-4" />
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Let's Grow Up Your Business
              <br />
              With Market SpotOn
            </h1>
            <p className="text-lg text-teal-100 leading-relaxed">
              Streamline your market operations, manage spaces efficiently, and grow your business with our comprehensive digital market management platform.
            </p>
          </div>
        </div>

        {/* Right Login Form Panel */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Logo and Brand */}
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-teal-600">MARKET SPOTON</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Sign in to your account</h2>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email *
                </label>
                <input
                  type="text"
                  {...register('username')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your username or email"
                  required
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <Link
                    to="#"
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                  Keep me logged in
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-teal-600 hover:text-teal-700 font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Market SpotOn System. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
