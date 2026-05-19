"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api"

export default function ReportsClient({ initialData, initialYear }: { initialData: any; initialYear: number }) {
  const [data, setData] = useState(initialData)
  const [year, setYear] = useState(initialYear)
  const [loading, setLoading] = useState(false)

  const fetchReport = async (y: number) => {
    setLoading(true)
    try {
      const res = await apiClient.getMonthlyReport(y)
      if (res.success && res.data) setData(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const maxVal = data ? Math.max(...data.report.map((r: any) => Math.max(r.patients, r.orders)), 1) : 1
  const totalPatients = data ? data.report.reduce((s: number, r: any) => s + r.patients, 0) : 0
  const totalOrders = data ? data.report.reduce((s: number, r: any) => s + r.orders, 0) : 0

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Year:</label>
        <select
          value={year}
          onChange={(e) => { const y = Number(e.target.value); setYear(y); fetchReport(y) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[2023, 2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {loading && <span className="text-gray-400 text-sm">Loading...</span>}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-blue-700">{totalPatients}</p>
          <p className="text-sm text-blue-600 mt-1">Total Patients in {year}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-green-700">{totalOrders}</p>
          <p className="text-sm text-green-600 mt-1">Total Orders in {year}</p>
        </div>
      </div>

      {/* Bar Chart */}
      {data && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-6">Monthly Breakdown</h2>
          <div className="flex items-end gap-2 h-48">
            {data.report.map((r: any) => (
              <div key={r.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: "160px" }}>
                  <div
                    className="flex-1 bg-blue-400 rounded-t transition-all"
                    style={{ height: `${(r.patients / maxVal) * 100}%`, minHeight: r.patients > 0 ? "4px" : "0" }}
                    title={`Patients: ${r.patients}`}
                  />
                  <div
                    className="flex-1 bg-green-400 rounded-t transition-all"
                    style={{ height: `${(r.orders / maxVal) * 100}%`, minHeight: r.orders > 0 ? "4px" : "0" }}
                    title={`Orders: ${r.orders}`}
                  />
                </div>
                <span className="text-xs text-gray-500">{r.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-blue-400 rounded" />
              Patients
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-400 rounded" />
              Orders
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {data && (
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
                <tr key={r.month} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{r.month} {year}</td>
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
    </div>
  )
}
