"use client"

// v2 - Cloudinary upload support
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

interface FrameItem {
  brand: string
  quantity: number
  imageBase64?: string
  imagePreview?: string
}

export default function NewPatientPage() {
  const router = useRouter()

  // Patient
  const [form, setForm] = useState({ name: "", phone: "", age: "", address: "" })
  const [returning, setReturning] = useState<any>(null)
  const [checking, setChecking] = useState(false)

  // Prescription
  const [prescType, setPrescType] = useState<"manual" | "upload">("manual")
  const [prescData, setPrescData] = useState({
    rightEye: { dv: { sph: "", cyl: "", axis: "", va: "" }, nv: { sph: "", cyl: "", axis: "", va: "" } },
    leftEye:  { dv: { sph: "", cyl: "", axis: "", va: "" }, nv: { sph: "", cyl: "", axis: "", va: "" } },
  })
  const [fileUrl, setFileUrl] = useState("")
  const [fileName, setFileName] = useState("")

  // Order
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

  const checkPhone = async () => {
    if (!form.phone.trim()) return
    setChecking(true)
    try {
      const res = await apiClient.checkReturningPatient(form.phone.trim())
      if (res.success && res.data?.isReturning) setReturning(res.data)
      else setReturning(null)
    } catch (e) { console.error(e) }
    finally { setChecking(false) }
  }

  const handleFrameImage = (index: number, file: File | null) => {
    if (!file) {
      const n = [...frames]; n[index] = { ...n[index], imageBase64: undefined, imagePreview: undefined }; setFrames(n); return
    }
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB"); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      const n = [...frames]; n[index] = { ...n[index], imageBase64: base64, imagePreview: base64 }; setFrames(n)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.name || !form.phone || !form.age || !form.address) {
      setError("All patient fields are required"); return
    }
    setLoading(true)
    try {
      // 1. Create patient
      const patientRes = await apiClient.createPatient({
        name: form.name.trim(), phone: form.phone.trim(),
        age: Number(form.age), address: form.address.trim(),
      })
      if (!patientRes.success || !patientRes.data) {
        setError(patientRes.error || "Failed to create patient"); setLoading(false); return
      }
      const patientId = patientRes.data._id

      // 2. Save prescription if any data entered
      const hasManualData = prescType === "manual" && (
        prescData.rightEye.dv.sph || prescData.rightEye.dv.cyl || prescData.rightEye.dv.axis ||
        prescData.rightEye.nv.sph || prescData.rightEye.nv.cyl || prescData.rightEye.nv.axis ||
        prescData.leftEye.dv.sph || prescData.leftEye.dv.cyl || prescData.leftEye.dv.axis ||
        prescData.leftEye.nv.sph || prescData.leftEye.nv.cyl || prescData.leftEye.nv.axis
      )
      const hasUpload = prescType === "upload" && fileUrl.trim()
      if (hasManualData || hasUpload) {
        const prescPayload: any = { patientId, type: prescType }
        if (prescType === "manual") {
          const num = (v: string) => (v ? Number(v) : null)
          prescPayload.rightEye = {
            dv: { sph: num(prescData.rightEye.dv.sph), cyl: num(prescData.rightEye.dv.cyl), axis: num(prescData.rightEye.dv.axis), va: prescData.rightEye.dv.va },
            nv: { sph: num(prescData.rightEye.nv.sph), cyl: num(prescData.rightEye.nv.cyl), axis: num(prescData.rightEye.nv.axis), va: prescData.rightEye.nv.va },
          }
          prescPayload.leftEye = {
            dv: { sph: num(prescData.leftEye.dv.sph), cyl: num(prescData.leftEye.dv.cyl), axis: num(prescData.leftEye.dv.axis), va: prescData.leftEye.dv.va },
            nv: { sph: num(prescData.leftEye.nv.sph), cyl: num(prescData.leftEye.nv.cyl), axis: num(prescData.leftEye.nv.axis), va: prescData.leftEye.nv.va },
          }
        } else {
          prescPayload.fileUrl = fileUrl.trim(); prescPayload.fileName = fileName.trim()
        }
        await apiClient.createPrescription(prescPayload)
      }

      // 3. Save order if any items added
      const hasOrder = frames.length > 0 || lenses.length > 0 || drops.length > 0 || tablets.length > 0
      if (hasOrder) {
        // Upload frame images to Cloudinary
        const framesPayload = await Promise.all(frames.map(async ({ imagePreview, imageBase64, ...rest }) => {
          let imageUrl: string | undefined = undefined
          if (imageBase64) {
            try {
              const uploadRes = await apiClient.uploadFile(imageBase64, "kasturi-eye/frames")
              if (uploadRes.success && uploadRes.data) imageUrl = uploadRes.data.url
            } catch (e) { console.error("Frame image upload failed:", e) }
          }
          return { ...rest, brand: rest.brand || "Unknown", imageUrl }
        }))
        await apiClient.createOrder({
          patientId, frames: framesPayload, lenses, drops, tablets,
          totalAmount: Number(totalAmount) || 0,
          amountPaid: Number(amountPaid) || 0,
          doctorName,
        })
      }

      router.push(`/patients/${patientId}`)
    } catch (e: any) {
      setError(e.message || "Failed to register patient")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Patient</h1>
        <p className="text-gray-500 text-sm mt-1">Register patient, add prescription and order in one step</p>
      </div>

      {returning && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Returning Patient Detected!</p>
              <p className="text-amber-700 text-sm mt-1"><strong>{returning.patient.name}</strong> is already registered.</p>
              <div className="mt-3 flex gap-3">
                <a href={`/patients/${returning.patient._id}`} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium">View Existing Patient →</a>
                <button onClick={() => setReturning(null)} className="border border-amber-300 text-amber-700 px-4 py-2 rounded-lg text-sm hover:bg-amber-100">Register Anyway</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

        {/* ── 1. Patient Details ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Patient Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <div className="flex gap-2">
              <input type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onBlur={checkPhone}
                placeholder="10-digit mobile number"
                className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={checkPhone} disabled={checking}
                className="flex-shrink-0 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 whitespace-nowrap">
                {checking ? "..." : "Check"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">We'll check if this patient already exists</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age in years" min="0" max="150"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        {/* ── 2. Prescription ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800">Prescription</h2>
            <p className="text-xs text-gray-400 mt-0.5">Optional — can be added later from patient profile</p>
          </div>
          <div className="flex gap-3">
            {(["manual", "upload"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setPrescType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${prescType === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                {t === "manual" ? "Manual Entry" : "Upload File"}
              </button>
            ))}
          </div>
          {prescType === "manual" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="w-12"></th>
                    <th colSpan={4} className="text-center py-2 text-blue-700 font-bold border-b-2 border-blue-200 bg-blue-50">R</th>
                    <th colSpan={4} className="text-center py-2 text-green-700 font-bold border-b-2 border-green-200 bg-green-50">L</th>
                  </tr>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="py-2 px-1"></th>
                    {["SPH","CYL","AXIS","VA","SPH","CYL","AXIS","VA"].map((h,i) => (
                      <th key={i} className={`py-2 px-1 font-medium text-center ${i === 3 ? "border-r-2 border-gray-300" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(["dv","nv"] as const).map((row) => (
                    <tr key={row} className="border-t border-gray-100">
                      <td className="py-2 px-2 font-bold text-gray-700 text-xs whitespace-nowrap">{row === "dv" ? "D.V." : "N.V."}</td>
                      {(["rightEye","leftEye"] as const).map((eye, eyeIdx) => (
                        (["sph","cyl","axis","va"] as const).map((field, fieldIdx) => (
                          <td key={`${eye}-${field}`} className={`py-1 px-1 ${eyeIdx === 0 && fieldIdx === 3 ? "border-r-2 border-gray-300" : ""}`}>
                            <input
                              type={field === "va" ? "text" : "number"}
                              step={field === "axis" ? "1" : "0.25"}
                              placeholder="-"
                              value={(prescData[eye][row] as any)[field]}
                              onChange={(e) => setPrescData({
                                ...prescData,
                                [eye]: { ...prescData[eye], [row]: { ...prescData[eye][row], [field]: e.target.value } }
                              })}
                              className="w-full text-center bg-transparent border-0 border-b border-gray-300 focus:border-blue-500 focus:outline-none text-sm py-1 min-w-[40px]"
                            />
                          </td>
                        ))
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              <PrescNewUpload
                fileUrl={fileUrl}
                fileName={fileName}
                onUpload={(url, name) => { setFileUrl(url); setFileName(name) }}
                onClear={() => { setFileUrl(""); setFileName("") }}
              />
            </div>
          )}
        </div>

        {/* ── 3. Order ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800">Order</h2>
            <p className="text-xs text-gray-400 mt-0.5">Optional — add frames, lenses, or drops</p>
          </div>

          {/* Frames */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Frames</span>
              <button type="button" onClick={() => setFrames([...frames, { brand: frameBrands[0]?.name || "", quantity: 1 }])}
                className="text-blue-600 text-sm hover:underline">+ Add Frame</button>
            </div>
            {frames.length === 0 ? <p className="text-gray-400 text-xs">No frames added</p> : (
              <div className="space-y-3">
                {frames.map((f, i) => (
                  <FrameRow key={i} frame={f} frameBrands={frameBrands}
                    onChange={(u) => { const n = [...frames]; n[i] = u; setFrames(n) }}
                    onRemove={() => setFrames(frames.filter((_, j) => j !== i))} />
                ))}
              </div>
            )}
          </div>

          {/* Lenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Lenses</span>
              <button type="button" onClick={() => setLenses([...lenses, { brand: lensBrands[0]?.name || "", powPow: "", compPow: "" }])}
                className="text-blue-600 text-sm hover:underline">+ Add Lens</button>
            </div>
            {lenses.length === 0 ? <p className="text-gray-400 text-xs">No lenses added</p> : (
              <div className="space-y-2">
                {lenses.map((l, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <select value={l.brand} onChange={(e) => { const n = [...lenses]; n[i].brand = e.target.value; setLenses(n) }}
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                        {lensBrands.map((b: any) => <option key={b._id} value={b.name}>{b.name}</option>)}
                        {lensBrands.length === 0 && <option value="">No brands</option>}
                      </select>
                      <button type="button" onClick={() => setLenses(lenses.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 font-medium">POW/POW</label>
                        <input type="text" value={l.powPow} onChange={(e) => { const n = [...lenses]; n[i].powPow = e.target.value; setLenses(n) }}
                          placeholder="e.g. -1.50/-2.00" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">COMP/POW</label>
                        <input type="text" value={l.compPow} onChange={(e) => { const n = [...lenses]; n[i].compPow = e.target.value; setLenses(n) }}
                          placeholder="e.g. 0.75/-1.25" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drops */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Eye Drops</span>
              <button type="button" onClick={() => setDrops([...drops, { name: dropBrands[0]?.name || "", quantity: 1 }])}
                className="text-blue-600 text-sm hover:underline">+ Add Drop</button>
            </div>
            {drops.length === 0 ? <p className="text-gray-400 text-xs">No drops added</p> : (
              <div className="space-y-2">
                {drops.map((d, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    {dropBrands.length > 0 ? (
                      <select value={d.name} onChange={(e) => { const n = [...drops]; n[i].name = e.target.value; setDrops(n) }}
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        {dropBrands.map((b: any) => <option key={b._id} value={b.name}>{b.name}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={d.name} onChange={(e) => { const n = [...drops]; n[i].name = e.target.value; setDrops(n) }}
                        placeholder="Drop name" className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    )}
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => { const n = [...drops]; n[i].quantity = Math.max(1, n[i].quantity - 1); setDrops(n) }} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                      <span className="w-6 text-center text-sm">{d.quantity}</span>
                      <button type="button" onClick={() => { const n = [...drops]; n[i].quantity += 1; setDrops(n) }} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                    </div>
                    <button type="button" onClick={() => setDrops(drops.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tablets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Tablets</span>
              <button type="button" onClick={() => setTablets([...tablets, { name: "", quantity: 1 }])}
                className="text-blue-600 text-sm hover:underline">+ Add Tablet</button>
            </div>
            {tablets.length === 0 ? <p className="text-gray-400 text-xs">No tablets added</p> : (
              <div className="space-y-2">
                {tablets.map((t, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={t.name} onChange={(e) => { const n = [...tablets]; n[i].name = e.target.value; setTablets(n) }}
                      placeholder="Tablet name" className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => { const n = [...tablets]; n[i].quantity = Math.max(1, n[i].quantity - 1); setTablets(n) }} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                      <span className="w-6 text-center text-sm">{t.quantity}</span>
                      <button type="button" onClick={() => { const n = [...tablets]; n[i].quantity += 1; setTablets(n) }} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                    </div>
                    <button type="button" onClick={() => setTablets(tablets.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          {(frames.length > 0 || lenses.length > 0 || drops.length > 0 || tablets.length > 0) && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
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
              <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5">
                <span className="text-sm font-medium text-orange-700">Due Amount</span>
                <span className="text-base font-bold text-orange-700">₹{dueAmount}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Registering..." : "Register Patient"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function FrameRow({ frame, frameBrands, onChange, onRemove }: {
  frame: FrameItem; frameBrands: any[]
  onChange: (f: FrameItem) => void; onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return }
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "kasturi_eye_unsigned")
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dpp7ylg7d/image/upload", {
        method: "POST", body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        onChange({ ...frame, imageBase64: data.secure_url, imagePreview: data.secure_url })
      } else {
        alert(data.error?.message || "Upload failed")
      }
    } catch (e: any) { alert(e.message || "Upload failed") }
    finally { setUploading(false) }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex gap-2 items-center mb-2">
        <select value={frame.brand} onChange={(e) => onChange({ ...frame, brand: e.target.value })}
          className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          {frameBrands.map((b: any) => <option key={b._id} value={b.name}>{b.name}</option>)}
          {frameBrands.length === 0 && <option value="">No brands</option>}
        </select>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onChange({ ...frame, quantity: Math.max(1, frame.quantity - 1) })} className="w-7 h-7 border border-gray-300 rounded bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100">−</button>
          <span className="w-6 text-center text-sm font-medium">{frame.quantity}</span>
          <button type="button" onClick={() => onChange({ ...frame, quantity: frame.quantity + 1 })} className="w-7 h-7 border border-gray-300 rounded bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100">+</button>
        </div>
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600">✕</button>
      </div>
      <div className="flex items-center gap-3">
        {uploading ? (
          <div className="flex items-center gap-2 text-blue-600 text-xs">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Uploading...
          </div>
        ) : frame.imagePreview ? (
          <div className="relative">
            <a href={frame.imagePreview} target="_blank" rel="noopener noreferrer">
              <img src={frame.imagePreview} alt="Frame" className="w-16 h-16 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity" />
            </a>
            <button type="button" onClick={() => { onChange({ ...frame, imageBase64: undefined, imagePreview: undefined }); if (fileRef.current) fileRef.current.value = "" }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 bg-white transition-colors">
            📷 Upload Image <span className="text-gray-400">(optional)</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
    </div>
  )
}

// ── Prescription Upload Component (reusable) ──────────────────────────────────
function PrescNewUpload({
  fileUrl, fileName, onUpload, onClear,
}: { fileUrl: string; fileName: string; onUpload: (url: string, name: string) => void; onClear: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError("File must be under 10MB"); return }
    setError("")
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "kasturi_eye_unsigned")
    try {
      const resourceType = file.type === "application/pdf" ? "raw" : "image"
      const res = await fetch(`https://api.cloudinary.com/v1_1/dpp7ylg7d/${resourceType}/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) onUpload(data.secure_url, file.name)
      else setError(data.error?.message || "Upload failed. Please try again.")
    } catch (err: any) { setError(err.message || "Upload failed") }
    finally { setUploading(false) }
  }

  if (fileUrl) {
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName) || fileUrl.includes("image")
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-green-700">✅ File uploaded</span>
          <button type="button" onClick={onClear} className="text-xs text-red-500 hover:underline">Remove</button>
        </div>
        {isImage
          ? <img src={fileUrl} alt={fileName} className="max-h-40 rounded-lg border border-green-200 object-contain" />
          : <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">📎 {fileName}</a>
        }
      </div>
    )
  }

  return (
    <div>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {uploading ? (
        <div className="flex items-center gap-3 border border-blue-200 bg-blue-50 rounded-xl p-4">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-600">Uploading...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button type="button"
            onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute("capture"); fileRef.current.click() } }}
            className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <span className="text-3xl">🖼️</span>
            <span className="text-sm font-medium text-gray-700">Gallery / File</span>
            <span className="text-xs text-gray-400">Image or PDF</span>
          </button>
          <button type="button"
            onClick={() => { if (fileRef.current) { fileRef.current.setAttribute("capture", "environment"); fileRef.current.click() } }}
            className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <span className="text-3xl">📷</span>
            <span className="text-sm font-medium text-gray-700">Camera</span>
            <span className="text-xs text-gray-400">Take a photo</span>
          </button>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">JPEG, PNG, WebP, PDF · max 10MB</p>
    </div>
  )
}
