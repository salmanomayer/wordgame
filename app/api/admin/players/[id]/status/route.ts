import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminAuth(request, async () => {
    try {
      const { is_active } = await request.json()
      const supabase = createAdminClient()

      const { error } = await supabase.from("players").update({ is_active }).eq("id", params.id)

      if (error) throw error

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Player status update error:", error)
      return NextResponse.json({ error: "Failed to update player status" }, { status: 500 })
    }
  })
}
