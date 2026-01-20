import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { adminDb } from "@/lib/db"
import { requireAdminWithPermission } from "@/lib/admin-middleware"

export async function GET(request: NextRequest) {
  const result = await requireAdminWithPermission(request, "admins", "can_read")
  if (result instanceof NextResponse) return result

  try {
    const { rows } = await adminDb.query(
      "SELECT id, email, role, created_at FROM admin_users ORDER BY created_at DESC"
    )
    return NextResponse.json({ users: rows })
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

    // Check if email already exists
    const { rows: existingRows } = await adminDb.query("SELECT id FROM admin_users WHERE email = $1", [email])
    if (existingRows.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Create user
    const { rows, error } = await adminDb.query(
      "INSERT INTO admin_users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at",
      [email, password_hash, role]
    )

    if (error) throw error

    return NextResponse.json({ user: rows[0] })
  } catch (error) {
    console.error("Failed to create admin user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
