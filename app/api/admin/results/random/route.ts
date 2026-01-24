import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const q = searchParams.get("q")
      const limit = searchParams.get("limit") === "all" ? null : parseInt(searchParams.get("limit") || "100")

      // Random games are sessions where game_id IS NULL
      let whereClause = "WHERE gs.game_id IS NULL AND gs.completed_at IS NOT NULL"
      const params: any[] = []

      // Leaderboard Query (aggregated by player)
      const leaderboardQuery = `
        SELECT 
          p.id as player_id,
          p.display_name,
          p.employee_id,
          SUM(gs.score)::INTEGER as total_score,
          COUNT(gs.id)::INTEGER as games_played,
          SUM(EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at)))::INTEGER as total_time_seconds,
          RANK() OVER (ORDER BY SUM(gs.score) DESC) as rank
        FROM game_sessions gs
        JOIN players p ON gs.player_id = p.id
        WHERE gs.game_id IS NULL AND gs.completed_at IS NOT NULL
        GROUP BY p.id, p.display_name, p.employee_id
        ORDER BY total_score DESC
        LIMIT 100
      `
      
      // Sessions Query
      let sessionsQuery = `
        SELECT 
          gs.id,
          gs.player_id,
          p.display_name,
          p.email,
          s.name as subject_name,
          gs.difficulty,
          gs.score,
          gs.words_completed,
          gs.total_words,
          gs.completed_at
        FROM game_sessions gs
        JOIN players p ON gs.player_id = p.id
        JOIN subjects s ON gs.subject_id = s.id
        ${whereClause}
        ORDER BY gs.completed_at DESC
      `

      if (limit) {
          sessionsQuery += ` LIMIT ${limit}`
      }

      const [leaderboardRes, sessionsRes] = await Promise.all([
        adminDb.query(leaderboardQuery),
        adminDb.query(sessionsQuery)
      ])

      return NextResponse.json({
        leaderboard: leaderboardRes.rows,
        sessions: sessionsRes.rows
      })

    } catch (error) {
      console.error("[v0] Random results fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
    }
  })
}
