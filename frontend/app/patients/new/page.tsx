"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

export default function NewPatientPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", phone: "", age: "", address: "" })
  const [returning, setReturning] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const checkPhone = async () => {
    if (!form.phone.trim()) return
    setChecking(true)
    try {
      const res = await apiClient.checkReturningPatient(form.phone.trim())
      if (res.success && res.data?.isReturning) {
        setReturning(res.data)
      } else {
        setReturning(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.name || !form.phone || !form.age || !form.address) {
      setError("All fields are required")
      return
    }
    setLoading(true)
    try {
      const res = await apiClient.createPatient({
        name: form.name.trim(),
        phone: form.phone.trim(),
        age: Number(form.age),
        address: form.address.trim(),
      })
      if (res.success && res.data) {
        router.push(`/patients/${res.data._id}`)
      } else {
        setError(res.error || "Failed to create patient")
      }
    } catch (e: any) {
      setError(e.message || "Failed to create patient")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Patient</h1>
        <p className="text-gray-500 text-sm mt-1">Register a new patient visit</p>
      </div>

      {/* Returning Patient Alert */}
      {returning && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Returning Patient Detected!</p>
              <p className="text-amber-700 text-sm mt-1">
                <strong>{returning.patient.name}</strong> is already registered with this phone number.
              </p>
              <div className="mt-3 flex gap-3">
                <a
                  href={`/patients/${returning.patient._id}`}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View Existing Patient →
                </a>
                <button
                  onClick={() => setReturning(null)}
                  className="border border-amber-300 text-amber-700 px-4 py-2 rounded-lg text-sm hover:bg-amber-100 transition-colors"
                >
                  Register Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              onBlur={checkPhone}
              placeholder="10-digit mobile number"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={checkPhone}
              disabled={checking}
              className="border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              {checking ? "..." : "Check"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">We'll check if this patient already exists</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            placeholder="Age in years"
            min="0"
            max="150"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full address"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Registering..." : "Register Patient"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
