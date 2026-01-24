import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"
import { logAdminAction } from "@/lib/admin-audit"

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { ids } = await req.json()

      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "No IDs provided" }, { status: 400 })
      }

      await adminDb.query("DELETE FROM words WHERE id = ANY($1)", [ids])

      if (admin?.id) {
        await logAdminAction({
          adminId: admin.id,
          action: "DELETE",
          resourceType: "WORD",
          details: { count: ids.length, ids }
        })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Bulk delete error:", error)
      return NextResponse.json({ error: "Failed to delete words" }, { status: 500 })
    }
  })
}