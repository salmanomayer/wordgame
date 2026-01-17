"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect /play/random to /play/dashboard
export default function RandomPlayPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/play/dashboard")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900">
      <div className="text-lg text-white">Redirecting...</div>
    </div>
  )
}
