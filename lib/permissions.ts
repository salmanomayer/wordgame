import { adminDb } from "./supabase/admin"

export type AdminRole = "super_admin" | "admin" | "moderator"
export type Resource = "players" | "subjects" | "words" | "admins" | "game_sessions" | "games"
export type Permission = "can_create" | "can_read" | "can_update" | "can_delete"

interface PermissionSet {
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
}

const permissionsCache = new Map<string, PermissionSet>()

export async function getPermissions(role: AdminRole, resource: Resource): Promise<PermissionSet> {
  const cacheKey = `${role}:${resource}`

  if (permissionsCache.has(cacheKey)) {
    return permissionsCache.get(cacheKey)!
  }

  const { rows, error } = await adminDb.query(
    "SELECT can_create, can_read, can_update, can_delete FROM admin_permissions WHERE role = $1 AND resource = $2",
    [role, resource]
  )

  const data = rows[0]

  if (error || !data) {
    // Default deny all
    return { can_create: false, can_read: false, can_update: false, can_delete: false }
  }

  permissionsCache.set(cacheKey, data as PermissionSet)
  return data as PermissionSet
}

export async function checkPermission(role: AdminRole, resource: Resource, permission: Permission): Promise<boolean> {
  const permissions = await getPermissions(role, resource)
  return permissions[permission]
}

export function clearPermissionsCache() {
  permissionsCache.clear()
}
