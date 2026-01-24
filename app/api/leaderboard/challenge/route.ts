import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("game_id")

    let query = "SELECT * FROM get_challenge_leaderboard($1)"
    let params: any[] = [1000]

    if (gameId) {
       // If gameId is provided, we need a different query or function
       // Since the current function aggregates EVERYTHING, we might need a new function 
       // or just run a direct query for game-specific leaderboard
       
       query = `
        SELECT
          p.id as player_id,
          p.display_name,
          p.phone_number,
          COALESCE(SUM(gs.score), 0)::INTEGER as total_score,
          COALESCE(SUM(EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))), 0)::INTEGER as total_time_seconds,
          COUNT(gs.id)::INTEGER as games_played,
          ROW_NUMBER() OVER (
              ORDER BY 
                  COALESCE(SUM(gs.score), 0) DESC, 
                  COALESCE(SUM(EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))), 0) ASC
          )::INTEGER as rank
        FROM players p
        JOIN game_sessions gs ON p.id = gs.player_id
          AND gs.completed_at IS NOT NULL
        WHERE gs.game_id = $2
        GROUP BY p.id, p.display_name, p.phone_number
        ORDER BY total_score DESC, total_time_seconds ASC
        LIMIT $1
       `
       params = [1000, gameId]
    }

    const { rows: data, error } = await db.query(query, params)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Challenge leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch challenge leaderboard" }, { status: 500 })
  }
}
