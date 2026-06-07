import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, UserContextType, RegisterData } from '../types'

const UserContext = createContext<UserContextType | undefined>(undefined)

const JWT_KEY = 'thewebsite_jwt'
const USER_KEY = 'thewebsite_user'

// Helper to get the JWT from localStorage
function getToken(): string | null {
  return localStorage.getItem(JWT_KEY)
}

// Helper to set the JWT in localStorage
function setToken(token: string): void {
  localStorage.setItem(JWT_KEY, token)
}

// Helper to clear the JWT from localStorage
function clearToken(): void {
  localStorage.removeItem(JWT_KEY)
}

// Helper to get the user object from localStorage
function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) as User : null
  } catch {
    return null
  }
}

// Helper to set the user object in localStorage
function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// Helper to clear the user object from localStorage
function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY)
}

// Authenticated fetch wrapper that adds the Authorization header
// and handles 401 responses by clearing auth state and redirecting to login
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearToken()
    clearStoredUser()
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  return res
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // On mount, check localStorage for existing session
  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      setCurrentUser(stored)
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Login failed')
    }
    const { token, user } = await res.json() as { token: string; user: User }
    setToken(token)
    setStoredUser(user)
    setCurrentUser(user)
    return user
  }, [])

  const register = useCallback(async (data: RegisterData): Promise<User> => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Registration failed')
    }
    const { token, user } = await res.json() as { token: string; user: User }
    setToken(token)
    setStoredUser(user)
    setCurrentUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    clearToken()
    clearStoredUser()
    setCurrentUser(null)
  }, [])

  const saveProfile = useCallback(
    async (updates: Partial<User>): Promise<void> => {
      if (!currentUser) return
      const res = await authFetch(`/api/users/${currentUser.username}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      if (!res.ok) return
      const updated = await res.json() as User
      setCurrentUser(updated)
      setStoredUser(updated)
    },
    [currentUser]
  )

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      if (!currentUser) throw new Error('Not logged in')
      const res = await authFetch(`/api/users/${currentUser.username}/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to change password')
      }
    },
    [currentUser]
  )

  return (
    <UserContext.Provider value={{ currentUser, loading, login, register, logout, saveProfile, changePassword, authFetch }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextType {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}