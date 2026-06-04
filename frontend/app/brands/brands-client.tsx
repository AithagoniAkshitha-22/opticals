"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api"

const TYPE_LABELS: Record<string, string> = {
  frame: "Frame Brands",
  lens: "Lens Brands",
  drop: "Eye Drop Brands",
}

const TYPE_COLORS: Record<string, string> = {
  frame: "bg-blue-50 text-blue-700 border-blue-200",
  lens: "bg-purple-50 text-purple-700 border-purple-200",
  drop: "bg-green-50 text-green-700 border-green-200",
}

export default function BrandsClient({ initialFrameBrands, initialLensBrands, initialDropBrands }: {
  initialFrameBrands: any[]; initialLensBrands: any[]; initialDropBrands: any[]
}) {
  const [frameBrands, setFrameBrands] = useState(initialFrameBrands)
  const [lensBrands, setLensBrands] = useState(initialLensBrands)
  const [dropBrands, setDropBrands] = useState(initialDropBrands)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<"frame" | "lens" | "drop">("frame")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [open, setOpen] = useState<Record<string, boolean>>({ frame: true, lens: true, drop: true })

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
        else setDropBrands(p => [...p, res.data])
        setNewName("")
        flash(`"${res.data.name}" added!`)
      } else flash(res.error || "Failed to add brand", true)
    } catch (e: any) { flash(e.message, true) }
    finally { setSaving(false) }
  }

  const saveBrand = async (id: string, type: "frame" | "lens" | "drop") => {
    if (!editName.trim()) { flash("Brand name is required", true); return }
    setSaving(true)
    try {
      const res = await apiClient.updateBrand(id, editName.trim())
      if (res.success && res.data) {
        const updater = (list: any[]) => list.map(b => b._id === id ? { ...b, name: editName.trim() } : b)
        if (type === "frame") setFrameBrands(updater)
        else if (type === "lens") setLensBrands(updater)
        else setDropBrands(updater)
        setEditId(null)
        flash("Brand updated!")
      } else flash(res.error || "Failed to update", true)
    } catch (e: any) { flash(e.message, true) }
    finally { setSaving(false) }
  }

  const BrandList = ({ brands, type }: { brands: any[]; type: "frame" | "lens" | "drop" }) => {
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
              <div className="divide-y divide-gray-100">
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
                        <button
                          onClick={() => { setEditId(b._id); setEditName(b.name) }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-4 flex-shrink-0"
                        >
                          Edit
                        </button>
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
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBrand()}
            placeholder="Brand name"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as "frame" | "lens" | "drop")}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-40"
          >
            <option value="frame">Frame Brand</option>
            <option value="lens">Lens Brand</option>
            <option value="drop">Eye Drop</option>
          </select>
          <button
            onClick={addBrand}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {saving ? "Adding..." : "Add Brand"}
          </button>
        </div>
      </div>

      {/* Brand Lists — all 3 in a responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BrandList brands={frameBrands} type="frame" />
        <BrandList brands={lensBrands} type="lens" />
        <BrandList brands={dropBrands} type="drop" />
      </div>
    </div>
  )
}
