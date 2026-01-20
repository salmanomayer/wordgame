import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const { rows } = await adminDb.query(
        "SELECT * FROM player_logs WHERE player_id = $1 ORDER BY created_at DESC LIMIT 100",
        [id]
      )
      return NextResponse.json(rows || [])
    } catch (error) {
      console.error("[v0] Player logs fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch player logs" }, { status: 500 })
    }
  })
}
