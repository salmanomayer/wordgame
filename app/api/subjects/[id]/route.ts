import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { rows: subject, error } = await db.query("SELECT * FROM subjects WHERE id = $1", [id])

    if (error) throw error
    if (subject.length === 0) return NextResponse.json({ error: "Subject not found" }, { status: 404 })

    return NextResponse.json(subject[0])
  } catch (error) {
    console.error("[v0] Subject fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subject" }, { status: 404 })
  }
}
