import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { signPlayerToken, verifyPlayerPassword } from "@/lib/player-auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const { rows, error } = await db.query(
      "SELECT id, email, password_hash, phone_number, display_name, total_score, games_played, is_active, created_at FROM players WHERE email = $1",
      [String(email).toLowerCase()],
    )
    if (error) throw error
    const player = rows[0]
    if (!player) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    const isValid = await verifyPlayerPassword(String(password), String(player.password_hash))
    if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    const token = await signPlayerToken({ id: player.id, email: player.email })

    const response = NextResponse.json({
      player: {
        id: player.id,
        email: player.email,
        phone_number: player.phone_number,
        display_name: player.display_name,
        total_score: player.total_score,
        games_played: player.games_played,
        is_active: player.is_active,
        created_at: player.created_at,
      },
    })

    const isSecureCookie =
      request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https"

    response.cookies.set("player_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureCookie,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error("[v0] Player login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

