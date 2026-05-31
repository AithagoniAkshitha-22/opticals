"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import BrandsClient from "./brands-client"

export default function BrandsPage() {
  const [frameBrands, setFrameBrands] = useState<any[]>([])
  const [lensBrands, setLensBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([apiClient.getBrands("frame"), apiClient.getBrands("lens")])
      .then(([fr, lr]) => {
        if (fr.success) setFrameBrands(fr.data || [])
        if (lr.success) setLensBrands(lr.data || [])
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
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Brands Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage frame and lens brands used in orders</p>
      </div>
      <BrandsClient initialFrameBrands={frameBrands} initialLensBrands={lensBrands} />
    </div>
  )
}
