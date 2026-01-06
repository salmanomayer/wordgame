import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/supabase/admin"
import { transaction } from "@/lib/postgres"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const q = searchParams.get("q")
      const page = parseInt(searchParams.get("page") || "1")
      const limit = searchParams.get("limit") === "all" ? null : parseInt(searchParams.get("limit") || "20")
      const sortBy = searchParams.get("sort_by") || "created_at"
      const sortOrder = searchParams.get("sort_order") || "desc"

      // Validate sort column
      const allowedSortColumns = ["title", "created_at", "is_active", "start_time", "end_time"]
      const validatedSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "created_at"
      const validatedSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC"

      let whereClause = ""
      const params: any[] = []
      if (q?.trim()) {
        whereClause = " WHERE title ILIKE $1"
        params.push(`%${q.trim()}%`)
      }

      // Get total count
      const countSql = `SELECT COUNT(*) FROM games ${whereClause}`
      const { rows: countRows } = await adminDb.query(countSql, params)
      const totalCount = parseInt(countRows[0].count)

      // Get games with their subject counts and stage counts
      let sql = `
        SELECT 
          g.*,
          (SELECT COUNT(*) FROM game_subjects gs WHERE gs.game_id = g.id) as subject_count,
          (SELECT COUNT(*) FROM game_stages gst WHERE gst.game_id = g.id) as stage_count
        FROM games g
        ${whereClause}
        ORDER BY ${validatedSortBy} ${validatedSortOrder}
      `

      if (limit !== null) {
        const offset = (page - 1) * limit
        sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
        params.push(limit, offset)
      }

      const { rows } = await adminDb.query(sql, params)
      return NextResponse.json({
        data: rows,
        total: totalCount,
        page,
        limit: limit || totalCount
      })
    } catch (error) {
      console.error("[v0] Games fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const body = await request.json()
      const { title, start_time, end_time, correct_marks, time_per_word, word_count, difficulty, subjects, stages } = body

      if (!title || !correct_marks) {
        return NextResponse.json({ error: "Title and marks are mandatory" }, { status: 400 })
      }

      const result = await transaction(async (client) => {
        // 1. Insert Game
        const gameRes = await client.query(
          `INSERT INTO games (title, start_time, end_time, correct_marks, time_per_word, word_count, difficulty) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [title, start_time || null, end_time || null, correct_marks, time_per_word || 30, word_count || 5, difficulty || 'medium']
        )
        const game = gameRes.rows[0]

        // 2. Insert Game Subjects (if any)
        if (subjects && subjects.length > 0) {
          for (const subjectId of subjects) {
            await client.query(
              "INSERT INTO game_subjects (game_id, subject_id) VALUES ($1, $2)",
              [game.id, subjectId]
            )
          }
        }

        // 3. Insert Stages (if any)
        if (stages && stages.length > 0) {
          for (let i = 0; i < stages.length; i++) {
            const stage = stages[i]
            const stageRes = await client.query(
              `INSERT INTO game_stages (game_id, title, order_index, word_count, difficulty) 
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [game.id, stage.title, i, stage.word_count || 5, stage.difficulty || 'medium']
            )
            const stageId = stageRes.rows[0].id

            // Insert Stage Subjects
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

        return game
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error("[v0] Game create error:", error)
      return NextResponse.json({ error: "Failed to create game" }, { status: 500 })
    }
  })
}
