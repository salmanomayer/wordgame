import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const isChallenge = searchParams.get("is_challenge") === "true"

  try {
    // Fetch top 1000 to allow finding user's rank context client-side
    const { rows: data, error } = await db.query("SELECT * FROM get_monthly_leaderboard($1, $2)", [1000, isChallenge])

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Monthly leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch monthly leaderboard" }, { status: 500 })
  }
}
