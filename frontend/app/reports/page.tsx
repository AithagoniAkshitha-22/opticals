import ReportsClient from "./reports-client"

export default function ReportsPage() {
  const year = new Date().getFullYear()
  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Monthly patient and order statistics</p>
      </div>
      <ReportsClient initialData={null} initialYear={year} />
    </div>
  )
}
