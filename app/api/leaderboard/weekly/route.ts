import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const isChallenge = searchParams.get("is_challenge") === "true"

  try {
    const { rows: data, error } = await db.query("SELECT * FROM get_weekly_leaderboard($1, $2)", [10, isChallenge])

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Weekly leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch weekly leaderboard" }, { status: 500 })
  }
}
