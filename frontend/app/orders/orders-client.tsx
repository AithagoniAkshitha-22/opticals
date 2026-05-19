"use client"

import { useState, useCallback } from "react"
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
  const [data, setData] = useState(initialData)
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchOrders = useCallback(async (s = status, q = search, pg = 1) => {
    setLoading(true)
    try {
      const res = await apiClient.getOrders({ status: s === "all" ? "" : s, search: q, page: pg, limit: 10 })
      if (res.success && res.data) { setData(res.data); setPage(pg) }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [status, search])

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
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
                    <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">#{o._id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{patient?.name || "—"}</p>
                        <p className="text-xs text-gray-400">{patient?.phone}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{itemCount} item{itemCount !== 1 ? "s" : ""}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">₹{o.totalAmount}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"}`}>
                          {o.isDelayed && o.status !== "Delivered" ? "⚠️ " : ""}{o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Link href={`/orders/${o._id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs">View →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
