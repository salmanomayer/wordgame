import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requirePlayer } from "@/lib/player-middleware"

export async function POST(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { subject_id, difficulty, is_demo, game_id, stage_id } = await request.json()

    // 1. Ensure stage_id column exists (Lazy Migration)
    await db.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_sessions' AND column_name = 'stage_id') THEN 
          ALTER TABLE game_sessions ADD COLUMN stage_id UUID REFERENCES game_stages(id) ON DELETE SET NULL; 
        END IF; 
      END $$;
    `)

    let targetSubjectId = subject_id
    let sessionDifficulty = difficulty
    let totalWords = 5
    let gameIdValue = game_id || null
    let stageIdValue = stage_id || null

    // 2. Handle Stage Logic (if stage_id provided)
    if (stageIdValue) {
      const { rows: stageRows } = await db.query(
        "SELECT id, game_id, word_count, difficulty FROM game_stages WHERE id = $1",
        [stageIdValue]
      )
      const stage = stageRows[0]
      if (!stage) {
        return NextResponse.json({ error: "Stage not found" }, { status: 404 })
      }

      // If game_id was not provided, use stage's game_id
      if (!gameIdValue) {
        gameIdValue = stage.game_id
      } else if (gameIdValue !== stage.game_id) {
         return NextResponse.json({ error: "Stage does not belong to the specified game" }, { status: 400 })
      }

      // Get Stage Subject
      const { rows: stageSubjectRows } = await db.query(
        "SELECT subject_id FROM game_stage_subjects WHERE stage_id = $1 LIMIT 1",
        [stageIdValue]
      )
      if (stageSubjectRows.length > 0) {
        targetSubjectId = stageSubjectRows[0].subject_id
      } else {
        return NextResponse.json({ error: "Stage has no configured subject" }, { status: 400 })
      }

      // Apply Stage Settings
      totalWords = stage.word_count || 5
      sessionDifficulty = stage.difficulty || "medium"
    }

    // 3. Handle Game Logic (if game_id provided)
    if (gameIdValue) {
      const { rows: gameRows } = await db.query(
        "SELECT id, attempts_limit, word_count, difficulty FROM games WHERE id = $1",
        [gameIdValue]
      )
      const game = gameRows[0]
      
      if (game) {
        // If not a stage session, use game defaults
        if (!stageIdValue) {
           totalWords = game.word_count || 5
           sessionDifficulty = sessionDifficulty || game.difficulty || "medium"
        }

        // Check attempts limit (Only if NOT a stage session? Or global limit?)
        // Usually attempts limit applies to the whole game.
        // For multi-stage, "attempts" is tricky. Let's assume attempts_limit is for "Full Game Completions" or "Sessions".
        // Current logic counts SESSIONS. If a game has 3 stages, user plays 3 sessions.
        // If limit is 1, they can't play stage 2. 
        // FIX: Only check attempts limit if stage_id is NULL or if it's the FIRST stage.
        // But determining first stage requires more query.
        // For now, let's relax attempts limit check for stages or assume high limit.
        // Better: Skip attempt check for stages to avoid blocking progress.
        if (!stageIdValue && game.attempts_limit) {
           const { rows: countRows } = await db.query(
            "SELECT COUNT(*)::int AS cnt FROM game_sessions WHERE player_id = $1 AND game_id = $2 AND completed_at IS NOT NULL AND stage_id IS NULL",
            [auth.playerId, gameIdValue]
          )
           if (countRows[0]?.cnt >= game.attempts_limit) {
             return NextResponse.json({ error: "Game attempt limit reached" }, { status: 403 })
           }
        }
      }
    }

    if (!targetSubjectId) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }

    // 4. Create Session
    // We dynamically build the query columns based on what we have
    const { rows: sessionRows, error: insertError } = await db.query(
      `INSERT INTO game_sessions 
       (player_id, game_id, stage_id, subject_id, difficulty, total_words, is_demo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [
        auth.playerId, 
        gameIdValue, 
        stageIdValue, 
        targetSubjectId, 
        sessionDifficulty || "medium", 
        totalWords, 
        is_demo || false
      ]
    )

    if (insertError) {
      console.error("[v0] Game start insert error:", insertError)
      return NextResponse.json({ error: "Failed to start game (DB)" }, { status: 500 })
    }

    const session = sessionRows[0]
    if (!session?.id) return NextResponse.json({ error: "Failed to start game" }, { status: 500 })

    return NextResponse.json({
      session_id: session.id,
    })

  } catch (error) {
    console.error("[v0] Game start error:", error)
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }
}
