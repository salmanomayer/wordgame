import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/admin") ||
    request.nextUrl.pathname.startsWith("/play/instant") ||
    request.nextUrl.pathname.startsWith("/play/demo") ||
    request.nextUrl.pathname.startsWith("/play/signup") ||
    request.nextUrl.pathname.startsWith("/play/login") ||
    request.nextUrl.pathname.startsWith("/play/verify-otp") ||
    request.nextUrl.pathname.startsWith("/play/dashboard") ||
    request.nextUrl.pathname.startsWith("/play/leaderboard")

  if (isPublicRoute || !supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && request.nextUrl.pathname === "/play/categories") {
    const url = request.nextUrl.clone()
    url.pathname = "/play/dashboard"
    return NextResponse.redirect(url)
  }

  if (!user && request.nextUrl.pathname.startsWith("/play")) {
    const url = request.nextUrl.clone()
    url.pathname = "/play/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
