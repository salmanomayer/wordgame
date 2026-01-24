import { type NextRequest, NextResponse } from "next/server"
import { loginAdmin } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/admin-audit"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await loginAdmin(email, password)

    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    await logAdminAction({
      adminId: result.admin.id,
      action: "LOGIN",
      resourceType: "ADMIN_USER",
      resourceId: result.admin.id
    })

    return NextResponse.json({
      token: result.token,
      admin: result.admin,
    })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
