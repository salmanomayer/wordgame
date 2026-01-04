import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://puzzleword.vercel.app"}/play/reset-password`,
    })

    if (error) {
      console.error("[v0] Password reset error:", error.message)
    }

    // Don't reveal if email exists (security best practice)
    return NextResponse.json({
      message: "If an account exists with this email, you will receive a password reset link",
    })
  } catch (error) {
    console.error("[v0] Server error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
