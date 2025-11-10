import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import { Store, ArrowLeft, Eye, EyeOff, Mail, Send } from 'lucide-react'

// Schema for email verification step
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// Schema for password reset step
const resetPasswordSchema = z
  .object({
    code: z.string().min(6, 'Verification code is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type EmailFormData = z.infer<typeof emailSchema>
type PasswordResetFormData = z.infer<typeof resetPasswordSchema>

const ResetPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [userEmail, setUserEmail] = useState('')
  const [codeReadOnly, setCodeReadOnly] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Email verification form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  // Password reset form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    setValue: setResetValue,
    formState: { errors: resetErrors },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  // If navigation or URL contains a resetToken (email link), pre-fill code and switch to reset step
  const location = useLocation()
  const [searchParams] = useSearchParams()
  useEffect(() => {
    type LocationState = { resetToken?: string; email?: string } | undefined
    const state = (location.state as LocationState) || undefined
    const tokenFromState = state?.resetToken
    const tokenFromQuery = searchParams.get('token') || undefined
    const incomingToken = tokenFromState ?? tokenFromQuery
    const incomingEmail = state?.email || searchParams.get('email') || undefined
    if (incomingToken) {
      setUserEmail(incomingEmail || '')
      setResetValue('code', incomingToken)
      setCodeReadOnly(true)
      setStep('reset')
    }
  }, [location, searchParams, setResetValue])

  const onEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.forgotPassword(data.email)
      if (response.success) {
        setUserEmail(data.email)
        setStep('reset')
        toast.success('Verification code has been sent to your email')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const onResetSubmit = async (data: PasswordResetFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.resetPassword(data.code, data.password, data.confirmPassword)
      if (response.success) {
        toast.success('Password has been reset successfully')
        navigate('/login')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
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

        {step === 'email' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reset Your Password</h2>
            <p className="text-gray-600 mb-8">
              Enter your email address and we'll send you a verification code to reset your
              password.
            </p>

            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    {...registerEmail('email')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                {emailErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{emailErrors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  'Sending...'
                ) : (
                  <>
                    <Send size={20} />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Password</h2>
            <p className="text-gray-600 mb-8">
              Enter the verification code sent to {userEmail} and create your new password.
            </p>

            <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code *
                </label>
                {codeReadOnly ? (
                  <div className="px-3 py-2 text-sm text-gray-600">A verification token was detected and will be used automatically.</div>
                ) : (
                  <>
                    <input
                      type="text"
                      {...registerReset('code')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter verification code"
                      required
                    />
                    {resetErrors.code && (
                      <p className="mt-1 text-sm text-red-600">{resetErrors.code.message}</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerReset('password')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all pr-12"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('password')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {resetErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{resetErrors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...registerReset('confirmPassword')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all pr-12"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {resetErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Market SpotOn System. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default ResetPassword