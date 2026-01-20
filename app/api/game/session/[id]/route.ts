"use server"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requirePlayer } from "@/lib/player-middleware"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const { rows } = await db.query(
      "SELECT id, player_id, game_id, stage_id, subject_id, difficulty, score, words_completed, total_words, started_at, completed_at, is_demo FROM game_sessions WHERE id = $1 AND player_id = $2",
      [id, auth.playerId],
    )

    const session = rows[0]
    if (!session) {
      return NextResponse.json({ error: "Game session not found" }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("[v0] Game session fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch game session" }, { status: 500 })
  }
}

