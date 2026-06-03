import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import { AuthProvider } from "@/lib/auth-context"
import AuthGuard from "@/components/auth-guard"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kasturi Eye Hospitals – Management System",
  description: "Admin web application for managing patients, prescriptions, orders, and billing",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <AuthProvider>
          <AuthGuard>
            <Header />
            <main className="min-h-[calc(100vh-64px)] pb-4 md:pb-0">{children}</main>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
