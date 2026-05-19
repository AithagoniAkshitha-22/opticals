import { apiClient } from "@/lib/api"
import Link from "next/link"
import PatientDetailClient from "./patient-detail-client"

export const dynamic = "force-dynamic"

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let patientData: any = null
  try {
    const res = await apiClient.getPatientById(id)
    if (res.success && res.data) patientData = res.data
  } catch (e) {
    console.error(e)
  }

  if (!patientData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">Patient not found.</p>
        <Link href="/patients" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Patients
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/patients" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Patients
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 text-sm font-medium">{patientData.patient.name}</span>
      </div>
      <PatientDetailClient patientData={patientData} />
    </div>
  )
}
