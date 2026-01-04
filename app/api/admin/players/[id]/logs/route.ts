import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const supabase = createAdminClient()

      const { data: logs, error } = await supabase
        .from("player_logs")
        .select("*")
        .eq("player_id", id)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error

      return NextResponse.json(logs || [])
    } catch (error) {
      console.error("[v0] Player logs fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch player logs" }, { status: 500 })
    }
  })
}
