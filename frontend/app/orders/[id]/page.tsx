import { apiClient } from "@/lib/api"
import Link from "next/link"
import OrderDetailClient from "./order-detail-client"

export const dynamic = "force-dynamic"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let order: any = null
  try {
    const res = await apiClient.getOrderById(id)
    if (res.success && res.data) order = res.data
  } catch (e) {
    console.error(e)
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">Order not found.</p>
        <Link href="/orders" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Orders
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 text-sm font-medium">
          #{order._id.slice(-6).toUpperCase()}
        </span>
      </div>
      <OrderDetailClient order={order} />
    </div>
  )
}
