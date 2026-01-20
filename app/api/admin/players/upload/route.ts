import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"
import * as XLSX from "xlsx"
import { hash } from "bcryptjs"

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
      }

      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      }

      for (const row of jsonData as any[]) {
        // Normalize keys (case insensitive)
        const name = row['Name'] || row['name'] || row['Display Name'] || row['display_name']
        const email = row['Email'] || row['email']
        const phone = row['Mobile Number'] || row['Mobile'] || row['Phone'] || row['phone'] || row['phone_number']

        if (!email && !phone) {
            // Skip empty rows or rows without identifier
            continue
        }

        try {
            // Generate dummy password if not provided
            const dummyPassword = Math.random().toString(36).slice(-8)
            const passwordHash = await hash(dummyPassword, 10)
            
            // Format phone - simplistic approach, ideally strict validation
            let formattedPhone = phone ? String(phone) : null
            
            // Check for duplicates before inserting to track success/failure accurately
            // Using ON CONFLICT DO NOTHING implies success if no error, but row isn't inserted
            // Let's use INSERT ... ON CONFLICT DO NOTHING RETURNING id
            
            const { rows } = await adminDb.query(
                `INSERT INTO players (display_name, email, phone_number, password_hash)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id`,
                 // Note: Handling multiple unique constraints (email AND phone) in one query is tricky if one matches and other doesn't
                 // Ideally we check existence first or use more complex upsert logic.
                 // For bulk upload simplicity, we'll try to insert. 
                 // If email conflict, we skip. If phone conflict, it might throw if email didn't conflict.
                 // Let's rely on catch for now or simple conflict.
                [name || 'Unknown', email || null, formattedPhone, passwordHash]
            )
            
            if (rows.length > 0) {
                results.success++
            } else {
                 // Try inserting if email was null but phone caused conflict?
                 // Let's simplify: 
                 // We will count it as 'failed' (or 'skipped') if it didn't insert.
                 results.failed++ // Actually skipped, but let's count as failed to import new user
                 results.errors.push(`Skipped duplicate: ${email || phone}`)
            }
        } catch (err: any) {
            results.failed++
            results.errors.push(`Failed to insert ${email || phone}: ${err.message}`)
        }
      }

      return NextResponse.json({ message: "Upload processed", results })
    } catch (error) {
      console.error("[v0] Upload error:", error)
      return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
    }
  })
}