import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { requirePlayer } from "@/lib/player-middleware"

export async function GET(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { rows: games } = await db.query(
      `SELECT 
         g.id,
         g.title,
         g.difficulty,
         g.word_count,
         g.attempts_limit,
         g.start_time,
         g.end_time,
         (SELECT COUNT(*) FROM game_stages st WHERE st.game_id = g.id) AS stage_count
       FROM games g
       WHERE g.is_active = TRUE
         AND (g.start_time IS NULL OR g.start_time <= NOW())
         AND (g.end_time IS NULL OR g.end_time >= NOW())
       ORDER BY g.created_at DESC`,
    )

    const result: any[] = []
    for (const g of games) {
      const { rows: gameSubjectRows } = await db.query(
        "SELECT subject_id FROM game_subjects WHERE game_id = $1",
        [g.id],
      )
      const { rows: stageSubjectRows } = await db.query(
        `SELECT gss.subject_id
         FROM game_stage_subjects gss
         JOIN game_stages gs ON gs.id = gss.stage_id
         WHERE gs.game_id = $1`,
        [g.id],
      )
      const subjectIds = Array.from(
        new Set([
          ...gameSubjectRows.map((r: any) => r.subject_id),
          ...stageSubjectRows.map((r: any) => r.subject_id),
        ]),
      )

      let subjects: Array<{ id: string; name: string }> = []
      if (subjectIds.length > 0) {
        const { rows: subjectRows } = await db.query(
          "SELECT id, name FROM subjects WHERE id = ANY($1) AND is_active = TRUE ORDER BY name ASC",
          [subjectIds],
        )
        subjects = subjectRows
      }

      result.push({
        id: g.id,
        title: g.title,
        difficulty: g.difficulty,
        word_count: g.word_count,
        attempts_limit: g.attempts_limit ?? null,
        stage_count: g.stage_count ?? 0,
        subjects,
      })
    }

    return NextResponse.json({ games: result })
  } catch (error) {
    console.error("[v0] Player games fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
  }
}
