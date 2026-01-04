import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get player stats
    const { data: player } = await supabase
      .from("players")
      .select("total_score, games_played")
      .eq("id", user.id)
      .single()

    // Get recent game sessions
    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("*, subjects(name)")
      .eq("player_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      stats: player || { total_score: 0, games_played: 0 },
      recent_games: sessions || [],
    })
  } catch (error) {
    console.error("[v0] Player stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
