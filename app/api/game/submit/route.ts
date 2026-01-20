import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requirePlayer } from "@/lib/player-middleware"

export async function POST(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { session_id, word_id, answer, is_correct, time_taken } = await request.json()

    if (!session_id || !word_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { rows: sessionRows, error: sessionError } = await db.query(
      "SELECT id, subject_id FROM game_sessions WHERE id = $1 AND player_id = $2",
      [session_id, auth.playerId],
    )
    if (sessionError) throw sessionError
    const session = sessionRows[0]
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const { rows: wordRows, error: wordError } = await db.query(
      "SELECT id, word FROM words WHERE id = $1 AND subject_id = $2",
      [word_id, session.subject_id],
    )
    if (wordError) throw wordError
    const word = wordRows[0]
    if (!word?.word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 })
    }

    const resolvedIsCorrect =
      typeof is_correct === "boolean"
        ? is_correct
        : typeof answer === "string"
          ? answer.trim().toUpperCase() === String(word.word).trim().toUpperCase()
          : null

    if (resolvedIsCorrect === null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Save answer
    const { error } = await db.query(
      "INSERT INTO game_answers (game_session_id, word_id, is_correct, time_taken) VALUES ($1, $2, $3, $4)",
      [session_id, word_id, resolvedIsCorrect, typeof time_taken === "number" ? time_taken : null],
    )
    if (error) throw error

    return NextResponse.json({
      is_correct: resolvedIsCorrect,
      correct_answer: word.word,
    })
  } catch (error) {
    console.error("[v0] Submit answer error:", error)
    return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 })
  }
}
