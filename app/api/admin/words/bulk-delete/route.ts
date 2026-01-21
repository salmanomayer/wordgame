import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { ids } = await request.json()

      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "No IDs provided" }, { status: 400 })
      }

      // Use ANY to delete multiple IDs in one query
      const { rowCount } = await adminDb.query(
        "DELETE FROM words WHERE id = ANY($1)",
        [ids]
      )

      return NextResponse.json({ success: true, count: rowCount })
    } catch (error) {
      console.error("[v0] Bulk delete words error:", error)
      return NextResponse.json({ error: "Failed to delete words" }, { status: 500 })
    }
  })
}