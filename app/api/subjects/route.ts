import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { rows: subjects, error } = await db.query(
      "SELECT * FROM subjects WHERE is_active = TRUE ORDER BY name ASC"
    )

    if (error) throw error

    return NextResponse.json(subjects)
  } catch (error) {
    console.error("[v0] Subjects fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
  }
}
