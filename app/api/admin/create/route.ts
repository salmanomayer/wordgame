import { type NextRequest, NextResponse } from "next/server"
import { createAdminUser } from "@/lib/admin-auth"

// This endpoint should be protected or removed in production
// Only use for initial admin setup
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const admin = await createAdminUser(email, password)

    if (!admin) {
      return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Admin user created successfully",
      admin,
    })
  } catch (error) {
    console.error("[v0] Admin creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
