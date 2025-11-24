import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subject_id, is_demo } = await request.json()

    if (!subject_id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }

    // Get subject difficulty
    const { data: subject } = await supabase.from("subjects").select("difficulty").eq("id", subject_id).single()

    // Get random words for the subject
    const { data: words } = await supabase.from("words").select("*").eq("subject_id", subject_id).eq("is_active", true)

    if (!words || words.length < 5) {
      return NextResponse.json({ error: "Not enough words in this subject" }, { status: 400 })
    }

    // Shuffle and select 5 words
    const shuffled = words.sort(() => Math.random() - 0.5)
    const selectedWords = shuffled.slice(0, 5)

    // Create game session
    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        player_id: user.id,
        subject_id,
        difficulty: subject?.difficulty || "easy",
        total_words: 5,
        is_demo: is_demo || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      session_id: session.id,
      words: selectedWords,
    })
  } catch (error) {
    console.error("[v0] Game start error:", error)
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }
}
