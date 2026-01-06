import { type NextRequest, NextResponse } from "next/server"
import { verifyPlayerToken } from "./player-auth"

export async function requirePlayer(request: NextRequest): Promise<{ playerId: string } | NextResponse> {
  const cookieToken = request.cookies.get("player_token")?.value
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null
  const token = cookieToken || bearerToken

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const player = await verifyPlayerToken(token)
  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return { playerId: player.id }
}

