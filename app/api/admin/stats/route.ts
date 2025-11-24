import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const supabase = createAdminClient()

      // Get total players
      const { count: totalPlayers } = await supabase.from("players").select("*", { count: "exact", head: true })

      // Get total games
      const { count: totalGames } = await supabase.from("game_sessions").select("*", { count: "exact", head: true })

      // Get active subjects
      const { count: totalSubjects } = await supabase
        .from("subjects")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)

      // Get average score
      const { data: avgData } = await supabase.from("game_sessions").select("score")

      const avgScore =
        avgData && avgData.length > 0 ? avgData.reduce((sum, session) => sum + session.score, 0) / avgData.length : 0

      return NextResponse.json({
        totalPlayers: totalPlayers || 0,
        totalGames: totalGames || 0,
        totalSubjects: totalSubjects || 0,
        avgScore,
      })
    } catch (error) {
      console.error("[v0] Stats error:", error)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
  })
}
