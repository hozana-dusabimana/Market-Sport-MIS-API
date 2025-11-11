import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import { User, Lock } from 'lucide-react'

const Profile = () => {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [isLoading, setIsLoading] = useState(false)

  const { register: registerProfile, handleSubmit: handleSubmitProfile } = useForm({
    defaultValues: {
      phone_number: user?.phone_number || '',
      full_name: user?.profile?.full_name || '',
      business_name: user?.profile?.business_name || '',
      address: user?.profile?.address || '',
    },
  })

  const { register: registerPassword, handleSubmit: handleSubmitPassword } = useForm({
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const onProfileSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const response = await authService.updateProfile(data)
      if (response.success) {
        toast.success('Profile updated successfully')
        const profileResponse = await authService.getProfile()
        if (profileResponse.success && user) {
          setUser({ ...user, ...profileResponse.data.data })
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: any) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      const response = await authService.changePassword(data.current_password, data.new_password)
      if (response.success) {
        toast.success('Password changed successfully')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      <div className="card">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="inline-block mr-2" size={18} />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Lock className="inline-block mr-2" size={18} />
              Change Password
            </button>
          </nav>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="input bg-gray-50"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input bg-gray-50"
                />
              </div>

              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  {...registerProfile('phone_number')}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  {...registerProfile('full_name')}
                  className="input"
                  required
                />
              </div>

              {user?.user_type === 'seller' && (
                <>
                  <div>
                    <label className="label">Business Name</label>
                    <input
                      type="text"
                      {...registerProfile('business_name')}
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Address</label>
                    <textarea
                      {...registerProfile('address')}
                      className="input"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6 max-w-md">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                {...registerPassword('current_password')}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                {...registerPassword('new_password')}
                className="input"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                {...registerPassword('confirm_password')}
                className="input"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Profile


