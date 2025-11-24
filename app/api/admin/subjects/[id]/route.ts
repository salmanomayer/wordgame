import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const { name, difficulty, description, is_active } = await request.json()
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from("subjects")
        .update({ name, difficulty, description, is_active })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(data)
    } catch (error) {
      console.error("[v0] Subject update error:", error)
      return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const supabase = createAdminClient()

      const { error } = await supabase.from("subjects").delete().eq("id", id)

      if (error) throw error

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Subject delete error:", error)
      return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 })
    }
  })
}
