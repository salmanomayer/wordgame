import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: subject, error } = await supabase.from("subjects").select("*").eq("id", id).single()

    if (error) throw error

    return NextResponse.json(subject)
  } catch (error) {
    console.error("[v0] Subject fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subject" }, { status: 404 })
  }
}
