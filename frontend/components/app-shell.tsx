"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Header from "@/components/header"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === "/login"
  // Extra settling flag — prevents flash while delete+signOut is in progress
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (loading) { setSettled(false); return }
    if (!user && !isLoginPage) {
      router.replace("/login")
      // Keep showing spinner until navigation completes
      return
    }
    setSettled(true)
  }, [user, loading, isLoginPage, router])

  // Login page — always render immediately, no auth needed
  if (isLoginPage) return <>{children}</>

  // Show spinner while auth is resolving or navigation is in flight
  if (loading || !settled || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Authenticated — show full app
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] pb-4 md:pb-0">{children}</main>
    </>
  )
}
