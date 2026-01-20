import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await context.params
      const { is_active } = await request.json()
      const { error } = await adminDb.query("UPDATE players SET is_active = $1 WHERE id = $2", [is_active, id])
      if (error) throw error

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Player status update error:", error)
      return NextResponse.json({ error: "Failed to update player status" }, { status: 500 })
    }
  })
}
