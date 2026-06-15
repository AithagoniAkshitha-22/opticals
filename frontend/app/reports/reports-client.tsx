"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

export default function ReportsClient({ initialData, initialYear }: { initialData: any; initialYear: number }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const today = new Date()
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`
  const todayStr = today.toISOString().split("T")[0]

  const [fromDate, setFromDate] = useState(firstOfMonth)
  const [toDate, setToDate] = useState(todayStr)

  const fetchReport = async (from: string, to: string) => {
    setLoading(true)
    try {
      const [fy, fm] = from.split("-").map(Number)
      const [ty, tm] = to.split("-").map(Number)
      const res = await apiClient.getMonthlyReport({ fromMonth: fm, fromYear: fy, toMonth: tm, toYear: ty })
      if (res.success && res.data) setData(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReport(fromDate, toDate) }, [])

  const handleSearch = () => {
    if (fromDate > toDate) { alert("'From' date must be before 'To' date"); return }
    fetchReport(fromDate, toDate)
  }

  const totalPatients = data ? data.report.reduce((s: number, r: any) => s + r.patients, 0) : 0
  const totalOrders = data ? data.report.reduce((s: number, r: any) => s + r.orders, 0) : 0

  return (
    <div className="space-y-6">

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Select Date Range</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-gray-400 text-sm hidden sm:block pb-2">→</span>
          <div className="flex-1 w-full">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={handleSearch} disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-blue-700">{totalPatients}</p>
            <p className="text-sm text-blue-600 mt-1">Total Patients</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-green-700">{totalOrders}</p>
            <p className="text-sm text-green-600 mt-1">Total Orders</p>
          </div>
        </div>
      )}

      {/* Table */}
      {data && data.report.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Month</th>
                <th className="px-6 py-3 text-right">Patients</th>
                <th className="px-6 py-3 text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.report.map((r: any) => (
                <tr key={`${r.year}-${r.monthNum}`} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{r.month} {r.year}</td>
                  <td className="px-6 py-3 text-right text-blue-600 font-medium">{r.patients}</td>
                  <td className="px-6 py-3 text-right text-green-600 font-medium">{r.orders}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-3 text-gray-800">Total</td>
                <td className="px-6 py-3 text-right text-blue-700">{totalPatients}</td>
                <td className="px-6 py-3 text-right text-green-700">{totalOrders}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      )}

      {data && data.report.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <p className="text-3xl mb-2">📊</p>
          <p>No data found for the selected range</p>
        </div>
      )}
    </div>
  )
}
