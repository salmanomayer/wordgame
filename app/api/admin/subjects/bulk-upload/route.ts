import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      if (!file.name.endsWith(".csv")) {
        return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 })
      }

      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length === 0) {
        return NextResponse.json({ error: "CSV file is empty" }, { status: 400 })
      }

      // Ensure subjects table exists
      await adminDb.query(`
        CREATE TABLE IF NOT EXISTS subjects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)

      // Remove difficulty column if it exists (migration compatibility)
      try {
        await adminDb.query("ALTER TABLE subjects DROP COLUMN IF EXISTS difficulty")
      } catch (err) {
        // Ignore if column doesn't exist
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      }

      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Parse CSV line (handle quoted values)
        const columns = line.split(",").map((col) => col.trim().replace(/^"|"$/g, ""))

        // Expected format: name, description, is_active (optional)
        // Or: name, description
        // Or: name (description will be null, is_active will be true)
        const name = columns[0]?.trim()
        const description = columns[1]?.trim() || null
        const isActive = columns[2]?.trim().toLowerCase() === "false" ? false : true

        if (!name) {
          results.failed++
          results.errors.push(`Row ${i + 1}: Subject name is required`)
          continue
        }

        // Check if subject already exists
        const { rows: existing } = await adminDb.query(
          "SELECT id FROM subjects WHERE LOWER(name) = LOWER($1)",
          [name]
        )

        if (existing && existing.length > 0) {
          // Update existing subject
          const { error: updateError } = await adminDb.query(
            "UPDATE subjects SET description = $1, is_active = $2, updated_at = NOW() WHERE LOWER(name) = LOWER($3)",
            [description, isActive, name]
          )

          if (updateError) {
            results.failed++
            results.errors.push(`Row ${i + 1}: Failed to update subject "${name}": ${updateError}`)
          } else {
            results.success++
          }
        } else {
          // Create new subject
          const { error: insertError } = await adminDb.query(
            "INSERT INTO subjects (name, description, is_active) VALUES ($1, $2, $3)",
            [name, description, isActive]
          )

          if (insertError) {
            results.failed++
            results.errors.push(`Row ${i + 1}: Failed to create subject "${name}": ${insertError}`)
          } else {
            results.success++
          }
        }
      }

      return NextResponse.json({
        message: `Bulk upload completed. ${results.success} subjects processed successfully, ${results.failed} failed.`,
        success: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // Return first 10 errors
      })
    } catch (error) {
      console.error("[v0] Bulk subject upload error:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return NextResponse.json(
        {
          error: "Failed to process bulk upload: " + errorMessage,
        },
        { status: 500 }
      )
    }
  })
}

