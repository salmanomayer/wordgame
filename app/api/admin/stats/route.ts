import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { rows: playerCountRows } = await adminDb.query("SELECT COUNT(*)::int AS count FROM players")
      const { rows: gameCountRows } = await adminDb.query("SELECT COUNT(*)::int AS count FROM game_sessions")
      const { rows: subjectCountRows } = await adminDb.query(
        "SELECT COUNT(*)::int AS count FROM subjects WHERE is_active = TRUE"
      )
      const { rows: avgScoreRows } = await adminDb.query("SELECT COALESCE(AVG(score), 0)::float AS avg FROM game_sessions")

      return NextResponse.json({
        totalPlayers: playerCountRows[0]?.count ?? 0,
        totalGames: gameCountRows[0]?.count ?? 0,
        totalSubjects: subjectCountRows[0]?.count ?? 0,
        avgScore: avgScoreRows[0]?.avg ?? 0,
      })
    } catch (error) {
      console.error("[v0] Stats error:", error)
      return NextResponse.json(
        {
          totalPlayers: 0,
          totalGames: 0,
          totalSubjects: 0,
          avgScore: 0,
        },
        { status: 200 },
      )
    }
  })
}
