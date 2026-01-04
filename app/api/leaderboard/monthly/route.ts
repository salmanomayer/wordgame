import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_monthly_leaderboard", {
      limit_count: 10,
    })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Monthly leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch monthly leaderboard" }, { status: 500 })
  }
}
