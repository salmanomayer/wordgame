import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get("subject_id")
    const limit = searchParams.get("limit")

    let queryString = "SELECT * FROM words WHERE is_active = TRUE"
    const queryParams = []
    let paramIndex = 1

    if (subjectId) {
      queryString += ` AND subject_id = $${paramIndex}`
      queryParams.push(subjectId)
      paramIndex++
    }

    if (limit) {
      queryString += ` LIMIT $${paramIndex}`
      queryParams.push(Number.parseInt(limit))
      paramIndex++
    }

    const { rows: words, error } = await db.query(queryString, queryParams)

    if (error) throw error

    return NextResponse.json(words)
  } catch (error) {
    console.error("[v0] Words fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch words" }, { status: 500 })
  }
}
