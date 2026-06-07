import Link from "next/link"
import { Suspense } from "react"
import OrdersClient from "./orders-client"

export default function OrdersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all orders</p>
        </div>
        <Link href="/orders/new"
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Order
        </Link>
      </div>
      <Suspense fallback={<div className="text-center py-16 text-gray-400">Loading...</div>}>
        <OrdersClient initialData={{ orders: [], total: 0, page: 1, totalPages: 1 }} />
      </Suspense>
    </div>
  )
}
