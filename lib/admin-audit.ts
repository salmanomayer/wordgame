import { adminDb } from "@/lib/db"
import { headers } from "next/headers"

export type AdminAuditAction = 
  | "LOGIN"
  | "CREATE"
  | "UPDATE" 
  | "DELETE"
  | "IMPORT"
  | "EXPORT"
  | "ACTIVATE"
  | "DEACTIVATE"

export type AdminAuditResource = 
  | "ADMIN_USER"
  | "PLAYER"
  | "GAME"
  | "SUBJECT"
  | "WORD"
  | "SETTINGS"
  | "SYSTEM"

interface LogAdminActionParams {
  adminId: string
  action: AdminAuditAction
  resourceType: AdminAuditResource
  resourceId?: string
  details?: Record<string, any>
}

export async function logAdminAction({
  adminId,
  action,
  resourceType,
  resourceId,
  details = {}
}: LogAdminActionParams) {
  try {
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    await adminDb.query(
      `INSERT INTO admin_audit_logs 
       (admin_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        adminId, 
        action, 
        resourceType, 
        resourceId || null, 
        JSON.stringify(details),
        ip,
        userAgent
      ]
    )
  } catch (error) {
    console.error("Failed to log admin action:", error)
    // Don't throw, we don't want to break the main flow if logging fails
  }
}
