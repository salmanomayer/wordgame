import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const supabase = createAdminClient()

      const { error } = await supabase.from("words").delete().eq("id", id)

      if (error) throw error

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Word delete error:", error)
      return NextResponse.json({ error: "Failed to delete word" }, { status: 500 })
    }
  })
}
