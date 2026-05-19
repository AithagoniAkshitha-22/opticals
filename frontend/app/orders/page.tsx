import Link from "next/link"
import { apiClient } from "@/lib/api"
import OrdersClient from "./orders-client"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  let initialData: any = { orders: [], total: 0, page: 1, totalPages: 1 }
  try {
    const res = await apiClient.getOrders({ limit: 10 })
    if (res.success && res.data) initialData = res.data
  } catch (e) {
    console.error(e)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all orders</p>
        </div>
        <Link
          href="/orders/new"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Order
        </Link>
      </div>
      <OrdersClient initialData={initialData} />
    </div>
  )
}
