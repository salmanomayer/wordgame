import { adminDb } from "./db"
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
  const passwordHash = await hashPassword(password)

  const { rows, error } = await adminDb.query(
    "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
    [email, passwordHash]
  )

  if (error) {
    console.error("Error creating admin user:", error)
    return null
  }
  if (rows.length === 0) return null
  const data = rows[0]
  return { id: data.id, email: data.email }
}

export async function loginAdmin(email: string, password: string): Promise<{ admin: AdminUser; token: string } | null> {
  const { rows: adminRows, error: adminError } = await adminDb.query(
    "SELECT id, email, password_hash, role FROM admin_users WHERE email = $1",
    [email]
  )

  if (adminError) {
    console.error("[v0] Admin login database error:", adminError)
    return null
  }

  if (adminRows.length === 0) {
    console.log("[v0] No admin found with email:", email)
    return null
  }

  const admin = adminRows[0]

  const isValid = await verifyPassword(password, admin.password_hash)
  if (!isValid) {
    console.log("[v0] Invalid password for:", email)
    return null
  }

  let role = admin.role || "admin"

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
