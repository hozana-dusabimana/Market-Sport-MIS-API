import api from './api'

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  phone_number: string
  user_type: 'admin' | 'manager' | 'seller'
  full_name: string
  id_number: string
  // Admin specific
  department?: string
  permissions?: any
  // Manager specific
  assigned_zones?: number[]
  employment_date?: string
  manager_id?: number
  // Seller specific
  business_name?: string
  business_type?: string
  tin_number?: string
  emergency_contact?: string
  address?: string
  registration_date?: string
}

export interface UserProfile {
  user_id: number
  username: string
  email: string
  phone_number?: string
  full_name?: string
  id_number?: string
  user_type: 'admin' | 'manager' | 'seller'
  department?: string
  assigned_zones?: number[]
  business_name?: string
  business_type?: string
  tin_number?: string
  emergency_contact?: string
  address?: string
  registration_date?: string
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      return response.data
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  },

  register: async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data)
      return response.data
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  },

  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get('/auth/profile')
      return response.data
    } catch (error) {
      console.error('Fetching profile failed:', error)
      throw error
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    try {
      const response = await api.put('/auth/profile', data)
      return response.data
    } catch (error) {
      console.error('Updating profile failed:', error)
      throw error
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      return response.data
    } catch (error) {
      console.error('Change password failed:', error)
      throw error
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      console.error('Forgot password request failed:', error)
      throw error
    }
  },

  resetPassword: async (resetToken: string, newPassword: string, confirmPassword?: string) => {
    try {
      const response = await api.post('/auth/reset-password', {
        resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword || newPassword,
      })
      return response.data
    } catch (error) {
      console.error('Reset password failed:', error)
      throw error
    }
  },
}
