import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch top 1000 for the challenge leaderboard
    const { rows: data, error } = await db.query("SELECT * FROM get_challenge_leaderboard($1)", [1000])

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Challenge leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch challenge leaderboard" }, { status: 500 })
  }
}
