import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  userId: number
  username: string
  email: string
  phone_number: string
  user_type: 'admin' | 'manager' | 'seller'
  profile?: any
  token: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        set({ user: null, isAuthenticated: false })
        localStorage.removeItem('auth-storage')
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
