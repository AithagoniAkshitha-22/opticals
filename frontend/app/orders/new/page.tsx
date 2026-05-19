"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api"

interface FrameItem {
  brand: string
  quantity: number
  imageBase64?: string
  imagePreview?: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const params = useSearchParams()
  const prePatientId = params.get("patientId") || ""
  const prePatientName = params.get("patientName") || ""

  const [patientSearch, setPatientSearch] = useState(prePatientName)
  const [patientId, setPatientId] = useState(prePatientId)
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(
    prePatientId ? { _id: prePatientId, name: prePatientName } : null
  )
  const [frameBrands, setFrameBrands] = useState<any[]>([])
  const [lensBrands, setLensBrands] = useState<any[]>([])
  const [frames, setFrames] = useState<FrameItem[]>([])
  const [lenses, setLenses] = useState<{ brand: string; powerDetails: string }[]>([])
  const [drops, setDrops] = useState<{ name: string; quantity: number }[]>([])
  const [totalAmount, setTotalAmount] = useState("")
  const [doctorName, setDoctorName] = useState("Dr. Kasturi")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    apiClient.getBrands("frame").then((r) => { if (r.success) setFrameBrands(r.data || []) })
    apiClient.getBrands("lens").then((r) => { if (r.success) setLensBrands(r.data || []) })
  }, [])

  const searchPatients = async (q: string) => {
    if (!q.trim()) { setPatientResults([]); return }
    try {
      const res = await apiClient.getPatients({ search: q, limit: 5 })
      if (res.success && res.data) setPatientResults(res.data.patients)
    } catch (e) { console.error(e) }
  }

  const addFrame = () =>
    setFrames([...frames, { brand: frameBrands[0]?.name || "", quantity: 1 }])
  const addLens = () =>
    setLenses([...lenses, { brand: lensBrands[0]?.name || "", powerDetails: "" }])
  const addDrop = () =>
    setDrops([...drops, { name: "", quantity: 1 }])

  // Convert selected image file to base64
  const handleFrameImage = (index: number, file: File | null) => {
    if (!file) {
      const updated = [...frames]
      updated[index] = { ...updated[index], imageBase64: undefined, imagePreview: undefined }
      setFrames(updated)
      return
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      const updated = [...frames]
      updated[index] = { ...updated[index], imageBase64: base64, imagePreview: base64 }
      setFrames(updated)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!patientId) { setError("Please select a patient"); return }
    if (frames.length === 0 && lenses.length === 0 && drops.length === 0) {
      setError("Add at least one item (frame, lens, or drop)")
      return
    }
    setLoading(true)
    try {
      // Strip imagePreview (UI only), keep imageBase64 as imageUrl for backend
      const framesPayload = frames.map(({ imagePreview, imageBase64, ...rest }) => ({
        ...rest,
        brand: rest.brand || "Unknown",
        imageUrl: imageBase64 || undefined,
      }))

      const res = await apiClient.createOrder({
        patientId,
        frames: framesPayload,
        lenses,
        drops,
        totalAmount: Number(totalAmount) || 0,
        doctorName,
      })
      if (res.success && res.data) {
        router.push(`/orders/${res.data._id}`)
      } else {
        setError(res.error || "Failed to create order")
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="text-gray-500 text-sm mt-1">Create an order for frames, lenses, or drops</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {/* Patient Selection */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Patient *</h2>
          {selectedPatient ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div>
                <p className="font-medium text-blue-800">{selectedPatient.name}</p>
                {selectedPatient.phone && <p className="text-blue-600 text-sm">{selectedPatient.phone}</p>}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedPatient(null); setPatientId(""); setPatientSearch("") }}
                className="text-blue-600 text-sm hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => { setPatientSearch(e.target.value); searchPatients(e.target.value) }}
                placeholder="Search patient by name or phone..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {patientResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {patientResults.map((p: any) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p)
                        setPatientId(p._id)
                        setPatientSearch(p.name)
                        setPatientResults([])
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="font-medium text-sm text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Frames */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Frames</h2>
            <button type="button" onClick={addFrame} className="text-blue-600 text-sm hover:underline font-medium">
              + Add Frame
            </button>
          </div>

          {frames.length === 0 ? (
            <p className="text-gray-400 text-sm">No frames added</p>
          ) : (
            <>
              {frameBrands.length === 0 && (
                <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs">
                  ⚠️ No frame brands found.{" "}
                  <a href="/brands" className="underline font-medium">Add brands first</a> for better tracking, or frames will be saved as "Unknown".
                </div>
              )}
              <div className="space-y-4">
                {frames.map((f, i) => (
                  <FrameRow
                    key={i}
                    frame={f}
                    index={i}
                    frameBrands={frameBrands}
                    onChange={(updated) => {
                      const n = [...frames]
                      n[i] = updated
                      setFrames(n)
                    }}
                    onImageChange={(file) => handleFrameImage(i, file)}
                    onRemove={() => setFrames(frames.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Lenses */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Lenses</h2>
            <button type="button" onClick={addLens} className="text-blue-600 text-sm hover:underline font-medium">
              + Add Lens
            </button>
          </div>
          {lenses.length === 0 ? (
            <p className="text-gray-400 text-sm">No lenses added</p>
          ) : (
            <div className="space-y-3">
              {lenses.map((l, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <select
                    value={l.brand}
                    onChange={(e) => { const n = [...lenses]; n[i].brand = e.target.value; setLenses(n) }}
                    className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {lensBrands.map((b: any) => <option key={b._id} value={b.name}>{b.name}</option>)}
                    {lensBrands.length === 0 && <option value="">No brands</option>}
                  </select>
                  <input
                    type="text"
                    value={l.powerDetails}
                    onChange={(e) => { const n = [...lenses]; n[i].powerDetails = e.target.value; setLenses(n) }}
                    placeholder="Power details (e.g. -1.50 / -0.75 x 90)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setLenses(lenses.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drops */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Eye Drops</h2>
            <button type="button" onClick={addDrop} className="text-blue-600 text-sm hover:underline font-medium">
              + Add Drop
            </button>
          </div>
          {drops.length === 0 ? (
            <p className="text-gray-400 text-sm">No drops added</p>
          ) : (
            <div className="space-y-3">
              {drops.map((d, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={d.name}
                    onChange={(e) => { const n = [...drops]; n[i].name = e.target.value; setDrops(n) }}
                    placeholder="Drop name"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { const n = [...drops]; n[i].quantity = Math.max(1, n[i].quantity - 1); setDrops(n) }}
                      className="w-8 h-8 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                    >−</button>
                    <span className="w-8 text-center text-sm font-medium">{d.quantity}</span>
                    <button
                      type="button"
                      onClick={() => { const n = [...drops]; n[i].quantity += 1; setDrops(n) }}
                      className="w-8 h-8 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                    >+</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrops(drops.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Doctor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Creating Order..." : "Create Order"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Frame Row Component ────────────────────────────────────────────────────────
function FrameRow({
  frame,
  index,
  frameBrands,
  onChange,
  onImageChange,
  onRemove,
}: {
  frame: FrameItem
  index: number
  frameBrands: any[]
  onChange: (f: FrameItem) => void
  onImageChange: (file: File | null) => void
  onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      {/* Brand + Qty row */}
      <div className="flex gap-3 items-center mb-3">
        <select
          value={frame.brand}
          onChange={(e) => onChange({ ...frame, brand: e.target.value })}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {frameBrands.map((b: any) => (
            <option key={b._id} value={b.name}>{b.name}</option>
          ))}
          {frameBrands.length === 0 && <option value="">No brands — add in Brands page</option>}
        </select>

        {/* Quantity */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...frame, quantity: Math.max(1, frame.quantity - 1) })}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg"
          >−</button>
          <span className="w-8 text-center text-sm font-semibold">{frame.quantity}</span>
          <button
            type="button"
            onClick={() => onChange({ ...frame, quantity: frame.quantity + 1 })}
            className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg"
          >+</button>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 text-lg leading-none ml-1"
        >✕</button>
      </div>

      {/* Image Upload */}
      <div className="flex items-center gap-4">
        {frame.imagePreview ? (
          <div className="relative">
            <img
              src={frame.imagePreview}
              alt="Frame preview"
              className="w-20 h-20 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={() => {
                onChange({ ...frame, imageBase64: undefined, imagePreview: undefined })
                if (fileRef.current) fileRef.current.value = ""
              }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
            >✕</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors bg-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Frame Image
            <span className="text-xs text-gray-400">(optional)</span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onImageChange(e.target.files?.[0] || null)}
        />

        {frame.imagePreview && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs text-blue-600 hover:underline"
          >
            Change image
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1.5">JPEG/PNG/WebP · max 2MB</p>
    </div>
  )
}
