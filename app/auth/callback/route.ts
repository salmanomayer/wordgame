import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/play/dashboard"
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")

  // Handle OAuth errors
  if (error) {
    console.error("[v0] OAuth error:", error, error_description)
    return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    return NextResponse.redirect(`${origin}/play/login?error=${encodeURIComponent("OAuth not supported")}`)
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/play/login`)
}
