import { adminDb } from "./supabase/admin"
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
  const normalizedEmail = String(email).trim().toLowerCase()
  const passwordHash = await hashPassword(password)

  const { rows, error } = await adminDb.query(
    "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
    [normalizedEmail, passwordHash]
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
  const normalizedEmail = String(email).trim().toLowerCase()
  
  console.log("[v0] Admin login attempt for email:", normalizedEmail)
  
  // Query - try without role first (most compatible), then try with role
  let adminRows: any[] = []
  let adminError: any = null
  
  // First, try to query WITHOUT role column (for databases that don't have it yet)
  let result = await adminDb.query(
    "SELECT id, email, password_hash FROM admin_users WHERE email = $1",
    [normalizedEmail]
  )
  
  if (result.error) {
    const err: any = result.error
    const errorCode = err?.code || ''
    const errorMessage = err?.message || String(err)
    
    console.log("[v0] Query without role failed:", {
      code: errorCode,
      message: errorMessage
    })
    
    // If it's NOT a "column doesn't exist" error, it's a real problem
    if (errorCode !== '42703' && !errorMessage.includes('column "role" does not exist')) {
      adminError = result.error
    } else {
      // Try with role column
      console.log("[v0] Trying query with role column...")
      result = await adminDb.query(
        "SELECT id, email, password_hash, role FROM admin_users WHERE email = $1",
        [normalizedEmail]
      )
      if (result.error) {
        adminError = result.error
        console.error("[v0] Query with role also failed:", result.error)
      } else {
        adminRows = result.rows
        console.log("[v0] Query with role column succeeded")
      }
    }
  } else {
    adminRows = result.rows
    console.log("[v0] Query without role column succeeded")
  }

  if (adminError) {
    console.error("[v0] Admin login database error:", adminError)
    return null
  }

  if (adminRows.length === 0) {
    console.log("[v0] No admin found with email:", normalizedEmail)
    return null
  }

  const admin = adminRows[0]
  console.log("[v0] Admin found:", {
    id: admin.id,
    email: admin.email,
    hasPasswordHash: !!admin.password_hash,
    passwordHashLength: admin.password_hash?.length,
    passwordHashStart: admin.password_hash?.substring(0, 30) + "...",
  })
  console.log("[v0] Verifying password...")

  if (!admin.password_hash) {
    console.error("[v0] No password hash found in database!")
    return null
  }

  const isValid = await verifyPassword(password, admin.password_hash)
  console.log("[v0] Password verification result:", isValid)
  
  if (!isValid) {
    console.log("[v0] Invalid password for:", normalizedEmail)
    console.log("[v0] Password hash from DB:", admin.password_hash?.substring(0, 30) + "...")
    
    // Test: Try to verify with a test hash to ensure bcrypt is working
    const testHash = await hashPassword("test")
    const testVerify = await verifyPassword("test", testHash)
    console.log("[v0] Bcrypt test (should be true):", testVerify)
    
    return null
  }

  console.log("[v0] Password verified successfully for:", normalizedEmail)

  // Default to 'admin' if role doesn't exist
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
