import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/supabase/admin"
import { transaction } from "@/lib/postgres"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      // Ensure games table and related tables exist
      await adminDb.query(`
        CREATE TABLE IF NOT EXISTS games (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          start_time TIMESTAMPTZ,
          end_time TIMESTAMPTZ,
          correct_marks INTEGER NOT NULL DEFAULT 10,
          time_per_word INTEGER NOT NULL DEFAULT 30,
          difficulty VARCHAR(20) DEFAULT 'medium',
          is_active BOOLEAN DEFAULT TRUE,
          attempts_limit INTEGER,
          word_count INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      
      await adminDb.query(`
        CREATE TABLE IF NOT EXISTS game_subjects (
          game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
          subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          PRIMARY KEY (game_id, subject_id)
        )
      `)
      
      await adminDb.query(`
        CREATE TABLE IF NOT EXISTS game_stages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          order_index INTEGER NOT NULL DEFAULT 0,
          word_count INTEGER NOT NULL DEFAULT 5,
          difficulty VARCHAR(20) DEFAULT 'medium',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      
      await adminDb.query(`
        CREATE TABLE IF NOT EXISTS game_stage_subjects (
          stage_id UUID NOT NULL REFERENCES game_stages(id) ON DELETE CASCADE,
          subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          PRIMARY KEY (stage_id, subject_id)
        )
      `)

      // Add missing columns if they don't exist
      await adminDb.query("ALTER TABLE games ADD COLUMN IF NOT EXISTS attempts_limit INTEGER")
      await adminDb.query("ALTER TABLE games ADD COLUMN IF NOT EXISTS word_count INTEGER")
      await adminDb.query("ALTER TABLE game_stages ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium'")

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
      const { rows: countRows, error: countError } = await adminDb.query(countSql, params)
      
      if (countError) {
        console.error("[v0] Games count error:", countError)
        throw countError
      }
      
      const totalCount = parseInt(countRows[0]?.count || "0")

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

      const { rows, error: queryError } = await adminDb.query(sql, params)
      
      if (queryError) {
        console.error("[v0] Games query error:", queryError)
        throw queryError
      }
      
      return NextResponse.json({
        data: rows || [],
        total: totalCount,
        page,
        limit: limit || totalCount
      })
    } catch (error) {
      console.error("[v0] Games fetch error:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return NextResponse.json({ error: "Failed to fetch games: " + errorMessage }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const body = await request.json()
      const { title, start_time, end_time, correct_marks, time_per_word, word_count, difficulty, attempts_limit, subjects, stages } = body

      if (!title || !correct_marks) {
        return NextResponse.json({ error: "Title and marks are mandatory" }, { status: 400 })
      }

      // Ensure tables exist before transaction
      await adminDb.query(`
        CREATE TABLE IF NOT EXISTS games (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          start_time TIMESTAMPTZ,
          end_time TIMESTAMPTZ,
          correct_marks INTEGER NOT NULL DEFAULT 10,
          time_per_word INTEGER NOT NULL DEFAULT 30,
          difficulty VARCHAR(20) DEFAULT 'medium',
          is_active BOOLEAN DEFAULT TRUE,
          attempts_limit INTEGER,
          word_count INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      
      await adminDb.query(`
        CREATE TABLE IF NOT EXISTS game_subjects (
          game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
          subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          PRIMARY KEY (game_id, subject_id)
        )
      `)
      
      await adminDb.query(`
        CREATE TABLE IF NOT EXISTS game_stages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          order_index INTEGER NOT NULL DEFAULT 0,
          word_count INTEGER NOT NULL DEFAULT 5,
          difficulty VARCHAR(20) DEFAULT 'medium',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      
      await adminDb.query(`
        CREATE TABLE IF NOT EXISTS game_stage_subjects (
          stage_id UUID NOT NULL REFERENCES game_stages(id) ON DELETE CASCADE,
          subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          PRIMARY KEY (stage_id, subject_id)
        )
      `)

      // Add missing columns
      await adminDb.query("ALTER TABLE games ADD COLUMN IF NOT EXISTS attempts_limit INTEGER")
      await adminDb.query("ALTER TABLE games ADD COLUMN IF NOT EXISTS word_count INTEGER")
      await adminDb.query("ALTER TABLE game_stages ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium'")

      const result = await transaction(async (client) => {
        let { rows: attemptsCol } = await client.query(
          "SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'attempts_limit'",
        )
        let hasAttemptsLimit = attemptsCol.length > 0
        let { rows: stageDiffCol } = await client.query(
          "SELECT 1 FROM information_schema.columns WHERE table_name = 'game_stages' AND column_name = 'difficulty'",
        )
        let hasStageDifficulty = stageDiffCol.length > 0
        if (!hasStageDifficulty) {
          await client.query("ALTER TABLE game_stages ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium'")
          ;({ rows: stageDiffCol } = await client.query(
            "SELECT 1 FROM information_schema.columns WHERE table_name = 'game_stages' AND column_name = 'difficulty'",
          ))
          hasStageDifficulty = stageDiffCol.length > 0
        }

        // 1. Insert Game
        const gameInsertCols = [
          "title",
          "start_time",
          "end_time",
          "correct_marks",
          "time_per_word",
          "word_count",
          "difficulty",
        ]
        const gameInsertValues: any[] = [
          title,
          start_time || null,
          end_time || null,
          correct_marks,
          time_per_word || 30,
          word_count || 5,
          difficulty || "medium",
        ]
        if (hasAttemptsLimit) {
          gameInsertCols.push("attempts_limit")
          gameInsertValues.push(attempts_limit ?? null)
        }
        const placeholders = gameInsertValues.map((_, i) => `$${i + 1}`).join(", ")
        const gameRes = await client.query(
          `INSERT INTO games (${gameInsertCols.join(", ")}) VALUES (${placeholders}) RETURNING *`,
          gameInsertValues,
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
            let stageRes
            if (hasStageDifficulty) {
              stageRes = await client.query(
                `INSERT INTO game_stages (game_id, title, order_index, word_count, difficulty) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [game.id, stage.title, i, stage.word_count || 5, stage.difficulty || "medium"],
              )
            } else {
              stageRes = await client.query(
                `INSERT INTO game_stages (game_id, title, order_index, word_count) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [game.id, stage.title, i, stage.word_count || 5],
              )
            }
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      return NextResponse.json({ error: "Failed to create game: " + errorMessage }, { status: 500 })
    }
  })
}
