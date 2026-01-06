import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { requirePlayer } from "@/lib/player-middleware"

export async function GET(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { rows: playerRows } = await db.query(
      "SELECT id, email, phone_number, display_name, total_score, games_played, is_active, created_at FROM players WHERE id = $1",
      [auth.playerId],
    )

    const player = playerRows[0]
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 })

    return NextResponse.json(player)
  } catch (error) {
    console.error("[v0] Player profile error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePlayer(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { display_name, phone_number } = await request.json()

    const updateFields: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (display_name !== undefined) {
      updateFields.push(`display_name = $${paramIndex}`)
      params.push(display_name)
      paramIndex++
    }
    if (phone_number !== undefined) {
      updateFields.push(`phone_number = $${paramIndex}`)
      params.push(phone_number)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 })
    }

    params.push(auth.playerId)

    const { rows: playerRows } = await db.query(
      `UPDATE players SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING id, email, phone_number, display_name, total_score, games_played, is_active, created_at`,
      params,
    )

    const player = playerRows[0]
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 })

    return NextResponse.json(player)
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
