import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const supabase = createAdminClient()

      // Update auth user to confirm email (bypass email verification)
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email_confirm: true,
      })

      if (authError) {
        console.error("[v0] Auth activation error:", authError)
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }

      // Update player record to set is_active = true
      const { error: playerError } = await supabase.from("players").update({ is_active: true }).eq("id", id)

      if (playerError) {
        console.error("[v0] Player activation error:", playerError)
        return NextResponse.json({ error: playerError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Activation error:", error)
      return NextResponse.json({ error: "Failed to activate user" }, { status: 500 })
    }
  })
}
