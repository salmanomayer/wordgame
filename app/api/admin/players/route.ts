import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const supabase = createAdminClient()

      const { data: players, error } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      return NextResponse.json(players)
    } catch (error) {
      console.error("[v0] Players fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
    }
  })
}
