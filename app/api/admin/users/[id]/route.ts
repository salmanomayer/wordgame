import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminWithPermission } from "@/lib/admin-middleware"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdminWithPermission(request, "admins", "can_update")
  if (result instanceof NextResponse) return result

  try {
    const { email, password, role } = await request.json()
    const supabase = createAdminClient()

    const updateData: any = { email, role }

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    const { data, error } = await supabase.from("admin_users").update(updateData).eq("id", params.id).select().single()

    if (error) throw error

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error("Failed to update admin user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdminWithPermission(request, "admins", "can_delete")
  if (result instanceof NextResponse) return result

  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from("admin_users").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete admin user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
