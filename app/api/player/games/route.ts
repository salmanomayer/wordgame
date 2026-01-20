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

      result.push({
        id: g.id,
        title: g.title,
        difficulty: g.difficulty,
        word_count: g.word_count,
        attempts_limit: g.attempts_limit ?? null,
        stage_count: g.stage_count ?? 0,
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
                 WHERE game_id = $1 AND player_id = $2 AND stage_id = $3`,
                [game.id, auth.playerId, firstStageId]
            );
            attemptsCount = parseInt(attemptRows[0].count, 10);
        } else {
            // Single-stage game: Count sessions for the game (where stage_id might be null)
            const { rows: attemptRows } = await db.query(
                `SELECT COUNT(*) as count 
                 FROM game_sessions 
                 WHERE game_id = $1 AND player_id = $2 AND (stage_id IS NULL OR stage_id::text = '')`,
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
