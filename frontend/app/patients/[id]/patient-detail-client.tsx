"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { apiClient } from "@/lib/api"

const STATUS_COLORS: Record<string, string> = {
  Ordered: "bg-blue-100 text-blue-700",
  Processing: "bg-yellow-100 text-yellow-700",
  "Ready for Pickup": "bg-green-100 text-green-700",
  Delivered: "bg-gray-100 text-gray-700",
  Delayed: "bg-red-100 text-red-700",
}

export default function PatientDetailClient({ patientData }: { patientData: any }) {
  const { patient, prescriptions, orders } = patientData
  const [tab, setTab] = useState<"info" | "prescriptions" | "orders">("info")
  const [showPrescForm, setShowPrescForm] = useState(false)
  const [prescType, setPrescType] = useState<"manual" | "upload">("manual")
  const [prescData, setPrescData] = useState({
    rightEye: { sph: "", cyl: "", axis: "", visionType: "Far" },
    leftEye: { sph: "", cyl: "", axis: "", visionType: "Far" },
    fileUrl: "",
    fileName: "",
  })
  const [prescList, setPrescList] = useState(prescriptions)
  const [saving, setSaving] = useState(false)
  const [prescError, setPrescError] = useState("")

  const savePrescription = async () => {
    setPrescError("")
    setSaving(true)
    try {
      const payload: any = { patientId: patient._id, type: prescType }
      if (prescType === "manual") {
        payload.rightEye = {
          sph: prescData.rightEye.sph ? Number(prescData.rightEye.sph) : null,
          cyl: prescData.rightEye.cyl ? Number(prescData.rightEye.cyl) : null,
          axis: prescData.rightEye.axis ? Number(prescData.rightEye.axis) : null,
          visionType: prescData.rightEye.visionType,
        }
        payload.leftEye = {
          sph: prescData.leftEye.sph ? Number(prescData.leftEye.sph) : null,
          cyl: prescData.leftEye.cyl ? Number(prescData.leftEye.cyl) : null,
          axis: prescData.leftEye.axis ? Number(prescData.leftEye.axis) : null,
          visionType: prescData.leftEye.visionType,
        }
      } else {
        if (!prescData.fileUrl) { setPrescError("File URL is required"); setSaving(false); return }
        payload.fileUrl = prescData.fileUrl
        payload.fileName = prescData.fileName
      }
      const res = await apiClient.createPrescription(payload)
      if (res.success) {
        setPrescList([res.data, ...prescList])
        setShowPrescForm(false)
      } else {
        setPrescError(res.error || "Failed to save prescription")
      }
    } catch (e: any) {
      setPrescError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Patient Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-500 text-sm">{patient.phone} · Age {patient.age}</p>
              <p className="text-gray-400 text-sm">{patient.address}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/orders/new?patientId=${patient._id}&patientName=${encodeURIComponent(patient.name)}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Order
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(["info", "prescriptions", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t} {t === "prescriptions" ? `(${prescList.length})` : t === "orders" ? `(${orders.length})` : ""}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Patient Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 text-sm divide-y sm:divide-y-0">
            {[
              { label: "Name", value: patient.name },
              { label: "Phone", value: patient.phone },
              { label: "Age", value: `${patient.age} years` },
              { label: "Registered", value: new Date(patient.createdAt).toLocaleDateString() },
              { label: "Address", value: patient.address, full: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-start py-3 px-2 ${item.full ? "sm:col-span-2" : ""}`}
              >
                <span className="text-gray-500 w-28 flex-shrink-0">{item.label} :</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescriptions Tab */}
      {tab === "prescriptions" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Prescriptions</h2>
            <button
              onClick={() => setShowPrescForm(!showPrescForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Prescription
            </button>
          </div>

          {showPrescForm && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">New Prescription</h3>
              {prescError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm mb-4">{prescError}</div>}

              <div className="flex gap-3 mb-5">
                {(["manual", "upload"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPrescType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      prescType === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {t === "manual" ? "Manual Entry" : "Upload File"}
                  </button>
                ))}
              </div>

              {prescType === "manual" ? (
                <div className="space-y-4">
                  {(["rightEye", "leftEye"] as const).map((eye) => (
                    <div key={eye} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-3">{eye === "rightEye" ? "Right Eye (OD)" : "Left Eye (OS)"}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {["sph", "cyl", "axis"].map((field) => (
                          <div key={field}>
                            <label className="text-xs text-gray-500 uppercase">{field}</label>
                            <input
                              type="number"
                              step="0.25"
                              value={(prescData[eye] as any)[field]}
                              onChange={(e) => setPrescData({ ...prescData, [eye]: { ...prescData[eye], [field]: e.target.value } })}
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="text-xs text-gray-500 uppercase">Vision</label>
                          <select
                            value={(prescData[eye] as any).visionType}
                            onChange={(e) => setPrescData({ ...prescData, [eye]: { ...prescData[eye], visionType: e.target.value } })}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="Far">Far</option>
                            <option value="Near">Near</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <PrescriptionFileUpload
                    fileUrl={prescData.fileUrl}
                    fileName={prescData.fileName}
                    onUpload={(url, name) => setPrescData({ ...prescData, fileUrl: url, fileName: name })}
                    onClear={() => setPrescData({ ...prescData, fileUrl: "", fileName: "" })}
                  />
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={savePrescription} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  {saving ? "Saving..." : "Save Prescription"}
                </button>
                <button onClick={() => setShowPrescForm(false)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {prescList.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p>No prescriptions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescList.map((p: any) => (
                <div key={p._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.type === "manual" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {p.type === "manual" ? "Manual Entry" : "Uploaded File"}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  {p.type === "manual" ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {p.rightEye && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Right Eye (OD)</p>
                          <p className="text-gray-600">SPH: {p.rightEye.sph ?? "—"} | CYL: {p.rightEye.cyl ?? "—"} | Axis: {p.rightEye.axis ?? "—"} | {p.rightEye.visionType}</p>
                        </div>
                      )}
                      {p.leftEye && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Left Eye (OS)</p>
                          <p className="text-gray-600">SPH: {p.leftEye.sph ?? "—"} | CYL: {p.leftEye.cyl ?? "—"} | Axis: {p.leftEye.axis ?? "—"} | {p.leftEye.visionType}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">📎 {p.fileName || "Uploaded file"}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Orders</h2>
            <Link
              href={`/orders/new?patientId=${patient._id}&patientName=${encodeURIComponent(patient.name)}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Order
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
              <p className="text-3xl mb-2">📦</p>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o: any) => (
                <Link key={o._id} href={`/orders/${o._id}`} className="block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Order #{o._id.slice(-6).toUpperCase()}</p>
                      <p className="text-gray-500 text-xs mt-1">{new Date(o.createdAt).toLocaleDateString()} · ₹{o.totalAmount}</p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"}`}>
                      {o.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Prescription File Upload Component ────────────────────────────────────────
function PrescriptionFileUpload({
  fileUrl,
  fileName,
  onUpload,
  onClear,
}: {
  fileUrl: string
  fileName: string
  onUpload: (url: string, name: string) => void
  onClear: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError("File must be under 10MB"); return }
    setError("")
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "kasturi_eye_unsigned")

      // Use image endpoint for images, raw for PDFs
      const resourceType = file.type === "application/pdf" ? "raw" : "image"
      const res = await fetch(`https://api.cloudinary.com/v1_1/mediaflows/${resourceType}/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        onUpload(data.secure_url, file.name)
      } else {
        const errMsg = data.error?.message || "Upload failed"
        setError(errMsg)
      }
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  if (fileUrl) {
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName) || fileUrl.includes("image")
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-green-700">✅ File uploaded</span>
          <button type="button" onClick={onClear} className="text-xs text-red-500 hover:underline">Remove</button>
        </div>
        {isImage ? (
          <img src={fileUrl} alt={fileName} className="max-h-48 rounded-lg border border-green-200 object-contain" />
        ) : (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            📎 {fileName}
          </a>
        )}
      </div>
    )
  }

  return (
    <div>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture={undefined}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {uploading ? (
        <div className="flex items-center gap-3 border border-blue-200 bg-blue-50 rounded-xl p-4">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-600">Uploading...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Gallery / File picker */}
          <button
            type="button"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.removeAttribute("capture")
                fileRef.current.click()
              }
            }}
            className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <span className="text-3xl">🖼️</span>
            <span className="text-sm font-medium text-gray-700">Gallery / File</span>
            <span className="text-xs text-gray-400">Image or PDF</span>
          </button>

          {/* Camera (mobile) */}
          <button
            type="button"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.setAttribute("capture", "environment")
                fileRef.current.click()
              }
            }}
            className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <span className="text-3xl">📷</span>
            <span className="text-sm font-medium text-gray-700">Camera</span>
            <span className="text-xs text-gray-400">Take a photo</span>
          </button>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">Supports JPEG, PNG, WebP, PDF · max 10MB</p>
    </div>
  )
}
