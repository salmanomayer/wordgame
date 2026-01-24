import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const { display_name, email, phone_number, employee_id } = await request.json()
      
      const cleanEmployeeId = employee_id ? String(employee_id).trim().toUpperCase() : null

      const { rows } = await adminDb.query(
        `UPDATE players 
         SET display_name = COALESCE($1, display_name),
             email = COALESCE($2, email),
             phone_number = COALESCE($3, phone_number),
             employee_id = COALESCE($4, employee_id),
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, display_name, email, phone_number, is_active, created_at, employee_id`,
        [display_name, email, phone_number, cleanEmployeeId, id]
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: "Player not found" }, { status: 404 })
      }

      return NextResponse.json(rows[0])
    } catch (error: any) {
      console.error("[v0] Update player error:", error)
      if (error.code === '23505') {
          return NextResponse.json({ error: "Email or Phone already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to update player" }, { status: 500 })
    }
  })
}

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
