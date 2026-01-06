import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/supabase/admin"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const { error } = await adminDb.query("DELETE FROM players WHERE id = $1", [id])
      if (error) throw error

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Player delete error:", error)
      return NextResponse.json({ error: "Failed to delete player" }, { status: 500 })
    }
  })
}
