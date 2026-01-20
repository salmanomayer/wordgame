import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const subjectId = searchParams.get("subject_id")
      const q = searchParams.get("q")
      const page = parseInt(searchParams.get("page") || "1")
      const limit = searchParams.get("limit") === "all" ? null : parseInt(searchParams.get("limit") || "20")
      const sortBy = searchParams.get("sort_by") || "created_at"
      const sortOrder = searchParams.get("sort_order") || "desc"

      // Validate sort column to prevent SQL injection
      const allowedSortColumns = ["word", "hint", "subject_name", "created_at"]
      const validatedSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "created_at"
      const validatedSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC"

      let baseSql = "FROM words w JOIN subjects s ON s.id = w.subject_id"
      const params: any[] = []
      let paramIndex = 1
      let whereStarted = false
      let whereClause = ""

      if (subjectId) {
        whereClause += ` WHERE w.subject_id = $${paramIndex}`
        params.push(subjectId)
        paramIndex++
        whereStarted = true
      }

      const trimmed = q?.trim()
      if (trimmed) {
        whereClause += whereStarted ? " AND" : " WHERE"
        whereClause += ` (w.word ILIKE $${paramIndex} OR w.hint ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex})`
        params.push(`%${trimmed}%`)
        paramIndex++
        whereStarted = true
      }

      // Get total count for pagination
      const countSql = `SELECT COUNT(*) ${baseSql} ${whereClause}`
      const { rows: countRows } = await adminDb.query(countSql, params)
      const totalCount = parseInt(countRows[0].count)

      // Get paginated data
      let sql = `SELECT w.*, s.name AS subject_name ${baseSql} ${whereClause}`
      
      // Use validated sort column
      const sortColumn = validatedSortBy === "subject_name" ? "s.name" : `w.${validatedSortBy}`
      sql += ` ORDER BY ${sortColumn} ${validatedSortOrder}`

      if (limit !== null) {
        const offset = (page - 1) * limit
        sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
        params.push(limit, offset)
      }

      const { rows } = await adminDb.query(sql, params)
      return NextResponse.json({
        data: rows,
        total: totalCount,
        page,
        limit: limit || totalCount
      })
    } catch (error) {
      console.error("[v0] Words fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch words" }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { word, hint, subject_id } = await request.json()
      const { rows } = await adminDb.query(
        "INSERT INTO words (word, hint, subject_id) VALUES ($1, $2, $3) RETURNING *",
        [String(word).toUpperCase(), hint, subject_id]
      )
      return NextResponse.json(rows[0])
    } catch (error) {
      console.error("[v0] Word create error:", error)
      return NextResponse.json({ error: "Failed to create word" }, { status: 500 })
    }
  })
}
