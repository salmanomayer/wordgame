import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { hashPlayerPassword, signPlayerToken } from "@/lib/player-auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase()
    const normalizedPassword = String(password)

    if (normalizedPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const { rows: existingRows, error: existingError } = await db.query("SELECT id FROM players WHERE email = $1", [
      normalizedEmail,
    ])
    if (existingError) throw existingError
    if (existingRows.length > 0) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 })
    }

    const passwordHash = await hashPlayerPassword(normalizedPassword)
    const { rows: playerRows, error: insertError } = await db.query(
      "INSERT INTO players (email, password_hash) VALUES ($1, $2) RETURNING id, email, phone_number, display_name, total_score, games_played, is_active, created_at",
      [normalizedEmail, passwordHash],
    )
    if (insertError) throw insertError
    const player = playerRows[0]
    if (!player) return NextResponse.json({ error: "Signup failed" }, { status: 500 })

    const token = await signPlayerToken({ id: player.id, email: player.email })

    const response = NextResponse.json({ player })
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
    console.error("[v0] Player signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
