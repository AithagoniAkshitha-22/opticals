"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Header from "@/components/header"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === "/login"

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/login")
    }
  }, [user, loading, isLoginPage, router])

  // Login page — render with no header, no guard
  if (isLoginPage) {
    return <>{children}</>
  }

  // Still checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in — show nothing while redirecting
  if (!user) return null

  // Logged in — show full app
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] pb-4 md:pb-0">{children}</main>
    </>
  )
}
