"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const YEARS = [2023, 2024, 2025, 2026, 2027]

export default function ReportsClient({ initialData, initialYear }: { initialData: any; initialYear: number }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [fromMonth, setFromMonth] = useState(1)
  const [fromYear, setFromYear] = useState(initialYear)
  const [toMonth, setToMonth] = useState(new Date().getMonth() + 1)
  const [toYear, setToYear] = useState(initialYear)

  const fetchReport = async (fm: number, fy: number, tm: number, ty: number) => {
    setLoading(true)
    try {
      const res = await apiClient.getMonthlyReport({ fromMonth: fm, fromYear: fy, toMonth: tm, toYear: ty })
      if (res.success && res.data) setData(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchReport(fromMonth, fromYear, toMonth, toYear)
  }, [])

  const handleSearch = () => {
    // Validate range
    const from = fromYear * 12 + fromMonth
    const to = toYear * 12 + toMonth
    if (from > to) { alert("'From' date must be before 'To' date"); return }
    fetchReport(fromMonth, fromYear, toMonth, toYear)
  }

  const totalPatients = data ? data.report.reduce((s: number, r: any) => s + r.patients, 0) : 0
  const totalOrders = data ? data.report.reduce((s: number, r: any) => s + r.orders, 0) : 0
  const maxVal = data ? Math.max(...data.report.map((r: any) => Math.max(r.patients, r.orders)), 1) : 1

  return (
    <div className="space-y-6">

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Select Date Range</h2>
        <div className="flex flex-wrap items-end gap-4">
          {/* From */}
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From Month</label>
              <select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From Year</label>
              <select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <span className="text-gray-400 text-sm pb-2">→</span>

          {/* To */}
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Month</label>
              <select value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Year</label>
              <select value={toYear} onChange={(e) => setToYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSearch} disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
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

      {/* Bar Chart */}
      {data && data.report.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-6">Monthly Breakdown</h2>
          <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: "200px" }}>
            {data.report.map((r: any) => (
              <div key={`${r.year}-${r.monthNum}`} className="flex-shrink-0 flex flex-col items-center gap-1" style={{ minWidth: "48px" }}>
                <div className="w-full flex gap-0.5 items-end" style={{ height: "160px" }}>
                  <div className="flex-1 bg-blue-400 rounded-t transition-all"
                    style={{ height: `${(r.patients / maxVal) * 100}%`, minHeight: r.patients > 0 ? "4px" : "0" }}
                    title={`Patients: ${r.patients}`} />
                  <div className="flex-1 bg-green-400 rounded-t transition-all"
                    style={{ height: `${(r.orders / maxVal) * 100}%`, minHeight: r.orders > 0 ? "4px" : "0" }}
                    title={`Orders: ${r.orders}`} />
                </div>
                <span className="text-xs text-gray-500 text-center leading-tight">{r.month}<br />{r.year}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-blue-400 rounded" /> Patients
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-400 rounded" /> Orders
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {data && data.report.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
