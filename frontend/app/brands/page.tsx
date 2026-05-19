import { apiClient } from "@/lib/api"
import BrandsClient from "./brands-client"

export const dynamic = "force-dynamic"

export default async function BrandsPage() {
  let frameBrands: any[] = []
  let lensBrands: any[] = []
  try {
    const [fr, lr] = await Promise.all([apiClient.getBrands("frame"), apiClient.getBrands("lens")])
    if (fr.success) frameBrands = fr.data || []
    if (lr.success) lensBrands = lr.data || []
  } catch (e) { console.error(e) }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Brands Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage frame and lens brands used in orders</p>
      </div>
      <BrandsClient initialFrameBrands={frameBrands} initialLensBrands={lensBrands} />
    </div>
  )
}
