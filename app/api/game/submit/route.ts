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

    const { session_id, word_id, answer, time_taken } = await request.json()

    if (!session_id || !word_id || answer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the correct word
    const { data: word } = await supabase.from("words").select("word").eq("id", word_id).single()

    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 })
    }

    const isCorrect = answer.toUpperCase() === word.word.toUpperCase()

    // Save answer
    const { error } = await supabase.from("game_answers").insert({
      game_session_id: session_id,
      word_id,
      is_correct: isCorrect,
      time_taken: time_taken || null,
    })

    if (error) throw error

    return NextResponse.json({
      is_correct: isCorrect,
      correct_answer: word.word,
    })
  } catch (error) {
    console.error("[v0] Submit answer error:", error)
    return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 })
  }
}
