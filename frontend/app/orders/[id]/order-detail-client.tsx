"use client"

import { useState, useEffect, useCallback } from "react"
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

const STATUS_FLOW = ["Ordered", "Processing", "Ready for Pickup", "Delivered"]

export default function OrderDetailClient({ order: initialOrder }: { order: any }) {
  const [order, setOrder] = useState(initialOrder)
  const [updating, setUpdating] = useState(false)
  const [whatsappSending, setWhatsappSending] = useState(false)
  const [whatsappUrl, setWhatsappUrl] = useState("")
  const [msg, setMsg] = useState("")
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState("")

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightboxSrc(src)
    setLightboxAlt(alt)
  }, [])

  const closeLightbox = useCallback(() => setLightboxSrc(null), [])

  const patient = order.patientId as any

  const updateStatus = async (status: string) => {
    setUpdating(true)
    try {
      const res = await apiClient.updateOrderStatus(order._id, status)
      if (res.success && res.data) { setOrder(res.data); setMsg("Status updated!") }
      else setMsg(res.error || "Failed to update")
    } catch (e: any) { setMsg(e.message) }
    finally { setUpdating(false); setTimeout(() => setMsg(""), 3000) }
  }

  const sendWhatsApp = async () => {
    setWhatsappSending(true)
    try {
      const res = await apiClient.logWhatsApp(order._id, "staff")
      if (res.success && res.data) {
        setWhatsappUrl(res.data.whatsappUrl)
        window.open(res.data.whatsappUrl, "_blank")
        setMsg("WhatsApp opened!")
      }
    } catch (e: any) { setMsg(e.message) }
    finally { setWhatsappSending(false); setTimeout(() => setMsg(""), 3000) }
  }

  const printInvoice = () => window.print()

  const currentIdx = STATUS_FLOW.indexOf(order.status)

  return (
    <div className="space-y-6">
      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt={lightboxAlt} onClose={closeLightbox} />}
      {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{msg}</div>}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <p className="text-gray-500 text-sm mt-1">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
              {order.isDelayed && order.status !== "Delivered" ? "⚠️ " : ""}{order.status}
            </span>
            {order.status === "Ready for Pickup" && (
              <button
                onClick={sendWhatsApp}
                disabled={whatsappSending}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <span>📱</span> Send WhatsApp
              </button>
            )}
            <button
              onClick={printInvoice}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              🖨️ Invoice
            </button>
          </div>
        </div>

        {/* Status Progress */}
        {order.status !== "Delivered" && (
          <div className="mt-6">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase">Update Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FLOW.map((s, i) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updating || order.status === "Delivered" || i <= currentIdx}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    order.status === s
                      ? "bg-blue-600 text-white border-blue-600"
                      : i <= currentIdx
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Patient Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Patient Details</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: "Name", value: patient?.name },
            { label: "Phone", value: patient?.phone },
            { label: "Age", value: patient?.age },
            { label: "Doctor", value: order.doctorName },
            { label: "Address", value: patient?.address },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="text-gray-500 w-20 flex-shrink-0">{item.label} :</span>
              <span className="font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
        <Link href={`/patients/${patient?._id}`} className="text-blue-600 text-sm hover:underline mt-3 inline-block">View Patient Profile →</Link>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.frames?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Frames</p>
              {order.frames.map((f: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 text-sm gap-4">
                  <div className="flex items-center gap-3">
                    {f.imageUrl ? (
                      <button
                        onClick={() => openLightbox(f.imageUrl, f.brand)}
                        className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
                        aria-label={`View full image of ${f.brand}`}
                      >
                        <img
                          src={f.imageUrl}
                          alt={f.brand}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-80 transition-opacity"
                        />
                      </button>
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <span className="text-gray-800 font-medium">{f.brand}</span>
                  </div>
                  <span className="text-gray-500">Qty: {f.quantity}</span>
                </div>
              ))}
            </div>
          )}
          {order.lenses?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Lenses</p>
              {order.lenses.map((l: any, i: number) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-800">{l.brand}</span>
                  <span className="text-gray-500">{l.powerDetails}</span>
                </div>
              ))}
            </div>
          )}
          {order.drops?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Eye Drops</p>
              {order.drops.map((d: any, i: number) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-800">{d.name}</span>
                  <span className="text-gray-500">Qty: {d.quantity}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between pt-3 font-semibold text-gray-900">
            <span>Total Amount</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* WhatsApp Logs */}
      {order.whatsappLogs?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">WhatsApp Notifications</h2>
          <div className="space-y-2">
            {order.whatsappLogs.map((log: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-600">Sent by: <span className="font-medium">{log.sentBy}</span></span>
                <span className="text-gray-400">{new Date(log.sentAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Invoice */}
      <div id="invoice" className="hidden print:block bg-white p-8 text-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Kasturi Eye Hospitals</h1>
          <p className="text-gray-500">Invoice</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p><strong>Patient:</strong> {patient?.name}</p>
            <p><strong>Phone:</strong> {patient?.phone}</p>
            <p><strong>Address:</strong> {patient?.address}</p>
          </div>
          <div className="text-right">
            <p><strong>Doctor:</strong> {order.doctorName}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Order #:</strong> {order._id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <table className="w-full border-collapse mb-6">
          <thead><tr className="border-b-2 border-gray-300"><th className="text-left py-2">Item</th><th className="text-left py-2">Details</th><th className="text-right py-2">Qty</th></tr></thead>
          <tbody>
            {order.frames?.map((f: any, i: number) => <tr key={i} className="border-b border-gray-100"><td className="py-2">Frame</td><td className="py-2">{f.brand}</td><td className="py-2 text-right">{f.quantity}</td></tr>)}
            {order.lenses?.map((l: any, i: number) => <tr key={i} className="border-b border-gray-100"><td className="py-2">Lens</td><td className="py-2">{l.brand} — {l.powerDetails}</td><td className="py-2 text-right">1</td></tr>)}
            {order.drops?.map((d: any, i: number) => <tr key={i} className="border-b border-gray-100"><td className="py-2">Eye Drop</td><td className="py-2">{d.name}</td><td className="py-2 text-right">{d.quantity}</td></tr>)}
          </tbody>
        </table>
        <div className="text-right text-lg font-bold">Total: ₹{order.totalAmount}</div>
      </div>
    </div>
  )
}
