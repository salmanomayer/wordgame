import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    const { id } = await params
    if (!id) return NextResponse.json({ error: "Game id is required" }, { status: 400 })

    try {
      const { rows: gameRows } = await adminDb.query("SELECT * FROM games WHERE id = $1", [id])
      if (gameRows.length === 0) return NextResponse.json({ error: "Game not found" }, { status: 404 })
      const game = gameRows[0]

      const { rows: stageSubjectRows } = await adminDb.query(
        `SELECT gss.subject_id
         FROM game_stage_subjects gss
         JOIN game_stages gs ON gs.id = gss.stage_id
         WHERE gs.game_id = $1`,
        [id],
      )
      const { rows: gameSubjectRows } = await adminDb.query(
        "SELECT subject_id FROM game_subjects WHERE game_id = $1",
        [id],
      )
      const subjectIds = Array.from(
        new Set([
          ...stageSubjectRows.map((r: any) => r.subject_id),
          ...gameSubjectRows.map((r: any) => r.subject_id),
        ]),
      )

      if (subjectIds.length === 0) {
        return NextResponse.json({ game, subjects: [], leaderboard: [], sessions: [] })
      }

      const constraints: string[] = []
      const paramsArr: any[] = []
      let idx = 1

      constraints.push(`gs.subject_id = ANY($${idx})`)
      paramsArr.push(subjectIds)
      idx++

      if (game.start_time) {
        constraints.push(`gs.completed_at >= $${idx}`)
        paramsArr.push(game.start_time)
        idx++
      }
      if (game.end_time) {
        constraints.push(`gs.completed_at <= $${idx}`)
        paramsArr.push(game.end_time)
        idx++
      }
      if (game.difficulty) {
        constraints.push(`LOWER(gs.difficulty) = LOWER($${idx})`)
        paramsArr.push(game.difficulty)
        idx++
      }
      constraints.push("gs.completed_at IS NOT NULL")

      const whereClause = constraints.length ? `WHERE ${constraints.join(" AND ")}` : ""

      const sessionsSql = `
        SELECT 
          gs.id,
          gs.player_id,
          gs.subject_id,
          s.name AS subject_name,
          gs.difficulty,
          gs.score,
          gs.words_completed,
          gs.total_words,
          gs.completed_at,
          p.display_name,
          p.email
        FROM game_sessions gs
        JOIN players p ON p.id = gs.player_id
        JOIN subjects s ON s.id = gs.subject_id
        ${whereClause}
        ORDER BY gs.score DESC, gs.completed_at DESC
        LIMIT 1000
      `
      const { rows: sessionRows } = await adminDb.query(sessionsSql, paramsArr)

      const leaderboardSql = `
        SELECT 
          p.id AS player_id,
          COALESCE(p.display_name, SPLIT_PART(p.email, '@', 1)) AS display_name,
          SUM(gs.score)::int AS total_score,
          COUNT(gs.id)::int AS games_played,
          ROW_NUMBER() OVER (ORDER BY SUM(gs.score) DESC) AS rank
        FROM game_sessions gs
        JOIN players p ON p.id = gs.player_id
        ${whereClause}
        GROUP BY p.id, display_name
        ORDER BY total_score DESC
        LIMIT 100
      `
      const { rows: leaderboardRows } = await adminDb.query(leaderboardSql, paramsArr)

      const subjectsSql = `
        SELECT id, name 
        FROM subjects 
        WHERE id = ANY($1)
        ORDER BY name ASC
      `
      const { rows: subjectsRows } = await adminDb.query(subjectsSql, [subjectIds])

      return NextResponse.json({
        game,
        subjects: subjectsRows,
        leaderboard: leaderboardRows,
        sessions: sessionRows,
      })
    } catch (error) {
      console.error("[v0] Game results error:", error)
      return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
    }
  })
}
