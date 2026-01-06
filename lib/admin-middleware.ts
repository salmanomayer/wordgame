import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken, type AdminUser } from "./admin-auth"
import { checkPermission, type AdminRole, type Resource, type Permission } from "./permissions"

export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, admin: AdminUser) => Promise<NextResponse>,
) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const admin = await verifyAdminToken(token)

  if (!admin) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }

  return handler(request, admin)
}

export async function requireAdmin(request: NextRequest): Promise<{ admin: AdminUser } | NextResponse> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const admin = await verifyAdminToken(token)

  if (!admin) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  return { admin }
}

export async function requireAdminWithPermission(
  request: NextRequest,
  resource: Resource,
  permission: Permission,
): Promise<{ admin: AdminUser } | NextResponse> {
  const result = await requireAdmin(request)

  if (result instanceof NextResponse) {
    return result
  }

  const hasPermission = await checkPermission((result.admin.role as AdminRole) || "admin", resource, permission)

  if (!hasPermission) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  return result
}
