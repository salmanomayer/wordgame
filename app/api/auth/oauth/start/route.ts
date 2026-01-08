"use server"

import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin
  const provider = url.searchParams.get("provider") || ""
  const next = url.searchParams.get("next") || "/play/dashboard"

  if (!provider) {
    return NextResponse.json({ error: "Missing provider" }, { status: 400 })
  }

  try {
    if (provider === "google") {
      const client_id = process.env.GOOGLE_CLIENT_ID || ""
      const redirect_uri = `${origin}/auth/callback?provider=google`
      const scope = encodeURIComponent("openid email profile")
      if (!client_id) {
        return NextResponse.json({ error: "Google OAuth not configured" }, { status: 400 })
      }
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(client_id)}` +
        `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${encodeURIComponent(next)}`
      return NextResponse.redirect(authUrl)
    }

    if (provider === "facebook") {
      const client_id = process.env.FACEBOOK_CLIENT_ID || ""
      const redirect_uri = `${origin}/auth/callback?provider=facebook`
      const scope = encodeURIComponent("email,public_profile")
      if (!client_id) {
        return NextResponse.json({ error: "Facebook OAuth not configured" }, { status: 400 })
      }
      const authUrl =
        `https://www.facebook.com/v17.0/dialog/oauth` +
        `?client_id=${encodeURIComponent(client_id)}` +
        `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&state=${encodeURIComponent(next)}`
      return NextResponse.redirect(authUrl)
    }

    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 })
  } catch (err) {
    console.error("[v0] OAuth start error:", err)
    return NextResponse.json({ error: "OAuth initialization failed" }, { status: 500 })
  }
}
