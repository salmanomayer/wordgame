import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
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

      const { rows: subjects, error } = await adminDb.query(
        "SELECT * FROM subjects ORDER BY created_at DESC"
      )

      if (error) {
        console.error("[v0] Subjects fetch database error:", error)
        throw error
      }

      return NextResponse.json(subjects || [])
    } catch (error) {
      console.error("[v0] Subjects fetch error:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return NextResponse.json({ error: "Failed to fetch subjects: " + errorMessage }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { name, description, is_active } = await request.json()

      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Subject name is required" }, { status: 400 })
      }

      // Ensure subjects table exists with correct schema
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
        // Ignore if column doesn't exist or can't be dropped
        console.log("[v0] Difficulty column check (non-critical):", err)
      }

      const { rows, error } = await adminDb.query(
        "INSERT INTO subjects (name, description, is_active) VALUES ($1, $2, $3) RETURNING *",
        [name.trim(), description?.trim() || null, is_active !== undefined ? is_active : true]
      )

      if (error) {
        console.error("[v0] Subject create database error:", error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json({ 
          error: "Failed to create subject: " + errorMessage 
        }, { status: 500 })
      }

      if (!rows || rows.length === 0) {
        console.error("[v0] Subject create: No data returned")
        return NextResponse.json({ error: "Failed to create subject: No data returned" }, { status: 500 })
      }

      const data = rows[0]
      console.log("[v0] Subject created successfully:", data.id)

      return NextResponse.json(data)
    } catch (error) {
      console.error("[v0] Subject create error:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return NextResponse.json({ 
        error: "Failed to create subject: " + errorMessage 
      }, { status: 500 })
    }
  })
}
