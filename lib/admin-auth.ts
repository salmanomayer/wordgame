import { createAdminClient } from "./supabase/admin"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export interface AdminUser {
  id: string
  email: string
  role?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signAdminToken(admin: AdminUser): Promise<string> {
  return new SignJWT({
    userId: admin.id,
    email: admin.email,
    role: admin.role || "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

export async function createAdminUser(email: string, password: string): Promise<{ id: string; email: string } | null> {
  const supabase = createAdminClient()
  const passwordHash = await hashPassword(password)

  const { data, error } = await supabase
    .from("admin_users")
    .insert({ email, password_hash: passwordHash })
    .select()
    .single()

  if (error) return null
  return { id: data.id, email: data.email }
}

export async function loginAdmin(email: string, password: string): Promise<{ admin: AdminUser; token: string } | null> {
  const supabase = createAdminClient()

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("id, email, password_hash")
    .eq("email", email)
    .maybeSingle()

  if (error) {
    console.error("[v0] Admin login database error:", error)
    return null
  }

  if (!admin) {
    console.log("[v0] No admin found with email:", email)
    return null
  }

  const isValid = await verifyPassword(password, admin.password_hash)
  if (!isValid) {
    console.log("[v0] Invalid password for:", email)
    return null
  }

  let role = "admin"
  try {
    const { data: roleData } = await supabase.from("admin_users").select("role").eq("id", admin.id).maybeSingle()

    if (roleData?.role) {
      role = roleData.role
    }
  } catch (err) {
    console.log("[v0] Role column not found, using default role")
  }

  const token = await signAdminToken({
    id: admin.id,
    email: admin.email,
    role: role,
  })

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      role: role,
    },
    token,
  }
}
