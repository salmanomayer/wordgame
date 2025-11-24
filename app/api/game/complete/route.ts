import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { session_id, score, words_completed } = await request.json()

    if (!session_id || score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update game session
    const { error: sessionError } = await supabase
      .from("game_sessions")
      .update({
        score,
        words_completed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session_id)
      .eq("player_id", user.id)

    if (sessionError) throw sessionError

    // Update player stats
    const { data: player } = await supabase
      .from("players")
      .select("total_score, games_played")
      .eq("id", user.id)
      .single()

    if (player) {
      const { error: playerError } = await supabase
        .from("players")
        .update({
          total_score: player.total_score + score,
          games_played: player.games_played + 1,
        })
        .eq("id", user.id)

      if (playerError) throw playerError
    }

    return NextResponse.json({
      success: true,
      final_score: score,
    })
  } catch (error) {
    console.error("[v0] Complete game error:", error)
    return NextResponse.json({ error: "Failed to complete game" }, { status: 500 })
  }
}
