import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"
import { logAdminAction } from "@/lib/admin-audit"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { rows: subjects, error } = await adminDb.query(
        "SELECT * FROM subjects ORDER BY created_at DESC"
      )

      if (error) throw error

      return NextResponse.json(subjects)
    } catch (error) {
      console.error("[v0] Subjects fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { name, description, is_active } = await req.json()
      const { rows, error } = await adminDb.query(
        "INSERT INTO subjects (name, description, is_active) VALUES ($1, $2, $3) RETURNING *",
        [name, description, is_active]
      )

      if (error) throw error

      const data = rows[0]

      if (admin?.id) {
        await logAdminAction({
          adminId: admin.id,
          action: "CREATE",
          resourceType: "SUBJECT",
          resourceId: data.id,
          details: { name, description, is_active }
        })
      }

      return NextResponse.json(data)
    } catch (error) {
      console.error("[v0] Subject create error:", error)
      return NextResponse.json({ error: "Failed to create subject" }, { status: 500 })
    }
  })
}
