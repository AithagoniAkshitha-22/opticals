"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import BrandsClient from "./brands-client"

export default function BrandsPage() {
  const [frameBrands, setFrameBrands] = useState<any[]>([])
  const [lensBrands, setLensBrands] = useState<any[]>([])
  const [dropBrands, setDropBrands] = useState<any[]>([])
  const [tabletBrands, setTabletBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.getBrands("frame"),
      apiClient.getBrands("lens"),
      apiClient.getBrands("drop"),
      apiClient.getBrands("tablet"),
    ])
      .then(([fr, lr, dr, tr]) => {
        if (fr.success) setFrameBrands(fr.data || [])
        if (lr.success) setLensBrands(lr.data || [])
        if (dr.success) setDropBrands(dr.data || [])
        if (tr.success) setTabletBrands(tr.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-8">
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Brands Management</h1></div>
        <div className="text-center py-16 text-gray-400">Loading brands...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-24 md:pb-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Brands Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage frame, lens, eye drop and tablet brands</p>
      </div>
      <BrandsClient
        initialFrameBrands={frameBrands}
        initialLensBrands={lensBrands}
        initialDropBrands={dropBrands}
        initialTabletBrands={tabletBrands}
      />
    </div>
  )
}
