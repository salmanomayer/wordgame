import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const supabase = createAdminClient()

      const { data: subjects, error } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      return NextResponse.json(subjects)
    } catch (error) {
      console.error("[v0] Subjects fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { name, description, is_active } = await request.json()
      const supabase = createAdminClient()

      const { data, error } = await supabase.from("subjects").insert({ name, description, is_active }).select().single()

      if (error) throw error

      return NextResponse.json(data)
    } catch (error) {
      console.error("[v0] Subject create error:", error)
      return NextResponse.json({ error: "Failed to create subject" }, { status: 500 })
    }
  })
}
