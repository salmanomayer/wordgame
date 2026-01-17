import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { phone_number } = await request.json()

    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const normalizedPhone = phone_number.trim()

    // TODO: Implement actual OTP sending logic here
    // For now, generate a simple OTP and store it (you'll need to implement proper OTP storage)
    const otp = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit OTP
    
    // Check if player exists with this phone number
    const { rows: existingRows, error: checkError } = await db.query(
      "SELECT id, phone_number FROM players WHERE phone_number = $1",
      [normalizedPhone]
    )

    if (checkError) {
      console.error("[v0] Phone check error:", checkError)
      return NextResponse.json({ error: "Failed to check phone number" }, { status: 500 })
    }

    // If player doesn't exist, create one
    if (existingRows.length === 0) {
      // Create player with phone number (no password for OTP login)
      const { rows: newPlayerRows, error: createError } = await db.query(
        "INSERT INTO players (phone_number) VALUES ($1) RETURNING id, phone_number",
        [normalizedPhone]
      )

      if (createError) {
        console.error("[v0] Player creation error:", createError)
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
      }
    }

    // TODO: Store OTP in database with expiration time
    // TODO: Send OTP via SMS service (Twilio, etc.)
    // For now, just log it (remove in production!)
    console.log(`[v0] OTP for ${normalizedPhone}: ${otp}`)

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent successfully",
      // Remove this in production - only for testing
      otp: process.env.NODE_ENV === "development" ? otp : undefined
    })
  } catch (error) {
    console.error("[v0] Send OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

