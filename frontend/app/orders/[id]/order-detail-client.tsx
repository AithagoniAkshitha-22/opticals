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

export default function OrderDetailClient({ order: initialOrder, prescription }: { order: any; prescription?: any }) {
  const [order, setOrder] = useState(initialOrder)
  const [updating, setUpdating] = useState(false)
  const [whatsappSending, setWhatsappSending] = useState(false)
  const [whatsappUrl, setWhatsappUrl] = useState("")
  const [msg, setMsg] = useState("")
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState("")
  const [editingPayment, setEditingPayment] = useState(false)
  const [newAmountPaid, setNewAmountPaid] = useState("")
  const [paymentUpdating, setPaymentUpdating] = useState(false)

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightboxSrc(src)
    setLightboxAlt(alt)
  }, [])

  const closeLightbox = useCallback(() => setLightboxSrc(null), [])

  const savePayment = async () => {
    const paid = Number(newAmountPaid) || 0
    if (paid > order.totalAmount) {
      setMsg(`Amount paid (₹${paid}) cannot exceed total amount (₹${order.totalAmount})`)
      setTimeout(() => setMsg(""), 4000)
      return
    }
    setPaymentUpdating(true)
    try {
      const res = await apiClient.updateOrderPayment(order._id, paid)
      if (res.success && res.data) { setOrder(res.data); setMsg("Payment updated!") }
      else setMsg(res.error || "Failed to update")
    } catch (e: any) { setMsg(e.message) }
    finally { setPaymentUpdating(false); setEditingPayment(false); setTimeout(() => setMsg(""), 3000) }
  }

  const patient = order.patientId as any

  const updateStatus = async (status: string) => {
    setUpdating(true)
    try {
      const res = await apiClient.updateOrderStatus(order._id, status)
      if (res.success && res.data) {
        setOrder(res.data)
        setMsg("Status updated!")
        if (status === "Delivered" && patient?.phone) {
          setTimeout(() => {
            if (window.confirm(`Send thank you WhatsApp message to ${patient.name}?`)) {
              const message =
                `Order Delivered! 🎉\nHi ${patient.name}, your glasses 👓 are delivered.\n🏥 Kasturi Eye Hospitals thanks you.\n😊 See you again soon!`
              window.open(`https://wa.me/91${patient.phone}?text=${encodeURIComponent(message)}`, "_blank")
            }
          }, 500)
        }
      } else setMsg(res.error || "Failed to update")
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

  const [pdfGenerating, setPdfGenerating] = useState(false)

  const sendInvoiceWhatsApp = async () => {
    try {
      setPdfGenerating(true)
      const html2pdf = (await import("html2pdf.js")).default
      const element = document.getElementById("invoice")
      if (!element) return

      const opt = {
        margin: 10,
        filename: `Invoice-${order._id.slice(-6).toUpperCase()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }

      if (navigator.share && navigator.canShare) {
        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf("blob")
        const file = new File([pdfBlob], `Invoice-${order._id.slice(-6).toUpperCase()}.pdf`, { type: "application/pdf" })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Invoice - Kasturi Eye Hospitals`, text: `Invoice for ${patient?.name}` })
          setMsg("PDF shared!")
          setTimeout(() => setMsg(""), 3000)
          return
        }
      }

      await html2pdf().set(opt).from(element).save()
      setMsg("PDF downloaded — attach it in WhatsApp")
      setTimeout(() => {
        const phone = patient?.phone?.replace(/\D/g, "")
        const itemLines = [
          ...(order.frames?.map((f: any) => `  - Frame: ${f.brand} x${f.quantity}`) || []),
          ...(order.lenses?.map((l: any) => `  - Lens: ${l.brand}${l.powerDetails ? ` (${l.powerDetails})` : ""}`) || []),
          ...(order.drops?.map((d: any) => `  - Eye Drop: ${d.name} x${d.quantity}`) || []),
        ].join("\n")
        const dueLine = order.dueAmount > 0 ? `\nDue: Rs.${order.dueAmount}` : ""
        const msg =
          `*Kasturi Eye Hospitals*\n` +
          `*Invoice - Order #${order._id.slice(-6).toUpperCase()}*\n` +
          `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}\n\n` +
          `Patient: ${patient?.name}\n` +
          `Phone: ${patient?.phone}\n` +
          `Doctor: ${order.doctorName}\n\n` +
          `*Items:*\n${itemLines}\n\n` +
          `Total: Rs.${order.totalAmount}\n` +
          `Paid: Rs.${order.amountPaid || 0}${dueLine}\n\n` +
          `_(Please find the PDF invoice attached)_`
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, "_blank")
        setTimeout(() => setMsg(""), 5000)
      }, 1000)

    } catch (e: any) {
      setMsg("Failed to generate PDF")
      setTimeout(() => setMsg(""), 3000)
    } finally {
      setPdfGenerating(false)
    }
  }

  const printInvoice = () => window.print()

  const currentIdx = STATUS_FLOW.indexOf(order.status)

  return (
    <div>
      {/* Screen content — hidden when printing */}
      <div className="space-y-6 print:hidden">
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
            <button
              onClick={sendInvoiceWhatsApp}
              disabled={pdfGenerating}
              className="border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {pdfGenerating ? "⏳ Generating..." : "📲 Send PDF Invoice"}
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
          <div className="flex justify-between pt-3 font-semibold text-gray-900 border-t border-gray-100">
            <span>Total Amount</span>
            <span>₹{order.totalAmount}</span>
          </div>

          {/* Amount Paid — editable */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Amount Paid</span>
            {editingPayment ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    value={newAmountPaid}
                    onChange={(e) => setNewAmountPaid(e.target.value)}
                    max={order.totalAmount}
                    className={`w-28 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${Number(newAmountPaid) > order.totalAmount ? "border-red-400 focus:ring-red-400" : "border-gray-300"}`}
                    autoFocus
                  />
                  {Number(newAmountPaid) > order.totalAmount && (
                    <span className="text-xs text-red-500">Exceeds total ₹{order.totalAmount}</span>
                  )}
                </div>
                <button onClick={savePayment} disabled={paymentUpdating || Number(newAmountPaid) > order.totalAmount}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1 rounded-lg text-xs font-medium">
                  {paymentUpdating ? "..." : "Save"}
                </button>
                <button onClick={() => setEditingPayment(false)}
                  className="border border-gray-300 text-gray-600 px-3 py-1 rounded-lg text-xs hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-medium">₹{order.amountPaid || 0}</span>
                {order.status !== "Delivered" && (
                  <button onClick={() => { setNewAmountPaid(String(order.amountPaid || 0)); setEditingPayment(true) }}
                    className="text-xs text-blue-600 hover:underline">Edit</button>
                )}
              </div>
            )}
          </div>

          {/* Due Amount */}
          <div className="flex justify-between text-sm font-semibold">
            <span className={order.dueAmount > 0 ? "text-orange-600" : "text-green-600"}>Due Amount</span>
            <span className={order.dueAmount > 0 ? "text-orange-600" : "text-green-600"}>
              ₹{order.dueAmount || 0}
            </span>
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

      </div>{/* end print:hidden */}

      {/* Printable Invoice — only this shows when printing */}
      <div id="invoice" className="hidden print:block bg-white" style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', padding: '32px', maxWidth: '680px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #1d4ed8', paddingBottom: '16px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1d4ed8', margin: 0 }}>Kasturi Eye Hospitals</h1>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>Invoice / Receipt</p>
        </div>

        {/* Order & Patient Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <p style={{ margin: '3px 0' }}><strong>Patient:</strong> {patient?.name}</p>
            <p style={{ margin: '3px 0' }}><strong>Phone:</strong> {patient?.phone}</p>
            <p style={{ margin: '3px 0' }}><strong>Address:</strong> {patient?.address}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '3px 0' }}><strong>Order #:</strong> {order._id.slice(-6).toUpperCase()}</p>
            <p style={{ margin: '3px 0' }}><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            <p style={{ margin: '3px 0' }}><strong>Doctor:</strong> {order.doctorName}</p>
          </div>
        </div>

        {/* Prescription Details — only if manual entry exists */}
        {prescription && (prescription.rightEye || prescription.leftEye) && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '10px', color: '#374151' }}>Prescription</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#eff6ff' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Eye</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>SPH</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>CYL</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>Axis</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>Vision</th>
                </tr>
              </thead>
              <tbody>
                {prescription.rightEye && (
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Right (OD)</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{prescription.rightEye.sph ?? '—'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{prescription.rightEye.cyl ?? '—'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{prescription.rightEye.axis ?? '—'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{prescription.rightEye.visionType || '—'}</td>
                  </tr>
                )}
                {prescription.leftEye && (
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Left (OS)</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{prescription.leftEye.sph ?? '—'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{prescription.leftEye.cyl ?? '—'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{prescription.leftEye.axis ?? '—'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{prescription.leftEye.visionType || '—'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#eff6ff', borderBottom: '2px solid #1d4ed8' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '12px' }}>Item</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '12px' }}>Details</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '12px' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {order.frames?.map((f: any, i: number) => (
              <tr key={`f${i}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '7px 10px' }}>Frame</td>
                <td style={{ padding: '7px 10px' }}>{f.brand}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{f.quantity}</td>
              </tr>
            ))}
            {order.lenses?.map((l: any, i: number) => (
              <tr key={`l${i}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '7px 10px' }}>Lens</td>
                <td style={{ padding: '7px 10px' }}>{l.brand}{l.powerDetails ? ` — ${l.powerDetails}` : ''}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>1</td>
              </tr>
            ))}
            {order.drops?.map((d: any, i: number) => (
              <tr key={`d${i}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '7px 10px' }}>Eye Drop</td>
                <td style={{ padding: '7px 10px' }}>{d.name}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{d.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Billing Summary */}
        <div style={{ marginLeft: 'auto', width: '240px', borderTop: '2px solid #1d4ed8', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
            <span>Total Amount</span><span>₹{order.totalAmount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#16a34a' }}>
            <span>Amount Paid</span><span>₹{order.amountPaid || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: order.dueAmount > 0 ? '#ea580c' : '#16a34a', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>
            <span>Due Amount</span><span>₹{order.dueAmount || 0}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '11px' }}>
          <p style={{ margin: 0 }}>Thank you for choosing Kasturi Eye Hospitals</p>
        </div>
      </div>
    </div>
  )
}
