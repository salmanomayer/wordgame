import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
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

      // Dynamic Word Count Calculation
      let totalAvailableWords = 0
      
      // Check if game has stages
      const hasStages = (g.stage_count || 0) > 0
      
      if (hasStages) {
          // Sum words from all stages
          const { rows: stageSubjects } = await db.query(
            `SELECT gss.subject_id
             FROM game_stages gs
             JOIN game_stage_subjects gss ON gs.id = gss.stage_id
             WHERE gs.game_id = $1`,
            [g.id]
          )
          
          for (const s of stageSubjects) {
              if (s.subject_id) {
                  const { rows: countRows } = await db.query(
                      "SELECT COUNT(*)::int as cnt FROM words WHERE subject_id = $1 AND is_active = TRUE",
                      [s.subject_id]
                  )
                  totalAvailableWords += countRows[0].cnt || 0
              }
          }
      } else {
          // No stages, count words in game subjects
          // Note: If multiple subjects, we assume the game uses ALL of them? 
          // Or is it "Pick one subject"?
          // For the "Games List", we usually show the total "potential" words.
          if (subjectIds.length > 0) {
              const { rows: countRows } = await db.query(
                  "SELECT COUNT(*)::int as cnt FROM words WHERE subject_id = ANY($1) AND is_active = TRUE",
                  [subjectIds]
              )
              totalAvailableWords = countRows[0].cnt || 0
          }
      }
      
      // If we found words dynamically, use that count. Otherwise fall back to DB setting.
      // Priority: Configured word_count > Dynamic total
      // But we need to check if word_count is meant to be "ALL" (usually 0 or null).
      // However, we need to sum the CONFIGURED word counts if stages exist.
      
      let displayWordCount = 0;
      
      if (hasStages) {
          // Sum CONFIGURED word counts from stages
          const { rows: stages } = await db.query(
             `SELECT word_count FROM game_stages WHERE game_id = $1`,
             [g.id]
          )
          const configuredSum = stages.reduce((acc: number, s: any) => acc + (s.word_count || 0), 0)
          
          // If configured sum > 0, use it. Else use total available.
          displayWordCount = configuredSum > 0 ? configuredSum : totalAvailableWords;
      } else {
          // Single stage
          displayWordCount = (g.word_count && g.word_count > 0) ? g.word_count : totalAvailableWords;
      }
      
      // Fallback if something is 0 but we have available words (shouldn't happen if logic is correct)
      if (displayWordCount === 0 && totalAvailableWords > 0) {
          displayWordCount = totalAvailableWords;
      }

      result.push({
        id: g.id,
        title: g.title,
        difficulty: g.difficulty,
        word_count: displayWordCount,
        attempts_limit: g.attempts_limit ?? null,
        stage_count: g.stage_count ?? 0,
        start_time: g.start_time,
        end_time: g.end_time,
        subjects,
        attempts_count: 0 // Will be populated in the next step
      })
    }

    // Populate attempts_count for each game
    for (const game of result) {
        let attemptsCount = 0;
        
        // Check if game has stages
        const { rows: stages } = await db.query(
             `SELECT id FROM game_stages WHERE game_id = $1 ORDER BY order_index ASC LIMIT 1`,
             [game.id]
        );

        if (stages.length > 0) {
            // Multi-stage game: Count sessions for the first stage
            const firstStageId = stages[0].id;
            const { rows: attemptRows } = await db.query(
                `SELECT COUNT(*) as count 
                 FROM game_sessions 
                 WHERE game_id = $1 AND player_id = $2 AND stage_id = $3
                 AND (score > 0 OR words_completed > 0 OR completed_at IS NOT NULL)`,
                [game.id, auth.playerId, firstStageId]
            );
            attemptsCount = parseInt(attemptRows[0].count, 10);
        } else {
            // Single-stage game: Count sessions for the game (where stage_id might be null)
            const { rows: attemptRows } = await db.query(
                `SELECT COUNT(*) as count 
                 FROM game_sessions 
                 WHERE game_id = $1 AND player_id = $2 AND (stage_id IS NULL OR stage_id::text = '')
                 AND (score > 0 OR words_completed > 0 OR completed_at IS NOT NULL)`,
                [game.id, auth.playerId]
            );
            attemptsCount = parseInt(attemptRows[0].count, 10);
        }
        game.attempts_count = attemptsCount;
    }

    return NextResponse.json({ games: result })
  } catch (error) {
    console.error("[v0] Player games fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
  }
}
