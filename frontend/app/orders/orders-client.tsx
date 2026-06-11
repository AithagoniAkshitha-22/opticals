"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { apiClient } from "@/lib/api"

const STATUS_COLORS: Record<string, string> = {
  Ordered: "bg-blue-100 text-blue-700",
  Processing: "bg-yellow-100 text-yellow-700",
  "Ready for Pickup": "bg-green-100 text-green-700",
  Delivered: "bg-gray-100 text-gray-700",
  Delayed: "bg-red-100 text-red-700",
}

const STATUSES = ["all", "Ordered", "Ready for Pickup", "Delivered"]

export default function OrdersClient({ initialData }: { initialData: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlStatus = searchParams.get("status") || "all"
  // "active" means all non-delivered
  const resolvedStatus = urlStatus === "active" ? "all" : urlStatus

  const [data, setData] = useState(initialData)
  const [status, setStatus] = useState(resolvedStatus)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrders = useCallback(async (s: string, q: string, pg: number, excludeDelivered = false) => {
    setLoading(true)
    try {
      const params: any = { search: q.trim(), page: pg, limit: 10 }
      if (excludeDelivered) {
        // Active = all except Delivered — fetch all and filter client-side isn't ideal
        // Use empty status but pass a special flag; backend handles it via "active"
        params.status = ""
        params.excludeDelivered = "true"
      } else if (s !== "all") {
        params.status = s
      }
      const res = await apiClient.getOrders(params)
      if (res.success && res.data) {
        let result = res.data
        // Client-side filter for active (exclude Delivered)
        if (excludeDelivered) {
          result = {
            ...result,
            orders: result.orders.filter((o: any) => o.status !== "Delivered"),
          }
          result.total = result.orders.length
        }
        setData(result)
        setPage(pg)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (urlStatus === "active") {
      fetchOrders("all", "", 1, true)
    } else {
      fetchOrders(resolvedStatus, "", 1)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const isActive = urlStatus === "active"
    debounceRef.current = setTimeout(() => fetchOrders(status, value, 1, isActive), 400)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    fetchOrders(value, search, 1)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("Delete this order? This cannot be undone.")) return
    setDeletingId(id)
    try {
      const res = await apiClient.deleteOrder(id)
      if (res.success) {
        setData((prev: any) => ({
          ...prev,
          orders: prev.orders.filter((o: any) => o._id !== id),
          total: prev.total - 1,
        }))
      }
    } catch (e) { console.error(e) }
    finally { setDeletingId(null) }
  }

  // Show actual filtered count
  const displayCount = data.orders?.length ?? 0
  const totalCount = data.total ?? 0
  const countLabel = search || status !== "all"
    ? `${displayCount} order${displayCount !== 1 ? "s" : ""} found`
    : `${totalCount} order${totalCount !== 1 ? "s" : ""}`

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          {loading ? (
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          )}
          <input
            type="text"
            placeholder="Search patient name or phone..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => handleSearchChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm text-gray-500">{countLabel}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading...</div>
        ) : data.orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">📦</span>
            <p className="font-medium">No orders found</p>
            <Link href="/orders/new" className="mt-3 text-blue-600 text-sm hover:underline">Create first order →</Link>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.orders.map((o: any) => {
                const patient = o.patientId as any
                const itemCount = (o.frames?.length || 0) + (o.lenses?.length || 0) + (o.drops?.length || 0)
                return (
                  <div
                    key={o._id}
                    onClick={() => router.push(`/orders/${o._id}`)}
                    className="flex items-center justify-between px-4 py-4 hover:bg-blue-50 cursor-pointer transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">#{o._id.slice(-6).toUpperCase()}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"}`}>
                          {o.isDelayed && o.status !== "Delivered" ? "⚠️ " : ""}{o.status}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm truncate">{patient?.name || "—"}</p>
                      <p className="text-xs text-gray-400">{patient?.phone} · {itemCount} item{itemCount !== 1 ? "s" : ""} · ₹{o.totalAmount}</p>
                      {(o.status === "Ready for Pickup" || o.status === "Delayed") && o.dueAmount > 0 && (
                        <p className="text-xs font-semibold text-orange-600 mt-0.5">Due: ₹{o.dueAmount}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, o._id)}
                      disabled={deletingId === o._id}
                      className="text-red-400 hover:text-red-600 disabled:opacity-40 p-2 rounded hover:bg-red-50 flex-shrink-0"
                    >
                      {deletingId === o._id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left">Order ID</th>
                    <th className="px-6 py-3 text-left">Patient</th>
                    <th className="px-6 py-3 text-left">Items</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.orders.map((o: any) => {
                    const patient = o.patientId as any
                    const itemCount = (o.frames?.length || 0) + (o.lenses?.length || 0) + (o.drops?.length || 0)
                    return (
                      <tr
                        key={o._id}
                        onClick={() => router.push(`/orders/${o._id}`)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-gray-600">#{o._id.slice(-6).toUpperCase()}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{patient?.name || "—"}</p>
                          <p className="text-xs text-gray-400">{patient?.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{itemCount} item{itemCount !== 1 ? "s" : ""}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          <div>₹{o.totalAmount}</div>
                          {(o.status === "Ready for Pickup" || o.status === "Delayed") && o.dueAmount > 0 && (
                            <div className="text-xs font-semibold text-orange-600">Due: ₹{o.dueAmount}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"}`}>
                            {o.isDelayed && o.status !== "Delivered" ? "⚠️ " : ""}{o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => handleDelete(e, o._id)}
                            disabled={deletingId === o._id}
                            className="text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors p-1 rounded hover:bg-red-50"
                            title="Delete order"
                          >
                            {deletingId === o._id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => fetchOrders(status, search, page - 1)} disabled={page <= 1} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => fetchOrders(status, search, page + 1)} disabled={page >= data.totalPages} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>            </div>
          </div>
        )}
      </div>
    </div>
  )
}
