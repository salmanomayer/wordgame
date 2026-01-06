import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

const PLAYER_JWT_SECRET = new TextEncoder().encode(
  process.env.PLAYER_JWT_SECRET || process.env.JWT_SECRET || "your-secret-key-change-in-production",
)

export interface PlayerUser {
  id: string
  email: string
}

export async function verifyPlayerPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export async function hashPlayerPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function signPlayerToken(player: PlayerUser) {
  return new SignJWT({ email: player.email, typ: "player" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(player.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(PLAYER_JWT_SECRET)
}

export async function verifyPlayerToken(token: string): Promise<PlayerUser | null> {
  try {
    const { payload } = await jwtVerify(token, PLAYER_JWT_SECRET)
    if (payload.typ !== "player") return null
    if (typeof payload.sub !== "string") return null
    if (typeof payload.email !== "string") return null
    return { id: payload.sub, email: payload.email }
  } catch {
    return null
  }
}

