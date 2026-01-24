import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const q = searchParams.get("q")
      const page = parseInt(searchParams.get("page") || "1")
      const limit = searchParams.get("limit") === "all" ? null : parseInt(searchParams.get("limit") || "20")
      const sortBy = searchParams.get("sort_by") || "created_at"
      const sortOrder = searchParams.get("sort_order") || "desc"

      const allowedSortColumns = ["action", "resource_type", "resource_id", "admin_email", "ip_address", "created_at"]
      const validatedSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "created_at"
      const validatedSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC"

      let whereClause = ""
      const params: any[] = []
      
      if (q?.trim()) {
        whereClause = `
          WHERE (
            al.action ILIKE $1 OR 
            al.resource_type ILIKE $1 OR 
            al.resource_id ILIKE $1 OR 
            au.email ILIKE $1 OR
            al.ip_address ILIKE $1
          )
        `
        params.push(`%${q.trim()}%`)
      }

      const countSql = `
        SELECT COUNT(*) 
        FROM admin_audit_logs al
        JOIN admin_users au ON al.admin_id = au.id
        ${whereClause}
      `
      const { rows: countRows } = await adminDb.query(countSql, params)
      const totalCount = parseInt(countRows[0].count)

      let sql = `
        SELECT 
          al.id, 
          al.action, 
          al.resource_type, 
          al.resource_id, 
          al.details, 
          al.ip_address, 
          al.created_at,
          au.email as admin_email
        FROM admin_audit_logs al
        JOIN admin_users au ON al.admin_id = au.id
        ${whereClause}
        ORDER BY ${validatedSortBy === 'admin_email' ? 'au.email' : `al.${validatedSortBy}`} ${validatedSortOrder}
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
      console.error("[v0] Audit logs fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }
  })
}
