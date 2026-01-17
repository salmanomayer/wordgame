import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"
import { signPlayerToken } from "@/lib/player-auth"

export async function POST(request: NextRequest) {
  try {
    const { phone_number } = await request.json()

    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const normalizedPhone = phone_number.trim()

    // Check if player exists with this phone number
    const { rows, error } = await db.query(
      "SELECT id, phone_number, email, display_name, total_score, games_played, is_active, created_at FROM players WHERE phone_number = $1",
      [normalizedPhone]
    )

    if (error) {
      console.error("[v0] Mobile login database error:", error)
      return NextResponse.json({ error: "Failed to login" }, { status: 500 })
    }

    let player = rows[0]

    // If player doesn't exist, create one automatically
    if (!player) {
      // Generate a unique dummy email from phone number (required field)
      const phoneDigits = normalizedPhone.replace(/[^0-9]/g, '')
      const dummyEmail = `phone_${phoneDigits}_${Date.now()}@mobile.local`
      
      // Use a dummy password hash (required field but not used for mobile login)
      const dummyPasswordHash = 'mobile_login_no_password_required'
      
      const { rows: newPlayerRows, error: createError } = await db.query(
        "INSERT INTO players (phone_number, email, password_hash) VALUES ($1, $2, $3) RETURNING id, phone_number, email, display_name, total_score, games_played, is_active, created_at",
        [normalizedPhone, dummyEmail, dummyPasswordHash]
      )

      if (createError) {
        console.error("[v0] Player creation error:", createError)
        const errorMessage = createError instanceof Error ? createError.message : String(createError)
        console.error("[v0] Full error details:", errorMessage)
        return NextResponse.json({ 
          error: "Failed to create account: " + errorMessage
        }, { status: 500 })
      }

      if (!newPlayerRows || newPlayerRows.length === 0) {
        console.error("[v0] Player creation: No data returned")
        return NextResponse.json({ error: "Failed to create account: No data returned" }, { status: 500 })
      }

      player = newPlayerRows[0]
      console.log("[v0] Player created successfully:", player.id)
    }

    // Check if player is active
    if (!player.is_active) {
      return NextResponse.json({ error: "Your account is not active. Please contact support." }, { status: 403 })
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
    console.error("[v0] Mobile login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

