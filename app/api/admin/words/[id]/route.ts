import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      await adminDb.query("DELETE FROM words WHERE id = $1", [id])

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Word delete error:", error)
      return NextResponse.json({ error: "Failed to delete word" }, { status: 500 })
    }
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const { word, hint, subject_id, is_active } = await request.json()

      const { rows } = await adminDb.query(
        "UPDATE words SET word = $1, hint = $2, subject_id = $3, is_active = $4, updated_at = NOW() WHERE id = $5 RETURNING *",
        [String(word).toUpperCase(), hint, subject_id, is_active, id],
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: "Word not found" }, { status: 404 })
      }

      return NextResponse.json(rows[0])
    } catch (error) {
      console.error("[v0] Word update error:", error)
      return NextResponse.json({ error: "Failed to update word" }, { status: 500 })
    }
  })
}
