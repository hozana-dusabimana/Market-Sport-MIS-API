import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().user?.token
    const user = useAuthStore.getState().user
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Auto-attach manager_id on GET requests for managers
    if (user?.user_type === 'manager' && config.method === 'get') {
      const managerId = user.profile?.manager_id || user.userId
      if (managerId) {
        const params = (config.params && typeof config.params === 'object') ? { ...config.params } : {}
        // Do not override if caller explicitly set manager_id
        if (params.manager_id === undefined) {
          params.manager_id = managerId
        }
        config.params = params
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      console.warn('Unauthorized - Logging out')
      useAuthStore.getState().logout()
      window.location.href = '/login'
    } else if (status === 403) {
      // Silently reject; UI should simply not show forbidden data/actions
    } else if (status === 404) {
      console.warn('API endpoint not found:', error.config.url)
    }
    return Promise.reject(error)
  }
)

export default api
