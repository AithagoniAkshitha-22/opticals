"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api"

const TYPE_LABELS: Record<string, string> = {
  frame: "Frame Brands",
  lens: "Lens Brands",
  drop: "Eye Drop Brands",
  tablet: "Tablet Brands",
}

const TYPE_COLORS: Record<string, string> = {
  frame: "bg-blue-50 text-blue-700 border-blue-200",
  lens: "bg-purple-50 text-purple-700 border-purple-200",
  drop: "bg-green-50 text-green-700 border-green-200",
  tablet: "bg-orange-50 text-orange-700 border-orange-200",
}

export default function BrandsClient({ initialFrameBrands, initialLensBrands, initialDropBrands, initialTabletBrands }: {
  initialFrameBrands: any[]; initialLensBrands: any[]; initialDropBrands: any[]; initialTabletBrands: any[]
}) {
  const [frameBrands, setFrameBrands] = useState(initialFrameBrands)
  const [lensBrands, setLensBrands] = useState(initialLensBrands)
  const [dropBrands, setDropBrands] = useState(initialDropBrands)
  const [tabletBrands, setTabletBrands] = useState(initialTabletBrands)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<"frame" | "lens" | "drop" | "tablet">("frame")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [open, setOpen] = useState<Record<string, boolean>>({ frame: false, lens: false, drop: false })

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(""), 3000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(""), 3000) }
  }

  const addBrand = async () => {
    if (!newName.trim()) { flash("Brand name is required", true); return }
    setSaving(true)
    try {
      const res = await apiClient.createBrand({ name: newName.trim(), type: newType })
      if (res.success && res.data) {
        if (newType === "frame") setFrameBrands(p => [...p, res.data])
        else if (newType === "lens") setLensBrands(p => [...p, res.data])
        else if (newType === "drop") setDropBrands(p => [...p, res.data])
        else setTabletBrands(p => [...p, res.data])
        setNewName("")
        flash(`"${res.data.name}" added!`)
      } else flash(res.error || "Failed to add brand", true)
    } catch (e: any) { flash(e.message, true) }
    finally { setSaving(false) }
  }

  const saveBrand = async (id: string, type: "frame" | "lens" | "drop" | "tablet") => {
    if (!editName.trim()) { flash("Brand name is required", true); return }
    setSaving(true)
    try {
      const res = await apiClient.updateBrand(id, editName.trim())
      if (res.success && res.data) {
        const updater = (list: any[]) => list.map(b => b._id === id ? { ...b, name: editName.trim() } : b)
        if (type === "frame") setFrameBrands(updater)
        else if (type === "lens") setLensBrands(updater)
        else if (type === "drop") setDropBrands(updater)
        else setTabletBrands(updater)
        setEditId(null)
        flash("Brand updated!")
      } else flash(res.error || "Failed to update", true)
    } catch (e: any) { flash(e.message, true) }
    finally { setSaving(false) }
  }

  const deleteBrand = async (id: string, type: "frame" | "lens" | "drop" | "tablet") => {
    if (!confirm("Delete this brand? This cannot be undone.")) return
    try {
      const res = await apiClient.deleteBrand(id)
      if (res.success) {
        const remove = (list: any[]) => list.filter(b => b._id !== id)
        if (type === "frame") setFrameBrands(remove)
        else if (type === "lens") setLensBrands(remove)
        else if (type === "drop") setDropBrands(remove)
        else setTabletBrands(remove)
        flash("Brand deleted!")
      } else flash(res.error || "Failed to delete", true)
    } catch (e: any) { flash(e.message, true) }
  }

  const BrandList = ({ brands, type }: { brands: any[]; type: "frame" | "lens" | "drop" | "tablet" }) => {
    const isOpen = open[type]
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Collapsible Header */}
        <button
          type="button"
          onClick={() => setOpen(p => ({ ...p, [type]: !p[type] }))}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLORS[type]}`}>
              {brands.length}
            </span>
            <span className="font-semibold text-gray-800">{TYPE_LABELS[type]}</span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible Body */}
        {isOpen && (
          <div className="border-t border-gray-100">
            {brands.length === 0 ? (
              <p className="text-gray-400 text-sm px-5 py-4">No {TYPE_LABELS[type].toLowerCase()} yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 overflow-y-auto" style={{ maxHeight: '240px' }}>
                {brands.map((b) => (
                  <div key={b._id} className="flex items-center justify-between px-5 py-3">
                    {editId === b._id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveBrand(b._id, type)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button onClick={() => saveBrand(b._id, type)} disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                          Save
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-gray-800">{b.name}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditId(b._id); setEditName(b.name) }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                          <button onClick={() => deleteBrand(b._id, type)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Delete">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      {/* Add Brand */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Add New Brand</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBrand()}
            placeholder="Brand name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            {(["frame", "lens", "drop", "tablet"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  newType === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t === "frame" ? "Frame" : t === "lens" ? "Lens" : t === "drop" ? "Eye Drop" : "Tablet"}
              </button>
            ))}
          </div>
          <button
            onClick={addBrand}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Adding..." : "Add Brand"}
          </button>
        </div>
      </div>

      {/* Brand Lists — all 3 in a responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BrandList brands={frameBrands} type="frame" />
        <BrandList brands={lensBrands} type="lens" />
        <BrandList brands={dropBrands} type="drop" />
        <BrandList brands={tabletBrands} type="tablet" />
      </div>
    </div>
  )
}
