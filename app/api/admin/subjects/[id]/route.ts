import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"
import { logAdminAction } from "@/lib/admin-audit"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { id } = await params
      const { name, description, is_active } = await req.json()
      const { rows, error } = await adminDb.query(
        "UPDATE subjects SET name = $1, description = $2, is_active = $3 WHERE id = $4 RETURNING *",
        [name, description, is_active, id]
      )
      if (error) throw error
      
      if (admin?.id) {
        await logAdminAction({
          adminId: admin.id,
          action: "UPDATE",
          resourceType: "SUBJECT",
          resourceId: id,
          details: { name, description, is_active }
        })
      }

      return NextResponse.json(rows[0])
    } catch (error) {
      console.error("[v0] Subject update error:", error)
      return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { id } = await params
      const { error } = await adminDb.query("DELETE FROM subjects WHERE id = $1", [id])
      if (error) throw error

      if (admin?.id) {
        await logAdminAction({
          adminId: admin.id,
          action: "DELETE",
          resourceType: "SUBJECT",
          resourceId: id
        })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Subject delete error:", error)
      return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 })
    }
  })
}
