"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { apiClient } from "@/lib/api"

const STATUS_COLORS: Record<string, string> = {
  Ordered: "bg-blue-100 text-blue-700",
  Processing: "bg-yellow-100 text-yellow-700",
  "Ready for Pickup": "bg-green-100 text-green-700",
  Delivered: "bg-gray-100 text-gray-700",
  Delayed: "bg-red-100 text-red-700",
}

const STATUSES = ["all", "Ordered", "Processing", "Ready for Pickup", "Delivered", "Delayed"]

export default function OrdersClient({ initialData }: { initialData: any }) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async (s = status, q = search, pg = 1) => {
    setLoading(true)
    try {
      const res = await apiClient.getOrders({ status: s === "all" ? "" : s, search: q, page: pg, limit: 10 })
      if (res.success && res.data) { setData(res.data); setPage(pg) }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [status, search])

  // Auto-fetch on mount
  useEffect(() => { fetchOrders("all", "", 1) }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("Hide this order? It won't appear in the list but data is preserved.")) return
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

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search patient name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchOrders(status, search, 1)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); fetchOrders(e.target.value, search, 1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
        </select>
        <button
          onClick={() => fetchOrders(status, search, 1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm text-gray-500">{data.total} order{data.total !== 1 ? "s" : ""}</span>
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
            <div className="hidden md:block overflow-x-auto overflow-y-auto" style={{ maxHeight: '480px' }}>
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
              <button onClick={() => fetchOrders(status, search, page + 1)} disabled={page >= data.totalPages} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
