import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/supabase/server"

const nodemailer = require("nodemailer") as any

function getRequestOrigin(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto")
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  if (proto && host) return `${proto}://${host}`
  return request.nextUrl.origin
}

function getMailer() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase()
    const { rows: playerRows, error: playerError } = await db.query("SELECT id FROM players WHERE email = $1", [
      normalizedEmail,
    ])
    if (playerError) throw playerError
    const playerId = playerRows[0]?.id as string | undefined

    let resetUrl: string | null = null

    if (playerId) {
      const rawToken = crypto.randomBytes(32).toString("hex")
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      const { error: insertError } = await db.query(
        "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        [playerId, tokenHash, expiresAt],
      )
      if (insertError) throw insertError

      const origin = getRequestOrigin(request)
      resetUrl = `${origin}/play/reset-password?token=${encodeURIComponent(rawToken)}`

      const from = process.env.SMTP_FROM
      const mailer = from ? getMailer() : null
      if (mailer && from) {
        await mailer.sendMail({
          from,
          to: normalizedEmail,
          subject: "Reset your password",
          text: `Reset your password using this link: ${resetUrl}`,
          html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        })
      }
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true, reset_url: resetUrl })
  } catch (error) {
    console.error("[v0] Server error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
