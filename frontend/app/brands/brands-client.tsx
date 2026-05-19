"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api"

export default function BrandsClient({ initialFrameBrands, initialLensBrands }: { initialFrameBrands: any[]; initialLensBrands: any[] }) {
  const [frameBrands, setFrameBrands] = useState(initialFrameBrands)
  const [lensBrands, setLensBrands] = useState(initialLensBrands)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<"frame" | "lens">("frame")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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
        if (newType === "frame") setFrameBrands([...frameBrands, res.data])
        else setLensBrands([...lensBrands, res.data])
        setNewName("")
        flash(`${newType} brand "${res.data.name}" added!`)
      } else flash(res.error || "Failed to add brand", true)
    } catch (e: any) { flash(e.message, true) }
    finally { setSaving(false) }
  }

  const saveBrand = async (id: string, type: "frame" | "lens") => {
    if (!editName.trim()) { flash("Brand name is required", true); return }
    setSaving(true)
    try {
      const res = await apiClient.updateBrand(id, editName.trim())
      if (res.success && res.data) {
        if (type === "frame") setFrameBrands(frameBrands.map((b) => b._id === id ? { ...b, name: editName.trim() } : b))
        else setLensBrands(lensBrands.map((b) => b._id === id ? { ...b, name: editName.trim() } : b))
        setEditId(null)
        flash("Brand updated!")
      } else flash(res.error || "Failed to update", true)
    } catch (e: any) { flash(e.message, true) }
    finally { setSaving(false) }
  }

  const BrandList = ({ brands, type }: { brands: any[]; type: "frame" | "lens" }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-4 capitalize">{type} Brands ({brands.length})</h2>
      {brands.length === 0 ? (
        <p className="text-gray-400 text-sm">No {type} brands yet. Add one below.</p>
      ) : (
        <div className="space-y-2">
          {brands.map((b) => (
            <div key={b._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              {editId === b._id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button onClick={() => saveBrand(b._id, type)} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">Save</button>
                  <button onClick={() => setEditId(null)} className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-800">{b.name}</span>
                  <button onClick={() => { setEditId(b._id); setEditName(b.name) }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      {/* Add Brand */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Add New Brand</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBrand()}
            placeholder="Brand name"
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as "frame" | "lens")}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="frame">Frame Brand</option>
            <option value="lens">Lens Brand</option>
          </select>
          <button
            onClick={addBrand}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Adding..." : "Add Brand"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BrandList brands={frameBrands} type="frame" />
        <BrandList brands={lensBrands} type="lens" />
      </div>
    </div>
  )
}
