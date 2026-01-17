import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { signPlayerToken } from "@/lib/player-auth"

export async function POST(request: NextRequest) {
  try {
    const { phone_number, otp } = await request.json()

    if (!phone_number || !otp) {
      return NextResponse.json({ error: "Phone number and OTP are required" }, { status: 400 })
    }

    const normalizedPhone = phone_number.trim()

    // TODO: Verify OTP from database/storage
    // For now, this is a placeholder - you need to implement proper OTP verification
    // Check OTP against stored OTP in database with expiration time

    // Find player by phone number
    const { rows, error } = await db.query(
      "SELECT id, phone_number, email, display_name, total_score, games_played, is_active, created_at FROM players WHERE phone_number = $1",
      [normalizedPhone]
    )

    if (error) {
      console.error("[v0] Player lookup error:", error)
      return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid phone number or OTP" }, { status: 401 })
    }

    const player = rows[0]

    // TODO: Verify OTP here
    // For now, accept any 6-digit OTP (remove in production!)
    if (otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 })
    }

    // Sign token for player
    const token = await signPlayerToken({ 
      id: player.id, 
      email: player.email || player.phone_number 
    })

    const response = NextResponse.json({
      player: {
        id: player.id,
        phone_number: player.phone_number,
        email: player.email,
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
    console.error("[v0] Verify OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

