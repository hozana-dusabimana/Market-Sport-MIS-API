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
  // Seller specific
  business_name?: string
  business_type?: string
  tin_number?: string
  emergency_contact?: string
  address?: string
  registration_date?: string
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile', data)
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (resetToken: string, newPassword: string, confirmPassword?: string) => {
    const response = await api.post('/auth/reset-password', {
      resetToken,
      new_password: newPassword,
      confirm_password: confirmPassword || newPassword,
    })
    return response.data
  },
}


