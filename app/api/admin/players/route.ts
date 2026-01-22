import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

import { hash } from "bcryptjs"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const q = searchParams.get("q")
      const page = parseInt(searchParams.get("page") || "1")
      const limit = searchParams.get("limit") === "all" ? null : parseInt(searchParams.get("limit") || "20")
      const sortBy = searchParams.get("sort_by") || "created_at"
      const sortOrder = searchParams.get("sort_order") || "desc"

      const allowedSortColumns = [
        "display_name",
        "employee_id",
        "email",
        "phone_number",
        "total_score",
        "games_played",
        "created_at",
        "is_active",
      ]
      const validatedSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "created_at"
      const validatedSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC"

      let whereClause = ""
      const params: any[] = []
      if (q?.trim()) {
        whereClause =
          " WHERE (display_name ILIKE $1 OR employee_id ILIKE $1 OR email ILIKE $1 OR phone_number ILIKE $1 OR id::text ILIKE $1)"
        params.push(`%${q.trim()}%`)
      }

      const countSql = `SELECT COUNT(*) FROM players ${whereClause}`
      const { rows: countRows } = await adminDb.query(countSql, params)
      const totalCount = parseInt(countRows[0].count)

      let sql = `
        SELECT id, employee_id, email, phone_number, display_name, total_score, games_played, is_active, created_at
        FROM players
        ${whereClause}
        ORDER BY ${validatedSortBy} ${validatedSortOrder}
      `
      if (limit !== null) {
        const offset = (page - 1) * limit
        sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
        params.push(limit, offset)
      }

      const { rows } = await adminDb.query(sql, params)
      return NextResponse.json({
        data: rows,
        total: totalCount,
        page,
        limit: limit || totalCount,
      })
    } catch (error) {
      console.error("[v0] Players fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { display_name, email, phone_number, password } = await request.json()

      if (!email && !phone_number) {
          return NextResponse.json({ error: "Email or Phone is required" }, { status: 400 })
      }

      const passwordHash = await hash(password || Math.random().toString(36).slice(-8), 10)

      const { rows } = await adminDb.query(
        `INSERT INTO players (display_name, email, phone_number, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, display_name, email, phone_number, is_active, created_at`,
        [display_name, email || null, phone_number || null, passwordHash]
      )

      return NextResponse.json(rows[0], { status: 201 })
    } catch (error: any) {
      console.error("[v0] Create player error:", error)
      if (error.code === '23505') { // Unique violation
          return NextResponse.json({ error: "Email or Phone already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to create player" }, { status: 500 })
    }
  })
}
