import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const { error } = await adminDb.query("UPDATE players SET is_active = TRUE WHERE id = $1", [id])
      if (error) throw error

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Activation error:", error)
      return NextResponse.json({ error: "Failed to activate user" }, { status: 500 })
    }
  })
}
