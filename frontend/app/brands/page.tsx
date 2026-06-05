"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import BrandsClient from "./brands-client"

export default function BrandsPage() {
  const [frameBrands, setFrameBrands] = useState<any[]>([])
  const [lensBrands, setLensBrands] = useState<any[]>([])
  const [dropBrands, setDropBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([apiClient.getBrands("frame"), apiClient.getBrands("lens"), apiClient.getBrands("drop")])
      .then(([fr, lr, dr]) => {
        if (fr.success) setFrameBrands(fr.data || [])
        if (lr.success) setLensBrands(lr.data || [])
        if (dr.success) setDropBrands(dr.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-8 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Brands Management</h1>
        </div>
        <div className="text-center py-16 text-gray-400">Loading brands...</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col px-4 pt-4 pb-2 max-w-4xl mx-auto overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Brands Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage frame, lens and eye drop brands used in orders</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <BrandsClient initialFrameBrands={frameBrands} initialLensBrands={lensBrands} initialDropBrands={dropBrands} />
      </div>
    </div>
  )
}
