import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const supabase = createAdminClient()

      const { data: players, error } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Fetch emails from auth.users for each player
      const playersWithEmail = await Promise.all(
        (players || []).map(async (player) => {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(player.id)
            return {
              ...player,
              email: userData?.user?.email || null,
            }
          } catch {
            return { ...player, email: null }
          }
        }),
      )

      return NextResponse.json(playersWithEmail)
    } catch (error) {
      console.error("[v0] Players fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
    }
  })
}
