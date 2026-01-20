import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requirePlayer } from "@/lib/player-middleware"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { id: gameId } = await params

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    // 1. Get Game Details
    const { rows: gameRows, error: gameError } = await db.query(
      `SELECT id, title, difficulty, word_count, attempts_limit, correct_marks, time_per_word 
       FROM games 
       WHERE id = $1`,
      [gameId]
    )
    if (gameError) {
       console.error("[v0] Game progress fetch error (game):", gameError)
       return NextResponse.json({ error: "Failed to fetch game details" }, { status: 500 })
    }

    const game = gameRows[0]
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // 2. Get Stages
    const { rows: stages } = await db.query(
      `SELECT id, title, order_index, word_count, difficulty
       FROM game_stages 
       WHERE game_id = $1 
       ORDER BY order_index ASC`,
      [gameId]
    )

    // 3. Get User's Sessions for this Game
    // We need to check if 'stage_id' column exists first to avoid errors if migration hasn't run
    const { rows: colCheck } = await db.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'game_sessions' AND column_name = 'stage_id'"
    )
    const hasStageId = colCheck.length > 0

    let sessions: any[] = []
    if (hasStageId) {
      const { rows } = await db.query(
        `SELECT id, stage_id, score, completed_at, started_at
         FROM game_sessions 
         WHERE game_id = $1 AND player_id = $2 AND stage_id IS NOT NULL
         ORDER BY started_at DESC`,
        [gameId, auth.playerId]
      )
      sessions = rows
    }

    // 4. Calculate Attempts Count & Filter for Current Attempt
    // An attempt is defined as starting the game (or the first stage)
    let attemptsCount = 0;
    let currentAttemptStartTime: Date | null = null;
    
    if (stages.length > 0) {
        // Multi-stage game: Count sessions for the first stage
        const firstStageId = stages[0].id;
        const { rows: attemptRows } = await db.query(
            `SELECT started_at
             FROM game_sessions 
             WHERE game_id = $1 AND player_id = $2 AND stage_id = $3
             ORDER BY started_at DESC`,
            [gameId, auth.playerId, firstStageId]
        );
        attemptsCount = attemptRows.length;
        if (attemptRows.length > 0) {
            currentAttemptStartTime = new Date(attemptRows[0].started_at);
        }
    } else {
        // Single-stage game: Count sessions for the game (where stage_id might be null)
        const { rows: attemptRows } = await db.query(
            `SELECT COUNT(*) as count 
             FROM game_sessions 
             WHERE game_id = $1 AND player_id = $2 AND (stage_id IS NULL OR stage_id::text = '')`,
            [gameId, auth.playerId]
        );
        attemptsCount = parseInt(attemptRows[0].count, 10);
    }

    // Filter sessions to only include those from the current attempt
    let currentAttemptSessions = sessions;
    if (currentAttemptStartTime) {
        currentAttemptSessions = sessions.filter(s => {
            const sessionStart = new Date(s.started_at);
            // Allow a small buffer (e.g. 1 second) or just strict inequality?
            // Since Stage 1 starts exactly at currentAttemptStartTime, use >=
            return sessionStart >= currentAttemptStartTime!;
        });
    }

    // 5. Combine Stage Info with Progress
    const stagesWithProgress = stages.map(stage => {
      // Find completed session for this stage (in the current attempt)
      const stageSessions = currentAttemptSessions.filter(s => s.stage_id === stage.id)
      const completedSession = stageSessions.find(s => s.completed_at)
      
      return {
        ...stage,
        is_completed: !!completedSession,
        score: completedSession ? completedSession.score : null,
        session_id: completedSession ? completedSession.id : null
      }
    })

    // 6. Determine Next Action
    // Find the first incomplete stage
    const nextStage = stagesWithProgress.find(s => !s.is_completed)
    const isGameCompleted = stages.length > 0 && !nextStage

    return NextResponse.json({
      game,
      stages: stagesWithProgress,
      next_stage_id: nextStage ? nextStage.id : null,
      is_game_completed: isGameCompleted,
      total_score: stagesWithProgress.reduce((sum, s) => sum + (s.score || 0), 0),
      attempts_count: attemptsCount
    })

  } catch (error) {
    console.error("[v0] Game progress fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch game progress" }, { status: 500 })
  }
}
