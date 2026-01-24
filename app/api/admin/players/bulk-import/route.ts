import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"
import { hash } from "bcryptjs"
import { logAdminAction } from "@/lib/admin-audit"

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const adminId = admin.id
      const { players } = await req.json()

      if (!Array.isArray(players) || players.length === 0) {
        return NextResponse.json({ error: "No players data provided" }, { status: 400 })
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      }

      const normalizeEmployeeId = (value: unknown) => {
        if (value === undefined || value === null) return null
        const str = String(value).trim().toUpperCase()
        if (!str) return null
        return str
      }

      const normalizeOptional = (value: unknown, mode: "email" | "phone") => {
        if (value === undefined || value === null) return null
        const str = String(value).trim()
        if (!str) return null
        const lowered = str.toLowerCase()
        if (
          lowered === "-" ||
          lowered === "–" ||
          lowered === "—" ||
          lowered === "n/a" ||
          lowered === "na" ||
          lowered === "null" ||
          lowered === "undefined"
        ) {
          return null
        }
        if (mode === "email") return lowered
        return str
      }

      for (const player of players) {
        const { employee_id, display_name, email, phone_number } = player

        // Server-side validation just in case
        const cleanEmployeeId = normalizeEmployeeId(employee_id)
        if (!cleanEmployeeId) {
          results.failed++
          results.errors.push(`Skipped: Missing Employee ID for ${display_name || "Unknown"}`)
          continue
        }

        try {
          // Generate dummy password (since they login with employee ID, maybe they have a default password?)
          // Or maybe password is not used? But schema requires password_hash.
          // Let's set a default one like "password123" or random.
          const dummyPassword = Math.random().toString(36).slice(-8)
          const passwordHash = await hash(dummyPassword, 10)
          
          const cleanEmail = normalizeOptional(email, "email")
          const cleanPhone = normalizeOptional(phone_number, "phone")
          
          // We prioritize employee_id.
          // Note: If email/phone exists for ANOTHER employee_id, this insert will fail.
          // We can try to catch that.

          const { rows, error } = await adminDb.query(
            `INSERT INTO players (employee_id, display_name, email, phone_number, password_hash, created_by_admin_id, creation_source)
             VALUES ($1, $2, $3, $4, $5, $6, 'import')
             ON CONFLICT (employee_id) 
             DO UPDATE SET
               display_name = EXCLUDED.display_name,
               email = CASE 
                  WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email != '' THEN EXCLUDED.email 
                  ELSE players.email 
               END,
               phone_number = CASE 
                  WHEN EXCLUDED.phone_number IS NOT NULL AND EXCLUDED.phone_number != '' THEN EXCLUDED.phone_number 
                  ELSE players.phone_number 
               END,
               updated_at = NOW()
             RETURNING id`,
            [cleanEmployeeId, display_name || "Unknown", cleanEmail, cleanPhone, passwordHash, adminId]
          )
          
          if (error) {
             results.failed++
             // Type assertion since we know it's a PG error object usually, but need to be safe
             const pgError = error as any
             
             if (pgError.constraint === 'players_email_key') {
                results.errors.push(`Duplicate Email: ${cleanEmail} (Employee ID: ${cleanEmployeeId})`)
             } else if (pgError.constraint === 'players_phone_number_key') {
                results.errors.push(`Duplicate Phone: ${cleanPhone} (Employee ID: ${cleanEmployeeId})`)
             } else {
                results.errors.push(`Database Error for ${cleanEmployeeId}: ${pgError.message || JSON.stringify(error)}`)
             }
          } else if (rows.length > 0) {
            results.success++
          } else {
            // Should not happen with Upsert unless RLS or trigger prevents it
            results.failed++ 
            results.errors.push(`Failed to upsert Employee ID: ${cleanEmployeeId} (No rows returned)`)
          }
        } catch (err: any) {
          results.failed++
          // Check for specific constraint violations
          if (err.constraint === 'players_email_key') {
             results.errors.push(`Duplicate Email: ${normalizeOptional(email, "email")} (Employee ID: ${cleanEmployeeId})`)
          } else if (err.constraint === 'players_phone_number_key') {
             results.errors.push(`Duplicate Phone: ${normalizeOptional(phone_number, "phone")} (Employee ID: ${cleanEmployeeId})`)
          } else {
             results.errors.push(`Database Error for ${cleanEmployeeId}: ${err.message}`)
          }
        }
      }

      if (adminId) {
        await logAdminAction({
          adminId,
          action: "IMPORT",
          resourceType: "PLAYER",
          details: { 
            count: players.length, 
            success: results.success, 
            failed: results.failed 
          }
        })
      }

      return NextResponse.json({ message: "Import processed", results })
    } catch (error) {
      console.error("[v0] Import error:", error)
      return NextResponse.json({ error: "Failed to process import" }, { status: 500 })
    }
  })
}
