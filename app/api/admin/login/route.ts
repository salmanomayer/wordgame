import { type NextRequest, NextResponse } from "next/server"
import { loginAdmin } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("[v0] Admin login attempt for:", email)

    const result = await loginAdmin(email, password)

    if (!result) {
      console.log("[v0] Admin login failed - check server logs for details")
      return NextResponse.json({ 
        error: "Invalid credentials. Make sure the admin user exists. Visit /admin/setup to create/reset the admin account." 
      }, { status: 401 })
    }

    console.log("[v0] Admin login successful for:", result.admin.email)
    return NextResponse.json({
      token: result.token,
      admin: result.admin,
    })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json({ error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
