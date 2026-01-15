import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { requirePlayer } from "@/lib/player-middleware"

// List available games for the logged-in player
export async function GET(request: NextRequest) {


  try {
    // Only return active games that are currently available to play
    const { rows, error } = await db.query(
      `
      SELECT
        g.id,
        g.title,
        g.start_time,
        g.end_time,
        g.correct_marks,
        g.time_per_word,
        g.word_count,
        g.difficulty,
        g.is_active
         FROM games g
      WHERE
        g.is_active = TRUE 
        AND (
          (g.start_time IS NULL AND g.end_time IS NULL)
          OR
          (g.start_time IS NOT NULL AND g.end_time IS NOT NULL 
           AND NOW() >= g.start_time AND NOW() <= g.end_time)
        )
        ORDER BY g.created_at DESC
      `,
    )

    if (error) {
      throw error
    }

    return NextResponse.json({
      games: rows,
    })
  } catch (error) {
    console.error("[v0] Game list error:", error)
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
  }
}

