import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const isSecureCookie =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https"
  const response = NextResponse.json({ success: true })
  response.cookies.set("player_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie,
    path: "/",
    maxAge: 0,
  })
  return response
}
