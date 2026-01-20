import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params

      // Get game basic info
      const gameRes = await adminDb.query("SELECT * FROM games WHERE id = $1", [id])
      if (gameRes.rows.length === 0) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 })
      }
      const game = gameRes.rows[0]

      // Get stages
      const stagesRes = await adminDb.query(
        "SELECT * FROM game_stages WHERE game_id = $1 ORDER BY order_index",
        [id]
      )
      const stages = stagesRes.rows

      const result: any = {
        game,
        stages: []
      }

      if (stages.length > 0) {
        for (const stage of stages) {
          // Get subjects for this stage
          const stageSubsRes = await adminDb.query(
            "SELECT subject_id FROM game_stage_subjects WHERE stage_id = $1",
            [stage.id]
          )
          const subjectIds = stageSubsRes.rows.map(r => r.subject_id)

          if (subjectIds.length > 0) {
            const minLen =
              (stage.difficulty && stage.difficulty.toLowerCase() === "hard")
                ? 5
                : (stage.difficulty && stage.difficulty.toLowerCase() === "medium")
                  ? 4
                  : 1
            const wordsRes = await adminDb.query(
              `SELECT w.*, s.name as subject_name
               FROM words w
               JOIN subjects s ON w.subject_id = s.id
               WHERE w.subject_id = ANY($1)
                 AND char_length(w.word) >= $3
               ORDER BY RANDOM()
               LIMIT $2`,
              [subjectIds, stage.word_count || 5, minLen]
            )
            result.stages.push({
              ...stage,
              words: wordsRes.rows
            })
          } else {
            result.stages.push({
              ...stage,
              words: []
            })
          }
        }
      } else {
        // No stages, use game subjects
        const subjectsRes = await adminDb.query(
          "SELECT subject_id FROM game_subjects WHERE game_id = $1",
          [id]
        )
        const subjectIds = subjectsRes.rows.map(r => r.subject_id)

        if (subjectIds.length > 0) {
          const minLen =
            (game.difficulty && game.difficulty.toLowerCase() === "hard")
              ? 5
              : (game.difficulty && game.difficulty.toLowerCase() === "medium")
                ? 4
                : 1
          const wordsRes = await adminDb.query(
            `SELECT w.*, s.name as subject_name
             FROM words w
             JOIN subjects s ON w.subject_id = s.id
             WHERE w.subject_id = ANY($1)
               AND char_length(w.word) >= $3
             ORDER BY RANDOM()
             LIMIT $2`,
            [subjectIds, game.word_count || 5, minLen]
          )
          result.words = wordsRes.rows
        } else {
          result.words = []
        }
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error("[v0] Game test words error:", error)
      return NextResponse.json({ error: "Failed to fetch game test words" }, { status: 500 })
    }
  })
}
