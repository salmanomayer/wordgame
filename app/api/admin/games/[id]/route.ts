import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/supabase/admin"
import { transaction } from "@/lib/postgres"

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

      // Get game subjects
      const subjectsRes = await adminDb.query(
        "SELECT subject_id FROM game_subjects WHERE game_id = $1",
        [id]
      )
      game.subjects = subjectsRes.rows.map(r => r.subject_id)

      // Get stages
      const stagesRes = await adminDb.query(
        "SELECT * FROM game_stages WHERE game_id = $1 ORDER BY order_index",
        [id]
      )
      const stages = stagesRes.rows

      // Get subjects for each stage
      for (const stage of stages) {
        const stageSubsRes = await adminDb.query(
          "SELECT subject_id FROM game_stage_subjects WHERE stage_id = $1",
          [stage.id]
        )
        stage.subjects = stageSubsRes.rows.map(r => r.subject_id)
      }
      game.stages = stages

      return NextResponse.json(game)
    } catch (error) {
      console.error("[v0] Game fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch game details" }, { status: 500 })
    }
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const { title, start_time, end_time, correct_marks, time_per_word, word_count, difficulty, is_active, attempts_limit, subjects, stages } = body

      const result = await transaction(async (client) => {
        const { rows: attemptsCol } = await client.query(
          "SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'attempts_limit'",
        )
        const hasAttemptsLimit = attemptsCol.length > 0
        const { rows: stageDiffCol } = await client.query(
          "SELECT 1 FROM information_schema.columns WHERE table_name = 'game_stages' AND column_name = 'difficulty'",
        )
        const hasStageDifficulty = stageDiffCol.length > 0

        // 1. Update Game
        const updateFields: string[] = [
          "title = $1",
          "start_time = $2",
          "end_time = $3",
          "correct_marks = $4",
          "time_per_word = $5",
          "word_count = $6",
          "is_active = $7",
          "difficulty = $8",
        ]
        const params: any[] = [
          title,
          start_time || null,
          end_time || null,
          correct_marks,
          time_per_word,
          word_count,
          is_active,
          difficulty || "medium",
        ]
        if (hasAttemptsLimit) {
          updateFields.push("attempts_limit = $9")
          params.push(attempts_limit ?? null)
        }
        params.push(id)
        const gameRes = await client.query(
          `UPDATE games 
           SET ${updateFields.join(", ")}, updated_at = NOW() 
           WHERE id = $${params.length} RETURNING *`,
          params,
        )
        
        if (gameRes.rows.length === 0) {
          throw new Error("Game not found")
        }

        // 2. Update Game Subjects (Delete then Insert)
        await client.query("DELETE FROM game_subjects WHERE game_id = $1", [id])
        if (subjects && subjects.length > 0) {
          for (const subjectId of subjects) {
            await client.query(
              "INSERT INTO game_subjects (game_id, subject_id) VALUES ($1, $2)",
              [id, subjectId]
            )
          }
        }

        // 3. Update Stages (Delete then Insert is simplest for now)
        // Note: In a production app, we might want to reconcile to keep stage IDs stable
        await client.query("DELETE FROM game_stages WHERE game_id = $1", [id])
        if (stages && stages.length > 0) {
          for (let i = 0; i < stages.length; i++) {
            const stage = stages[i]
            let stageRes
            if (hasStageDifficulty) {
              stageRes = await client.query(
                `INSERT INTO game_stages (game_id, title, order_index, word_count, difficulty) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [id, stage.title, i, stage.word_count || 5, stage.difficulty || "medium"],
              )
            } else {
              stageRes = await client.query(
                `INSERT INTO game_stages (game_id, title, order_index, word_count) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [id, stage.title, i, stage.word_count || 5],
              )
            }
            const stageId = stageRes.rows[0].id

            if (stage.subjects && stage.subjects.length > 0) {
              for (const subjectId of stage.subjects) {
                await client.query(
                  "INSERT INTO game_stage_subjects (stage_id, subject_id) VALUES ($1, $2)",
                  [stageId, subjectId]
                )
              }
            }
          }
        }

        return gameRes.rows[0]
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error("[v0] Game update error:", error)
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update game" }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      await adminDb.query("DELETE FROM games WHERE id = $1", [id])
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Game delete error:", error)
      return NextResponse.json({ error: "Failed to delete game" }, { status: 500 })
    }
  })
}
