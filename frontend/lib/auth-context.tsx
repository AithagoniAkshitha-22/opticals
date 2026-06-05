"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  isLoggedIn: boolean
  loading: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  loading: true,
  login: () => false,
  logout: () => {},
})

const STORAGE_KEY = "keh_auth"
const VALID_USERNAME = process.env.NEXT_PUBLIC_APP_USERNAME || "kasturi"
const VALID_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || "kasturi123"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setIsLoggedIn(stored === "true")
    setLoading(false)
  }, [])

  const login = (username: string, password: string): boolean => {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true")
      setIsLoggedIn(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
