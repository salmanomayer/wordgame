import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get("subject_id")
    const limit = searchParams.get("limit")

    const supabase = await createClient()
    let query = supabase.from("words").select("*").eq("is_active", true)

    if (subjectId) {
      query = query.eq("subject_id", subjectId)
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit))
    }

    const { data: words, error } = await query

    if (error) throw error

    return NextResponse.json(words)
  } catch (error) {
    console.error("[v0] Words fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch words" }, { status: 500 })
  }
}
