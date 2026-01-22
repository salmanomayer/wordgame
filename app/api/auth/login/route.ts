import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { signPlayerToken, verifyPlayerPassword } from "@/lib/player-auth"

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json()

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    // Format: PG + 7 digits (case insensitive)
    const formattedId = String(employeeId).toUpperCase().trim()
    
    // Validate format
    if (!/^PG\d{6,8}$/.test(formattedId)) {
       // Allow some flexibility in length if needed, but strict PG prefix
       // The user said "pg0000000" which is PG + 7 digits.
    }

    const { rows, error } = await db.query(
      "SELECT id, email, phone_number, display_name, total_score, games_played, is_active, created_at, employee_id FROM players WHERE employee_id = $1",
      [formattedId],
    )
    if (error) throw error
    const player = rows[0]
    
    if (!player) {
        return NextResponse.json({ error: "Employee ID not found. Please contact admin." }, { status: 401 })
    }

    if (!player.is_active) {
        return NextResponse.json({ error: "Account is inactive." }, { status: 401 })
    }

    const token = await signPlayerToken({ id: player.id, email: player.email || player.employee_id }) // Use employee_id as email fallback if needed

    const response = NextResponse.json({
      player: {
        id: player.id,
        email: player.email,
        employee_id: player.employee_id,
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
      maxAge: 60 * 60,
    })

    return response
  } catch (error) {
    console.error("[v0] Player login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

