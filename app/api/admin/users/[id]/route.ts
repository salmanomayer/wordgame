import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"
import { hash } from "bcryptjs"
import { logAdminAction } from "@/lib/admin-audit"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { id } = await params
      const { email, password, role, is_active } = await req.json()

      let query = "UPDATE admin_users SET email = COALESCE($1, email), is_active = COALESCE($2, is_active), role = COALESCE($3, role)"
      const queryParams: any[] = [email, is_active, role]
      let paramIndex = 4

      if (password) {
        const passwordHash = await hash(password, 10)
        query += `, password_hash = $${paramIndex}`
        queryParams.push(passwordHash)
        paramIndex++
      }

      query += `, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, email, role, is_active, created_at`
      queryParams.push(id)

      const { rows } = await adminDb.query(query, queryParams)

      if (rows.length === 0) {
        return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
      }

      if (admin?.id) {
        await logAdminAction({
          adminId: admin.id,
          action: "UPDATE",
          resourceType: "ADMIN_USER",
          resourceId: id,
          details: { email, role, is_active, password_changed: !!password }
        })
      }

      return NextResponse.json(rows[0])
    } catch (error: any) {
      console.error("[v0] Update admin user error:", error)
      if (error.code === '23505') {
          return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to update admin user" }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { id } = await params
      
      // Prevent deleting self
      if (admin?.id === id) {
          return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
      }

      const { rowCount } = await adminDb.query("DELETE FROM admin_users WHERE id = $1", [id])

      if (rowCount === 0) {
        return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
      }

      if (admin?.id) {
        await logAdminAction({
          adminId: admin.id,
          action: "DELETE",
          resourceType: "ADMIN_USER",
          resourceId: id
        })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Delete admin user error:", error)
      return NextResponse.json({ error: "Failed to delete admin user" }, { status: 500 })
    }
  })
}
