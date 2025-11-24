import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/admin"

// This is a one-time setup endpoint to create/reset the default admin user
export async function POST(request: NextRequest) {
  try {
    const { setupKey } = await request.json()

    // Simple security check - you can change this key
    if (setupKey !== "setup-admin-2024") {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 403 })
    }

    const supabase = createAdminClient()
    const email = "admin@test.com"
    const password = "Admin123!"

    // Generate bcrypt hash
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    console.log("[v0] Generated password hash:", passwordHash)

    // Check if admin exists
    const { data: existingAdmin } = await supabase.from("admin_users").select("id").eq("email", email).maybeSingle()

    if (existingAdmin) {
      // Update existing admin
      const { error } = await supabase.from("admin_users").update({ password_hash: passwordHash }).eq("email", email)

      if (error) {
        console.error("[v0] Error updating admin:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Admin password updated successfully",
        credentials: { email, password },
      })
    } else {
      // Create new admin
      const { error } = await supabase.from("admin_users").insert([{ email, password_hash: passwordHash }])

      if (error) {
        console.error("[v0] Error creating admin:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        credentials: { email, password },
      })
    }
  } catch (error: any) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json({ error: error.message || "Failed to setup admin" }, { status: 500 })
  }
}
