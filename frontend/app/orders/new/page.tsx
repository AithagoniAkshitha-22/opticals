"use client"

import { Suspense } from "react"
import NewOrderForm from "./new-order-form"

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-400">Loading...</div>
    }>
      <NewOrderForm />
    </Suspense>
  )
}
