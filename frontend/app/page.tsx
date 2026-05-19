import Link from "next/link"
import { apiClient } from "@/lib/api"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let stats = {
    todayPatients: 0,
    activeOrders: 0,
    processingOrders: 0,
    readyForPickup: 0,
    delayedOrders: 0,
    deliveredOrders: 0,
  }

  try {
    const res = await apiClient.getDashboardStats()
    if (res.success && res.data) stats = res.data
  } catch (e) {
    console.error("Dashboard fetch error:", e)
  }

  const cards = [
    { label: "Today's Patients", value: stats.todayPatients, color: "blue", href: "/patients?filter=today", icon: "👤" },
    { label: "Active Orders", value: stats.activeOrders, color: "indigo", href: "/orders?status=active", icon: "📦" },
    { label: "Processing", value: stats.processingOrders, color: "yellow", href: "/orders?status=Processing", icon: "⚙️" },
    { label: "Ready for Pickup", value: stats.readyForPickup, color: "green", href: "/orders?status=Ready+for+Pickup", icon: "✅" },
    { label: "Delayed Orders", value: stats.delayedOrders, color: "red", href: "/orders?status=Delayed", icon: "⚠️" },
    { label: "Delivered", value: stats.deliveredOrders, color: "gray", href: "/orders?status=Delivered", icon: "🎉" },
  ]

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to Kasturi Eye Hospitals Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`border rounded-xl p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow ${colorMap[card.color]}`}
          >
            <span className="text-2xl mb-1">{card.icon}</span>
            <span className="text-3xl font-bold">{card.value}</span>
            <span className="text-xs font-medium mt-1 leading-tight">{card.label}</span>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link
          href="/patients/new"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors shadow"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">👤</div>
          <div>
            <p className="font-bold text-lg">Add New Patient</p>
            <p className="text-blue-100 text-sm">Register a new patient visit</p>
          </div>
        </Link>

        <Link
          href="/orders/new"
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors shadow"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">📋</div>
          <div>
            <p className="font-bold text-lg">Create Order</p>
            <p className="text-green-100 text-sm">Frames, lenses, or drops</p>
          </div>
        </Link>

        <Link
          href="/reports"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors shadow"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">📊</div>
          <div>
            <p className="font-bold text-lg">View Reports</p>
            <p className="text-purple-100 text-sm">Monthly stats & analytics</p>
          </div>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h2>
          <div className="space-y-3">
            {[
              { href: "/patients", label: "All Patients", desc: "Search and manage patient records" },
              { href: "/orders", label: "All Orders", desc: "Track and update order status" },
              { href: "/brands", label: "Brands Management", desc: "Manage frame and lens brands" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Info</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>No delete option — all data is permanent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Audit logs track all edits automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Orders auto-advance after 2 days</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>Delayed flag set after 3+ days at pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>WhatsApp notifications with tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
