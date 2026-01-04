import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const { password } = await request.json()

      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }

      const supabase = createAdminClient()

      // Update user password using admin API
      const { error } = await supabase.auth.admin.updateUserById(id, {
        password: password,
      })

      if (error) {
        console.error("[v0] Password update error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Password update error:", error)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }
  })
}
