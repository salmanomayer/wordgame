import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { requirePlayer } from "@/lib/player-middleware"

export async function POST(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { session_id, score, words_completed } = await request.json()

    if (!session_id || score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update game session
    const { rows: updatedSessions } = await db.query(
      "UPDATE game_sessions SET score = $1, words_completed = $2, completed_at = $3 WHERE id = $4 AND player_id = $5 RETURNING id",
      [score, words_completed, new Date().toISOString(), session_id, auth.playerId],
    )
    if (updatedSessions.length === 0) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    // Update player stats
    const { rows: playerRows } = await db.query(
      "SELECT total_score, games_played FROM players WHERE id = $1",
      [auth.playerId],
    )
    const player = playerRows[0]

    if (player) {
      await db.query(
        "UPDATE players SET total_score = $1, games_played = $2 WHERE id = $3",
        [player.total_score + score, player.games_played + 1, auth.playerId],
      )
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
