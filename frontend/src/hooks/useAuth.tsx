import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authApi, type User } from '../lib/api'

interface AuthState {
  user:      User | null
  loading:   boolean
  isInCouple: boolean
}

interface AuthActions {
  login:        (email: string, password: string) => Promise<void>
  register:     (email: string, name: string, password: string) => Promise<void>
  logout:       () => Promise<void>
  createCouple: () => Promise<string> 
  joinCouple:   (code: string) => Promise<void>
  refreshUser:  () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<{ name: string; email: string; avatarUrl: string; password: string }>) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  updatePreferences: (data: Partial<{ theme: string; language: string; notifications: boolean }>) => Promise<void>
}

type AuthContext = AuthState & AuthActions

const AuthCtx = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await authApi.me()
      setUser(user)
    } catch {
      setUser(null)
      localStorage.removeItem('session_token')
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('session_token')
    if (token) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const { user, token } = await authApi.login({ email, password })
    localStorage.setItem('session_token', token)
    setUser(user)
  }

  const register = async (email: string, name: string, password: string) => {
    const { user, token } = await authApi.register({ email, name, password })
    localStorage.setItem('session_token', token)
    setUser(user)
  }

  const logout = async () => {
    await authApi.logout().catch(() => {})
    localStorage.removeItem('session_token')
    setUser(null)
  }

  const createCouple = async (): Promise<string> => {
    const { couple } = await authApi.createCouple()
    await refreshUser()
    return couple.inviteCode!
  }

  const joinCouple = async (code: string) => {
    await authApi.joinCouple(code)
    await refreshUser()
  }

  const forgotPassword = async (email: string) => {
    await authApi.forgotPassword(email)
  }

  const updateProfile = async (data: Partial<{ name: string; email: string; avatarUrl: string; password: string }>) => {
    const { data: { user: updatedUser } } = await authApi.updateProfile(data)
    setUser(updatedUser)
  }

  const deleteAccount = async (password: string) => {
    await authApi.deleteAccount(password)
    localStorage.removeItem('session_token')
    setUser(null)
  }

  const updatePreferences = async (data: Partial<{ theme: string; language: string; notifications: boolean }>) => {
    const { data: { user: updatedUser } } = await authApi.updatePreferences(data)
    setUser(updatedUser)
  }

  return (
    <AuthCtx.Provider value={{
      user,
      loading,
      isInCouple: !!user?.coupleId,
      login,
      register,
      logout,
      createCouple,
      joinCouple,
      refreshUser,
      forgotPassword,
      updateProfile,
      deleteAccount,
      updatePreferences,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
