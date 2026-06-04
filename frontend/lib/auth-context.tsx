"use client"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { onAuthStateChanged, User } from "firebase/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  checking: boolean        // true while Google sign-in is being validated
  setChecking: (v: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  checking: false,
  setChecking: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const pendingUser = useRef<User | null>(null)

  useEffect(() => {
    import("./firebase").then(({ auth }) => {
      if (!auth) { setLoading(false); return }

      const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (checking) {
          // Store pending user but don't commit it yet
          pendingUser.current = u
          return
        }
        setUser(u)
        setLoading(false)
      })

      return () => unsubscribe()
    })
  }, [checking])

  const handleSetChecking = (v: boolean) => {
    setChecking(v)
    if (!v) {
      // Checking done — commit the pending auth state
      setUser(pendingUser.current)
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, checking, setChecking: handleSetChecking }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
