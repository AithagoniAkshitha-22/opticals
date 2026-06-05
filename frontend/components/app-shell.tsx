"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Header from "@/components/header"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === "/login"

  useEffect(() => {
    if (!loading && !isLoggedIn && !isLoginPage) {
      router.replace("/login")
    }
  }, [isLoggedIn, loading, isLoginPage, router])

  // Login page — no header
  if (isLoginPage) return <>{children}</>

  // Checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!isLoggedIn) return null

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] pb-4 md:pb-0">{children}</main>
    </>
  )
}
