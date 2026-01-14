import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { requirePlayer } from "@/lib/player-middleware"

export async function POST(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { subject_id, difficulty, is_demo, game_id } = await request.json()

    if (!subject_id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }

    const normalizedDifficulty =
      difficulty === "easy" || difficulty === "medium" || difficulty === "hard" ? difficulty : null

    let sessionDifficulty = normalizedDifficulty || "easy"
    let totalWords = 5
    let gameIdValue: string | null = null

    if (game_id) {
      const { rows: gameRows } = await db.query(
        "SELECT id, attempts_limit, word_count, difficulty FROM games WHERE id = $1",
        [game_id]
      )
      const game = gameRows[0]
      if (!game?.id) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 })
      }

      if (game.attempts_limit !== null && game.attempts_limit !== undefined) {
        const { rows: countRows } = await db.query(
          "SELECT COUNT(*)::int AS cnt FROM game_sessions WHERE player_id = $1 AND game_id = $2 AND completed_at IS NOT NULL",
          [auth.playerId, game.id]
        )
        const playedCount = countRows[0]?.cnt ?? 0
        if (playedCount >= game.attempts_limit) {
          return NextResponse.json({ error: "Attempts limit reached for this game" }, { status: 403 })
        }
      }

      gameIdValue = game.id
      totalWords = typeof game.word_count === "number" ? game.word_count : totalWords
      sessionDifficulty = normalizedDifficulty || game.difficulty || sessionDifficulty
    }

    // Create game session
    const { rows: sessionRows } = await db.query(
      "INSERT INTO game_sessions (player_id, game_id, subject_id, difficulty, total_words, is_demo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [auth.playerId, gameIdValue, subject_id, sessionDifficulty, totalWords, is_demo || false],
    )
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
