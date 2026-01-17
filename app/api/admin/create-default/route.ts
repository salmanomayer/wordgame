import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { adminDb } from "@/lib/supabase/admin"

// This is a one-time setup endpoint to create/reset the default admin user
export async function POST(request: NextRequest) {
  try {
    const { setupKey } = await request.json()

    // Simple security check - you can change this key
    if (setupKey !== "setup-admin-2024") {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 403 })
    }

    const email = "admin@test.com"
    const password = "Admin123!"
    const normalizedEmail = email.trim().toLowerCase()

    // Generate bcrypt hash
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const { rows } = await adminDb.query("SELECT id FROM admin_users WHERE email = $1", [normalizedEmail])
    if (rows.length > 0) {
      const { error } = await adminDb.query("UPDATE admin_users SET password_hash = $1 WHERE email = $2", [
        passwordHash,
        normalizedEmail,
      ])
      if (error) {
        console.error("[v0] Failed to update admin:", error)
        return NextResponse.json({ error: "Failed to update admin: " + String(error) }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        message: "Admin password updated successfully",
        credentials: { email: normalizedEmail, password },
      })
    } else {
      const { error } = await adminDb.query("INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)", [
        normalizedEmail,
        passwordHash,
      ])
      if (error) {
        console.error("[v0] Failed to create admin:", error)
        return NextResponse.json({ error: "Failed to create admin: " + String(error) }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        credentials: { email: normalizedEmail, password },
      })
    }
  } catch (error: any) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json({ error: error.message || "Failed to setup admin" }, { status: 500 })
  }
}
