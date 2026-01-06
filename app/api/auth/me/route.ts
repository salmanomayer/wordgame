import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { requirePlayer } from "@/lib/player-middleware"

export async function GET(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { rows, error } = await db.query(
      "SELECT id, email, phone_number, display_name, total_score, games_played, is_active, created_at FROM players WHERE id = $1",
      [auth.playerId],
    )
    if (error) throw error
    const player = rows[0]
    if (!player) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    return NextResponse.json({ player })
  } catch (error) {
    console.error("[v0] Player me error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

