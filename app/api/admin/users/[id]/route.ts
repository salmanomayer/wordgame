import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { adminDb } from "@/lib/supabase/admin"
import { requireAdminWithPermission } from "@/lib/admin-middleware"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const result = await requireAdminWithPermission(request, "admins", "can_update")
  if (result instanceof NextResponse) return result

  try {
    const { id } = await context.params;
    const { email, password, role } = await request.json()

    const updateData: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (email) {
      updateData.push(`email = $${paramIndex}`)
      params.push(email)
      paramIndex++
    }
    if (role) {
      updateData.push(`role = $${paramIndex}`)
      params.push(role)
      paramIndex++
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10)
      updateData.push(`password_hash = $${paramIndex}`)
      params.push(passwordHash)
      paramIndex++
    }

    if (updateData.length === 0) {
      return NextResponse.json({ message: "No update data provided" }, { status: 400 })
    }

    params.push(id) // Add id as the last parameter

    const { rows, error } = await adminDb.query(
      `UPDATE admin_users SET ${updateData.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, role`,
      params
    )

    if (error) throw error
    if (rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json({ user: rows[0] })
  } catch (error) {
    console.error("Failed to update admin user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const result = await requireAdminWithPermission(request, "admins", "can_delete")
  if (result instanceof NextResponse) return result

  try {
    const { id } = await context.params;
    const { error } = await adminDb.query("DELETE FROM admin_users WHERE id = $1", [id])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete admin user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
