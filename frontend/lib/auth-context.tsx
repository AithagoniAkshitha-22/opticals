"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  setValidating: (v: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setValidating: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // While validating (e.g. checking isNewUser + deleting), freeze auth state
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    import("./firebase").then(({ auth }) => {
      if (!auth) { setLoading(false); return }

      const unsubscribe = onAuthStateChanged(auth, (u) => {
        // Don't update user state while we're in the middle of a validation check
        if (validating) return
        setUser(u)
        setLoading(false)
      })

      return () => unsubscribe()
    })
  }, [validating])

  return (
    <AuthContext.Provider value={{ user, loading, setValidating }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
