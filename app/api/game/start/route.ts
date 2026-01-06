import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { requirePlayer } from "@/lib/player-middleware"

export async function POST(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { subject_id, difficulty, is_demo } = await request.json()

    if (!subject_id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }

    const normalizedDifficulty =
      difficulty === "easy" || difficulty === "medium" || difficulty === "hard" ? difficulty : null

    const sessionDifficulty = normalizedDifficulty || "easy"

    // Create game session
    const { rows: sessionRows } = await db.query(
      "INSERT INTO game_sessions (player_id, subject_id, difficulty, total_words, is_demo) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [auth.playerId, subject_id, sessionDifficulty, 5, is_demo || false],
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
