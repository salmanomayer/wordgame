import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requirePlayer } from "@/lib/player-middleware"

export async function GET(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    // Get player stats
    const { rows: playerRows } = await db.query(
      "SELECT total_score, games_played FROM players WHERE id = $1",
      [auth.playerId],
    )
    const player = playerRows[0]

    // Get recent game sessions
    const { rows: sessions } = await db.query(
      "SELECT gs.*, s.name as subject_name FROM game_sessions gs JOIN subjects s ON gs.subject_id = s.id WHERE gs.player_id = $1 AND gs.completed_at IS NOT NULL ORDER BY gs.completed_at DESC LIMIT 10",
      [auth.playerId],
    )

    return NextResponse.json({
      stats: player || { total_score: 0, games_played: 0 },
      recent_games: sessions || [],
    })
  } catch (error) {
    console.error("[v0] Player stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
