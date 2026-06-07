"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api"

export default function PatientsClient({ initialData }: { initialData: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterToday = searchParams.get("filter") === "today"
  const filterDate = searchParams.get("date") || ""

  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPatients = useCallback(async (s: string, pg: number) => {
    setLoading(true)
    try {
      const params: any = { search: s.trim(), page: pg, limit: 10 }
      if (filterToday && filterDate) {
        params.date = filterDate  // backend will filter by this date
      }
      const res = await apiClient.getPatients(params)
      if (res.success && res.data) { setData(res.data); setPage(pg) }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filterToday, filterDate])

  // Initial load
  useEffect(() => { fetchPatients("", 1) }, [])

  // Live search with 400ms debounce
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchPatients(value, 1), 400)
  }

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (!confirm(`Delete patient "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      const res = await apiClient.deletePatient(id)
      if (res.success) setData((prev: any) => ({ ...prev, patients: prev.patients.filter((p: any) => p._id !== id), total: prev.total - 1 }))
    } catch (e) { console.error(e) }
    finally { setDeletingId(null) }
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 flex items-center gap-2">
        <div className="relative flex-1">
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
            placeholder="Search by name, phone or address..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">{data.total} patient{data.total !== 1 ? "s" : ""} found</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading...</div>
        ) : data.patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">👤</span>
            <p className="font-medium">No patients found</p>
            <Link href="/patients/new" className="mt-3 text-blue-600 text-sm hover:underline">Add first patient →</Link>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.patients.map((p: any) => (
                <div
                  key={p._id}
                  onClick={() => router.push(`/patients/${p._id}`)}
                  className="flex items-center justify-between px-4 py-4 hover:bg-blue-50 cursor-pointer transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.phone} · Age {p.age}</p>
                    <p className="text-xs text-gray-400 truncate">{p.address}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, p._id, p.name)}
                    disabled={deletingId === p._id}
                    className="text-red-400 hover:text-red-600 disabled:opacity-40 p-2 rounded hover:bg-red-50 flex-shrink-0"
                  >
                    {deletingId === p._id ? (
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
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Phone</th>
                    <th className="px-6 py-3 text-left">Age</th>
                    <th className="px-6 py-3 text-left">Address</th>
                    <th className="px-6 py-3 text-left">Registered</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.patients.map((p: any) => (
                    <tr
                      key={p._id}
                      onClick={() => router.push(`/patients/${p._id}`)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 text-gray-600">{p.phone}</td>
                      <td className="px-6 py-4 text-gray-600">{p.age}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{p.address}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleDelete(e, p._id, p.name)}
                          disabled={deletingId === p._id}
                          className="text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors p-1 rounded hover:bg-red-50"
                          title="Delete patient"
                        >
                          {deletingId === p._id ? (
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
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => fetchPatients(search, page - 1)} disabled={page <= 1} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => fetchPatients(search, page + 1)} disabled={page >= data.totalPages} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>            </div>
          </div>
        )}
      </div>
    </div>
  )
}
