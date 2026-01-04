import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminWithPermission } from "@/lib/admin-middleware"

export async function GET(request: NextRequest) {
  const result = await requireAdminWithPermission(request, "admins", "can_read")
  if (result instanceof NextResponse) return result

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ users: data })
  } catch (error) {
    console.error("Failed to fetch admin users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const result = await requireAdminWithPermission(request, "admins", "can_create")
  if (result instanceof NextResponse) return result

  try {
    const { email, password, role } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Email, password, and role are required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if email already exists
    const { data: existing } = await supabase.from("admin_users").select("id").eq("email", email).single()

    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Create user
    const { data, error } = await supabase.from("admin_users").insert({ email, password_hash, role }).select().single()

    if (error) throw error

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error("Failed to create admin user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
