import { apiClient } from "@/lib/api"
import ReportsClient from "./reports-client"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const year = new Date().getFullYear()
  let reportData: any = null
  try {
    const res = await apiClient.getMonthlyReport(year)
    if (res.success && res.data) reportData = res.data
  } catch (e) { console.error(e) }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Monthly patient and order statistics</p>
      </div>
      <ReportsClient initialData={reportData} initialYear={year} />
    </div>
  )
}
