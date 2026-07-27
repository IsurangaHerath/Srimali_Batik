import { create } from 'zustand'
import api from '@/lib/api'

interface Admin {
  id: string
  username: string
}

interface AuthState {
  token: string | null
  admin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('srimali-auth-token'),
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    const { token, admin } = res.data.data
    localStorage.setItem('srimali-auth-token', token)
    set({ token, admin, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('srimali-auth-token')
    set({ token: null, admin: null, isAuthenticated: false })
  },
  checkAuth: async () => {
    const token = localStorage.getItem('srimali-auth-token')
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }
    try {
      const res = await api.post('/auth/verify')
      set({ admin: res.data.data.admin, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('srimali-auth-token')
      set({ token: null, admin: null, isAuthenticated: false, isLoading: false })
    }
  },
}))