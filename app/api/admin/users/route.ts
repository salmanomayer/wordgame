import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"
import { hash } from "bcryptjs"
import { logAdminAction } from "@/lib/admin-audit"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const q = searchParams.get("q")
      const page = parseInt(searchParams.get("page") || "1")
      const limit = searchParams.get("limit") === "all" ? null : parseInt(searchParams.get("limit") || "20")
      const sortBy = searchParams.get("sort_by") || "created_at"
      const sortOrder = searchParams.get("sort_order") || "desc"

      const allowedSortColumns = ["email", "created_at", "is_active", "role"]
      const validatedSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "created_at"
      const validatedSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC"

      let whereClause = ""
      const params: any[] = []
      if (q?.trim()) {
        whereClause = " WHERE email ILIKE $1"
        params.push(`%${q.trim()}%`)
      }

      const countSql = `SELECT COUNT(*) FROM admin_users ${whereClause}`
      const { rows: countRows } = await adminDb.query(countSql, params)
      const totalCount = parseInt(countRows[0].count)

      let sql = `
        SELECT id, email, role, is_active, created_at, updated_at
        FROM admin_users
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
      console.error("[v0] Admin users fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch admin users" }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const { email, password, role } = await req.json()

      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
      }

      const passwordHash = await hash(password, 10)
      const userRole = role || 'admin'

      const { rows } = await adminDb.query(
        `INSERT INTO admin_users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, is_active, created_at`,
        [email, passwordHash, userRole]
      )

      const newAdmin = rows[0]

      if (admin?.id) {
        await logAdminAction({
          adminId: admin.id,
          action: "CREATE",
          resourceType: "ADMIN_USER",
          resourceId: newAdmin.id,
          details: { email, role: userRole }
        })
      }

      return NextResponse.json(newAdmin, { status: 201 })
    } catch (error: any) {
      console.error("[v0] Create admin user error:", error)
      if (error.code === '23505') {
          return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 })
    }
  })
}
