"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

export default function PatientsClient({ initialData }: { initialData: any }) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPatients = useCallback(async (s = search, p = phone, pg = 1) => {
    setLoading(true)
    try {
      const res = await apiClient.getPatients({ search: s, phone: p, page: pg, limit: 10 })
      if (res.success && res.data) {
        setData(res.data)
        setPage(pg)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, phone])

  // Auto-fetch on mount
  useEffect(() => { fetchPatients("", "", 1) }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPatients(search, phone, 1)
  }

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (!confirm(`Hide patient "${name}"? They won't appear in the list but data is preserved.`)) return
    setDeletingId(id)
    try {
      const res = await apiClient.deletePatient(id)
      if (res.success) {
        setData((prev: any) => ({
          ...prev,
          patients: prev.patients.filter((p: any) => p._id !== id),
          total: prev.total - 1,
        }))
      }
    } catch (e) { console.error(e) }
    finally { setDeletingId(null) }
  }

  return (
    <div>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Filter by phone..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => { setSearch(""); setPhone(""); fetchPatients("", "", 1) }}
          className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Clear
        </button>
      </form>

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
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
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
              <button
                onClick={() => fetchPatients(search, phone, page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => fetchPatients(search, phone, page + 1)}
                disabled={page >= data.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
