import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const subjectId = searchParams.get("subject_id")

      const supabase = createAdminClient()
      let query = supabase.from("words").select("*")

      if (subjectId) {
        query = query.eq("subject_id", subjectId)
      }

      const { data: words, error } = await query.order("created_at", { ascending: false })

      if (error) throw error

      return NextResponse.json(words)
    } catch (error) {
      console.error("[v0] Words fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch words" }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { word, hint, subject_id } = await request.json()
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from("words")
        .insert({ word: word.toUpperCase(), hint, subject_id })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(data)
    } catch (error) {
      console.error("[v0] Word create error:", error)
      return NextResponse.json({ error: "Failed to create word" }, { status: 500 })
    }
  })
}
