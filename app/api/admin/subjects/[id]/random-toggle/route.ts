import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"
import { logAdminAction } from "@/lib/admin-audit"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { id } = await params
      const { is_random_active } = await req.json()

      const { rows, error } = await adminDb.query(
        "UPDATE subjects SET is_random_active = $1 WHERE id = $2 RETURNING *",
        [is_random_active, id]
      )

      if (error) throw error

      if (rows.length === 0) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 })
      }

      if (admin?.id) {
        await logAdminAction({
          adminId: admin.id,
          action: "UPDATE",
          resourceType: "SUBJECT",
          resourceId: id,
          details: { is_random_active, action_type: "TOGGLE_RANDOM_PLAY" }
        })
      }

      return NextResponse.json(rows[0])
    } catch (error) {
      console.error("[v0] Subject update error:", error)
      return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
    }
  })
}
