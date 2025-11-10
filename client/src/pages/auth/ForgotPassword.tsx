import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import { Store, ArrowLeft } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.forgotPassword(data.email)
      if (response.success) {
        // Navigate to the reset form so user can enter their verification code or new password.
        // If server returned a resetToken (dev/testing), include it in state but do not display it.
        type ResetState = { email: string; resetRequested: true; resetToken?: string }
        const state: ResetState = { email: data.email, resetRequested: true }
        if (response.data?.resetToken) state.resetToken = response.data.resetToken
        navigate('/reset-password', { state })
        toast.success('Verification instructions have been sent to your email')
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to process request')
      } else {
        toast.error('Failed to process request')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
        {/* Logo and Brand */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
            <Store className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-teal-600">MARKET SPOTON</span>
        </div>

        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reset Your Password</h2>
          <p className="text-gray-600 mb-8">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter your email"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </form>
        </>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Market SpotOn System. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword