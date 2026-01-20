import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { hashPlayerPassword } from "@/lib/player-auth"

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Hash the token to verify
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    // Find valid token
    const { rows: tokenRows, error: tokenError } = await db.query(
      `SELECT user_id, expires_at, used_at 
       FROM password_reset_tokens 
       WHERE token_hash = $1`,
      [tokenHash],
    )

    if (tokenError) throw tokenError

    const tokenRecord = tokenRows[0]

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    if (tokenRecord.used_at) {
      return NextResponse.json({ error: "Token has already been used" }, { status: 400 })
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    // Update password
    const passwordHash = await hashPlayerPassword(newPassword)

    // Start transaction
    await db.query("BEGIN")

    try {
      // Update player password
      await db.query("UPDATE players SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
        passwordHash,
        tokenRecord.user_id,
      ])

      // Mark token as used
      await db.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1", [tokenHash])

      await db.query("COMMIT")

      return NextResponse.json({ success: true })
    } catch (err) {
      await db.query("ROLLBACK")
      throw err
    }
  } catch (error) {
    console.error("[v0] Server error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
