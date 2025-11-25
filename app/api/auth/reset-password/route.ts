import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Hash the token to verify
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    // Step 1: Find and verify the token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("user_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .single()

    if (tokenError || !tokenRecord) {
      console.error("[v0] Token not found:", tokenError)
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }

    // Step 2: Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: "Reset link has expired" }, { status: 400 })
    }

    // Step 3: Check if token was already used
    if (tokenRecord.used_at) {
      return NextResponse.json({ error: "This reset link has already been used" }, { status: 400 })
    }

    // Step 4: Update user password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(tokenRecord.user_id, {
      password: newPassword,
    })

    if (updateError) {
      console.error("[v0] Failed to update password:", updateError)
      return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
    }

    // Step 5: Mark token as used
    const { error: markUsedError } = await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token_hash", tokenHash)

    if (markUsedError) {
      console.error("[v0] Failed to mark token as used:", markUsedError)
      // Don't fail the request, password was already updated
    }

    return NextResponse.json({
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("[v0] Server error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
