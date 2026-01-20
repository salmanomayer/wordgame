import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPlayerPassword, signPlayerToken } from "@/lib/player-auth"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const provider = searchParams.get("provider") || ""
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const next = state ?? searchParams.get("next") ?? "/play/dashboard"
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")

  // Handle OAuth errors
  if (error) {
    console.error("[v0] OAuth error:", error, error_description)
    return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent(error_description || error)}`)
  }

  if (!code || !provider) {
    return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent("Invalid OAuth callback")}`)
  }

  try {
    let email: string | null = null
    let displayName: string | null = null

    if (provider === "google") {
      const client_id = process.env.GOOGLE_CLIENT_ID || ""
      const client_secret = process.env.GOOGLE_CLIENT_SECRET || ""
      const redirect_uri = `${origin}/auth/callback?provider=google`

      if (!client_id || !client_secret) {
        return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent("Google OAuth not configured")}`)
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id,
          client_secret,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      })
      const tokenJson = await tokenRes.json().catch(() => ({} as any))
      const access_token = tokenJson?.access_token as string | undefined
      if (!tokenRes.ok || !access_token) {
        const msg = tokenJson?.error_description || tokenJson?.error || "Failed to exchange Google code"
        return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent(msg)}`)
      }

      const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      const user = await userRes.json().catch(() => ({} as any))
      email = (user?.email as string | undefined) || null
      displayName = (user?.name as string | undefined) || (user?.given_name as string | undefined) || null
    } else if (provider === "facebook") {
      const client_id = process.env.FACEBOOK_CLIENT_ID || ""
      const client_secret = process.env.FACEBOOK_CLIENT_SECRET || ""
      const redirect_uri = `${origin}/auth/callback?provider=facebook`

      if (!client_id || !client_secret) {
        return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent("Facebook OAuth not configured")}`)
      }

      const tokenUrl = new URL("https://graph.facebook.com/v17.0/oauth/access_token")
      tokenUrl.searchParams.set("client_id", client_id)
      tokenUrl.searchParams.set("redirect_uri", redirect_uri)
      tokenUrl.searchParams.set("client_secret", client_secret)
      tokenUrl.searchParams.set("code", code)

      const tokenRes = await fetch(tokenUrl, { method: "GET" })
      const tokenJson = await tokenRes.json().catch(() => ({} as any))
      const access_token = tokenJson?.access_token as string | undefined
      if (!tokenRes.ok || !access_token) {
        const msg = tokenJson?.error?.message || "Failed to exchange Facebook code"
        return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent(msg)}`)
      }

      const userUrl = new URL("https://graph.facebook.com/me")
      userUrl.searchParams.set("fields", "id,name,email")
      userUrl.searchParams.set("access_token", access_token)
      const userRes = await fetch(userUrl, { method: "GET" })
      const user = await userRes.json().catch(() => ({} as any))
      email = (user?.email as string | undefined) || null
      displayName = (user?.name as string | undefined) || null
    } else {
      return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent("Unsupported provider")}`)
    }

    if (!email) {
      return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent("Unable to retrieve email")}`)
    }

    const normalizedEmail = email.toLowerCase()
    const { rows: existingRows } = await db.query(
      "SELECT id, email, phone_number, display_name, total_score, games_played, is_active, created_at FROM players WHERE email = $1",
      [normalizedEmail],
    )

    let player = existingRows[0]
    if (!player) {
      const randomSecret = Math.random().toString(36).slice(2) + Date.now().toString(36)
      const passwordHash = await hashPlayerPassword(randomSecret)
      const { rows: createdRows } = await db.query(
        "INSERT INTO players (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, phone_number, display_name, total_score, games_played, is_active, created_at",
        [normalizedEmail, passwordHash, displayName],
      )
      player = createdRows[0]
    }

    const token = await signPlayerToken({ id: player.id, email: player.email })
    const response = NextResponse.redirect(`${origin}${next}`)

    const isSecureCookie =
      (origin.startsWith("https://")) || false

    response.cookies.set("player_token", token, {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (err) {
    console.error("[v0] OAuth callback error:", err)
    return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent("OAuth failed")}`)
  }

  // Fallback
  // No code present, redirect to login
  // Should not reach here due to returns above
  // Keep for safety
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return NextResponse.redirect(`${origin}/play/login`)
}
