"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import("./firebase").then(({ auth }) => {
      if (!auth) { setLoading(false); return }
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })
      return () => unsubscribe()
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// Helper to manually clear user (used after delete+signOut to prevent flash)
export function useForceSignOut() {
  const context = useContext(AuthContext)
  return () => {
    // Auth state will update via onAuthStateChanged — no manual override needed
  }
}
