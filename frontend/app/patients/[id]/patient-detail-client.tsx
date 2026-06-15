"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { apiClient } from "@/lib/api"

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-3xl font-light leading-none hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          ×
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  )
}

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
    rightEye: { dv: { sph: "", cyl: "", axis: "", va: "" }, nv: { sph: "", cyl: "", axis: "", va: "" } },
    leftEye:  { dv: { sph: "", cyl: "", axis: "", va: "" }, nv: { sph: "", cyl: "", axis: "", va: "" } },
    fileUrl: "",
    fileName: "",
  })
  const [prescList, setPrescList] = useState(prescriptions)
  const [saving, setSaving] = useState(false)
  const [prescError, setPrescError] = useState("")
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const openLightbox = useCallback((src: string) => setLightboxSrc(src), [])
  const closeLightbox = useCallback(() => setLightboxSrc(null), [])

  const savePrescription = async () => {
    setPrescError("")
    setSaving(true)
    try {
      const num = (v: string) => (v ? Number(v) : null)
      const payload: any = { patientId: patient._id, type: prescType }
      if (prescType === "manual") {
        payload.rightEye = {
          dv: { sph: num(prescData.rightEye.dv.sph), cyl: num(prescData.rightEye.dv.cyl), axis: num(prescData.rightEye.dv.axis), va: prescData.rightEye.dv.va },
          nv: { sph: num(prescData.rightEye.nv.sph), cyl: num(prescData.rightEye.nv.cyl), axis: num(prescData.rightEye.nv.axis), va: prescData.rightEye.nv.va },
        }
        payload.leftEye = {
          dv: { sph: num(prescData.leftEye.dv.sph), cyl: num(prescData.leftEye.dv.cyl), axis: num(prescData.leftEye.dv.axis), va: prescData.leftEye.dv.va },
          nv: { sph: num(prescData.leftEye.nv.sph), cyl: num(prescData.leftEye.nv.cyl), axis: num(prescData.leftEye.nv.axis), va: prescData.leftEye.nv.va },
        }
      } else {
        if (!prescData.fileUrl) { setPrescError("File URL is required"); setSaving(false); return }
        payload.fileUrl = prescData.fileUrl
        payload.fileName = prescData.fileName
      }
      const res = await apiClient.createPrescription(payload)
      if (res.success) {
        setPrescList([res.data, ...prescList])
        // Reset form to empty
        setPrescData({
          rightEye: { dv: { sph: "", cyl: "", axis: "", va: "" }, nv: { sph: "", cyl: "", axis: "", va: "" } },
          leftEye:  { dv: { sph: "", cyl: "", axis: "", va: "" }, nv: { sph: "", cyl: "", axis: "", va: "" } },
          fileUrl: "", fileName: "",
        })
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
      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Prescription" onClose={closeLightbox} />}
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
          </div>

          {/* Always-visible manual entry table */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-sm">New Prescription</h3>
              <div className="flex gap-2">
                {(["manual", "upload"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPrescType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      prescType === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {t === "manual" ? "Manual Entry" : "Upload File"}
                  </button>
                ))}
              </div>
            </div>

            {prescError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm mb-4">{prescError}</div>}

            {prescType === "manual" ? (
              <>
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
                            <React.Fragment key={eye}>
                              {(["sph","cyl","axis","va"] as const).map((field, fieldIdx) => (
                                <td key={`${eye}-${field}`} className={`py-1 px-1 ${eyeIdx === 0 && fieldIdx === 3 ? "border-r-2 border-gray-300" : ""}`}>
                                  <input
                                    type={field === "va" ? "text" : "number"}
                                    step={field === "axis" ? "1" : "0.25"}
                                    placeholder="-"
                                    value={(prescData[eye][row] as any)[field]}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setPrescData(prev => ({
                                        ...prev,
                                        [eye]: { ...prev[eye], [row]: { ...(prev[eye][row] as any), [field]: val } }
                                      }))
                                    }}
                                    className="w-full text-center bg-transparent border-0 border-b border-gray-300 focus:border-blue-500 focus:outline-none text-sm py-1 min-w-[40px]"
                                  />
                                </td>
                              ))}
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={savePrescription}
                  disabled={saving}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? "Saving..." : "+ Add Prescription"}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <PrescriptionFileUpload
                  fileUrl={prescData.fileUrl}
                  fileName={prescData.fileName}
                  onUpload={(url, name) => setPrescData({ ...prescData, fileUrl: url, fileName: name })}
                  onClear={() => setPrescData({ ...prescData, fileUrl: "", fileName: "" })}
                />
                {prescData.fileUrl && (
                  <button onClick={savePrescription} disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                    {saving ? "Saving..." : "+ Add Prescription"}
                  </button>
                )}
              </div>
            )}
          </div>

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
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this prescription? This cannot be undone.")) return
                          try {
                            const res = await apiClient.deletePrescription(p._id)
                            if (res.success) setPrescList((prev: any[]) => prev.filter((x: any) => x._id !== p._id))
                          } catch (e) { console.error(e) }
                        }}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Delete prescription">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {p.type === "manual" ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            <th className="w-12"></th>
                            <th colSpan={4} className="text-center py-1.5 text-blue-700 font-bold border-b-2 border-blue-200 bg-blue-50">R</th>
                            <th colSpan={4} className="text-center py-1.5 text-green-700 font-bold border-b-2 border-green-200 bg-green-50">L</th>
                          </tr>
                          <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                            <th className="py-1.5 px-1"></th>
                            {["SPH","CYL","AXIS","VA","SPH","CYL","AXIS","VA"].map((h,i) => (
                              <th key={i} className={`py-1.5 px-2 font-medium text-center ${i === 3 ? "border-r-2 border-gray-200" : ""}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {["dv","nv"].map(row => (
                            <tr key={row} className="border-t border-gray-100">
                              <td className="py-1 px-2 font-bold text-gray-600 whitespace-nowrap">{row === "dv" ? "D.V." : "N.V."}</td>
                              {(["rightEye","leftEye"] as const).map((eye, eyeIdx) => (
                                (["sph","cyl","axis","va"] as const).map((field, fieldIdx) => (
                                  <td key={`${eye}-${field}`} className={`py-1 px-2 text-center text-gray-700 ${eyeIdx === 0 && fieldIdx === 3 ? "border-r-2 border-gray-200" : ""}`}>
                                    {p[eye]?.[row]?.[field] != null && p[eye]?.[row]?.[field] !== ""
                                      ? p[eye][row][field]
                                      : (field !== "va" && p[eye]?.[field] != null ? p[eye][field] : "—")}
                                  </td>
                                ))
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : p.fileUrl ? (
                    <div>
                      {!p.fileUrl.includes('/raw/') && !/\.pdf$/i.test(p.fileUrl) ? (
                        <button
                          onClick={() => openLightbox(p.fileUrl)}
                          className="block focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
                          aria-label="View full prescription image"
                        >
                          <img src={p.fileUrl} alt="Prescription" className="max-h-48 w-auto rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity" />
                        </button>
                      ) : (
                        <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                          <span>📎</span><span>{p.fileName || "View prescription"}</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No file</p>
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
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const res = await apiClient.uploadFile(base64, "kasturi-eye/prescriptions")
        if (res.success && res.data?.url) {
          onUpload(res.data.url, file.name)
        } else {
          setError(res.error || "Upload failed")
        }
        setUploading(false)
      }
      reader.onerror = () => { setError("Failed to read file"); setUploading(false) }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.message || "Upload failed")
      setUploading(false)
    }
  }

  if (fileUrl) {
    const isImage = !fileUrl.includes('/raw/') && !/\.pdf$/i.test(fileUrl)
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-green-700">✅ File uploaded</span>
          <button type="button" onClick={onClear} className="text-xs text-red-500 hover:underline">Remove</button>
        </div>
        {isImage ? (
          <button type="button" onClick={() => window.open(fileUrl, '_blank')}
            className="block w-full focus:outline-none cursor-zoom-in">
            <img src={fileUrl} alt={fileName} className="max-h-48 rounded-lg border border-green-200 object-contain hover:opacity-90 transition-opacity" />
            <p className="text-xs text-gray-400 mt-1 text-center">Tap to view full size</p>
          </button>
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
