import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: subjects, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("is_active", true)
      .order("difficulty", { ascending: true })

    if (error) throw error

    return NextResponse.json(subjects)
  } catch (error) {
    console.error("[v0] Subjects fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
  }
}
