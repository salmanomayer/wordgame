import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { rows: data, error } = await db.query("SELECT * FROM get_monthly_leaderboard($1)", [10])

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Monthly leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch monthly leaderboard" }, { status: 500 })
  }
}
