"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api"

interface FrameItem {
  brand: string
  imageBase64?: string
  imagePreview?: string
}

export default function NewOrderForm() {
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
  const [dropBrands, setDropBrands] = useState<any[]>([])
  const [frames, setFrames] = useState<FrameItem[]>([])
  const [lenses, setLenses] = useState<{ brand: string; powPow: string; compPow: string }[]>([])
  const [drops, setDrops] = useState<{ name: string; quantity: number }[]>([])
  const [tablets, setTablets] = useState<{ name: string; quantity: number }[]>([])
  const [totalAmount, setTotalAmount] = useState("")
  const [amountPaid, setAmountPaid] = useState("")
  const dueAmount = Math.max(0, (Number(totalAmount) || 0) - (Number(amountPaid) || 0))
  const [doctorName, setDoctorName] = useState("Dr. R. Jay Krishnan")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    apiClient.getBrands("frame").then((r) => { if (r.success) setFrameBrands(r.data || []) })
    apiClient.getBrands("lens").then((r) => { if (r.success) setLensBrands(r.data || []) })
    apiClient.getBrands("drop").then((r) => { if (r.success) setDropBrands(r.data || []) })
  }, [])

  const searchPatients = async (q: string) => {
    if (!q.trim()) { setPatientResults([]); return }
    try {
      const res = await apiClient.getPatients({ search: q, limit: 5 })
      if (res.success && res.data) setPatientResults(res.data.patients)
    } catch (e) { console.error(e) }
  }

  const addFrame = () => setFrames([...frames, { brand: frameBrands[0]?.name || "" }])
  const addLens = () => setLenses([...lenses, { brand: lensBrands[0]?.name || "", powPow: "", compPow: "" }])
  const addDrop = () => setDrops([...drops, { name: dropBrands[0]?.name || "", quantity: 1 }])
  const addTablet = () => setTablets([...tablets, { name: "", quantity: 1 }])

  const handleFrameImage = (index: number, file: File | null) => {
    if (!file) {
      const updated = [...frames]
      updated[index] = { ...updated[index], imageBase64: undefined, imagePreview: undefined }
      setFrames(updated)
      return
    }
    if (file.size > 10 * 1024 * 1024) { alert("Image must be under 10MB"); return }
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
    if (frames.length === 0 && lenses.length === 0 && drops.length === 0 && tablets.length === 0) {
      setError("Add at least one item (frame, lens, drop, or tablet)"); return
    }
    setLoading(true)
    try {
      // Upload each frame image to Cloudinary before creating the order
      const framesPayload = await Promise.all(
        frames.map(async ({ imagePreview: _imagePreview, imageBase64, brand }) => {
          const rest = { brand }
          let imageUrl: string | undefined = undefined
          if (imageBase64) {
            const uploadRes = await apiClient.uploadFile(imageBase64, "kasturi-eye/frames")
            if (uploadRes.success && uploadRes.data?.url) {
              imageUrl = uploadRes.data.url
            } else {
              throw new Error("Failed to upload frame image. Please try again.")
            }
          }
          return { ...rest, brand: rest.brand || "Unknown", imageUrl }
        })
      )
      const res = await apiClient.createOrder({ patientId, frames: framesPayload, lenses, drops, tablets, totalAmount: Number(totalAmount) || 0, amountPaid: Number(amountPaid) || 0, doctorName })
      if (res.success && res.data) router.push(`/orders/${res.data._id}`)
      else setError(res.error || "Failed to create order")
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="text-gray-500 text-sm mt-1">Create an order for frames, lenses, or drops</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

        {/* Patient */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Patient *</h2>
          {selectedPatient ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div>
                <p className="font-medium text-blue-800">{selectedPatient.name}</p>
                {selectedPatient.phone && <p className="text-blue-600 text-sm">{selectedPatient.phone}</p>}
              </div>
              <button type="button" onClick={() => { setSelectedPatient(null); setPatientId(""); setPatientSearch("") }} className="text-blue-600 text-sm hover:underline">Change</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={patientSearch} onChange={(e) => { setPatientSearch(e.target.value); searchPatients(e.target.value) }}
                placeholder="Search patient by name or phone..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {patientResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {patientResults.map((p: any) => (
                    <button key={p._id} type="button" onClick={() => { setSelectedPatient(p); setPatientId(p._id); setPatientSearch(p.name); setPatientResults([]) }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
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
            <button type="button" onClick={addFrame} className="text-blue-600 text-sm hover:underline font-medium">+ Add Frame</button>
          </div>
          {frames.length === 0 ? <p className="text-gray-400 text-sm">No frames added</p> : (
            <>
              {frameBrands.length === 0 && (
                <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs">
                  ⚠️ No frame brands found. <a href="/brands" className="underline font-medium">Add brands first</a> or frames will be saved as "Unknown".
                </div>
              )}
              <div className="space-y-4">
                {frames.map((f, i) => (
                  <FrameRow key={i} frame={f} index={i} frameBrands={frameBrands}
                    onChange={(updated) => { const n = [...frames]; n[i] = updated; setFrames(n) }}
                    onImageChange={(file) => handleFrameImage(i, file)}
                    onRemove={() => setFrames(frames.filter((_, j) => j !== i))} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Lenses */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Lenses</h2>
            <button type="button" onClick={addLens} className="text-blue-600 text-sm hover:underline font-medium">+ Add Lens</button>
          </div>
          {lenses.length === 0 ? <p className="text-gray-400 text-sm">No lenses added</p> : (
            <div className="space-y-3">
              {lenses.map((l, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-2">
                  <div className="flex items-center gap-2">
                    <select value={l.brand} onChange={(e) => { const n = [...lenses]; n[i].brand = e.target.value; setLenses(n) }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                      {lensBrands.map((b: any) => <option key={b._id} value={b.name}>{b.name}</option>)}
                      {lensBrands.length === 0 && <option value="">No brands</option>}
                    </select>
                    <button type="button" onClick={() => setLenses(lenses.filter((_, j) => j !== i))} className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 text-sm font-bold">✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 font-medium">POW/POW</label>
                      <input type="text" value={l.powPow} onChange={(e) => { const n = [...lenses]; n[i].powPow = e.target.value; setLenses(n) }}
                        placeholder="e.g. -1.50/-2.00"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">COMP/POW</label>
                      <input type="text" value={l.compPow} onChange={(e) => { const n = [...lenses]; n[i].compPow = e.target.value; setLenses(n) }}
                        placeholder="e.g. 0.75/-1.25"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drops */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Eye Drops</h2>
            <button type="button" onClick={addDrop} className="text-blue-600 text-sm hover:underline font-medium">+ Add Drop</button>
          </div>
          {drops.length === 0 ? <p className="text-gray-400 text-sm">No drops added</p> : (
            <div className="space-y-3">
              {drops.map((d, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    {dropBrands.length > 0 ? (
                      <select value={d.name} onChange={(e) => { const n = [...drops]; n[i].name = e.target.value; setDrops(n) }}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                        {dropBrands.map((b: any) => <option key={b._id} value={b.name}>{b.name}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={d.name} onChange={(e) => { const n = [...drops]; n[i].name = e.target.value; setDrops(n) }}
                        placeholder="Drop name"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    )}
                    <button type="button" onClick={() => setDrops(drops.filter((_, j) => j !== i))}
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 text-sm font-bold">✕</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { const n = [...drops]; n[i].quantity = Math.max(1, n[i].quantity - 1); setDrops(n) }} className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center">−</button>
                    <span className="w-8 text-center text-sm font-medium">{d.quantity}</span>
                    <button type="button" onClick={() => { const n = [...drops]; n[i].quantity += 1; setDrops(n) }} className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tablets */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Tablets</h2>
            <button type="button" onClick={addTablet} className="text-blue-600 text-sm hover:underline font-medium">+ Add Tablet</button>
          </div>
          {tablets.length === 0 ? <p className="text-gray-400 text-sm">No tablets added</p> : (
            <div className="space-y-3">
              {tablets.map((t, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="text" value={t.name} onChange={(e) => { const n = [...tablets]; n[i].name = e.target.value; setTablets(n) }}
                      placeholder="Tablet name"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <button type="button" onClick={() => setTablets(tablets.filter((_, j) => j !== i))}
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 text-sm font-bold">✕</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { const n = [...tablets]; n[i].quantity = Math.max(1, n[i].quantity - 1); setTablets(n) }} className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center">−</button>
                    <span className="w-8 text-center text-sm font-medium">{t.quantity}</span>
                    <button type="button" onClick={() => { const n = [...tablets]; n[i].quantity += 1; setTablets(n) }} className="w-8 h-8 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
              <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
              <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-orange-700">Due Amount</span>
            <span className="text-lg font-bold text-orange-700">₹{dueAmount}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
            <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Uploading & Creating Order..." : "Create Order"}
          </button>
          <button type="button" onClick={() => router.back()} className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  )
}

function FrameRow({ frame, index, frameBrands, onChange, onImageChange, onRemove }: {
  frame: FrameItem; index: number; frameBrands: any[]
  onChange: (f: FrameItem) => void; onImageChange: (file: File | null) => void; onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [lightbox, setLightbox] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      {lightbox && frame.imagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(false)}>
          <img src={frame.imagePreview} alt="Frame" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white text-3xl font-light leading-none">×</button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <select value={frame.brand} onChange={(e) => onChange({ ...frame, brand: e.target.value })}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          {frameBrands.map((b: any) => <option key={b._id} value={b.name}>{b.name}</option>)}
          {frameBrands.length === 0 && <option value="">No brands</option>}
        </select>
        <button type="button" onClick={onRemove} className="w-8 h-8 border border-red-200 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center flex-shrink-0 text-sm font-bold">✕</button>
      </div>
      <div className="flex items-center gap-3 mt-2">
        {frame.imagePreview ? (
          <div className="relative">
            <img
              src={frame.imagePreview}
              alt="Frame"
              className="w-20 h-20 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setLightbox(true)}
            />
            <button type="button"
              onClick={() => { onChange({ ...frame, imageBase64: undefined, imagePreview: undefined }); if (fileRef.current) fileRef.current.value = "" }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">✕</button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <button type="button"
              onClick={() => { if (fileRef.current) { fileRef.current.setAttribute("capture", "environment"); fileRef.current.click() } }}
              className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-lg py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 bg-white transition-colors">
              📷 Camera
            </button>
            <button type="button"
              onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute("capture"); fileRef.current.click() } }}
              className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-lg py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 bg-white transition-colors">
              🖼️ Gallery
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => onImageChange(e.target.files?.[0] || null)} />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">JPEG/PNG/WebP · max 2MB</p>
    </div>
  )
}
