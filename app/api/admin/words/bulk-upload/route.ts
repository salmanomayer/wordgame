import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"
import { logAdminAction } from "@/lib/admin-audit"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, admin) => {
    try {
      const formData = await request.formData()
      const file = formData.get("file") as File
      const subjectEntry = formData.get("subject_id")
      const subjectId = typeof subjectEntry === "string" && subjectEntry.trim() ? subjectEntry : null

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }
      
      if (!subjectId) {
        return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Parse to JSON (array of arrays)
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (rows.length === 0) {
        return NextResponse.json({ error: "Empty file" }, { status: 400 })
      }

      const wordsToInsert = []

      // Start from 0, but check if first row is header
      // If header is present, we might skip it?
      // User instruction said: "word row format contain the words and hint only"
      // But typically excel files have headers. Let's try to detect or just assume if row 1 looks like "Word", "Hint" we skip it.
      // Or we can just iterate and ignore rows that don't match our data expectations.
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // row[0] -> word
        // row[1] -> hint (optional)
        
        let word = row[0] ? String(row[0]).trim() : ""
        let hint = row[1] ? String(row[1]).trim() : null
        
        // Skip header if it looks like header
        if (i === 0 && word.toLowerCase() === "word" && (!hint || hint.toLowerCase() === "hint")) {
            continue
        }

        if (!word) continue

        wordsToInsert.push({
            word: word.toUpperCase(),
            hint: hint || null,
            subject_id: subjectId,
        })
      }

      // Insert all words
      if (wordsToInsert.length > 0) {
        const params: any[] = []
        const values = wordsToInsert
          .map((w, i) => {
            const base = i * 3
            params.push(w.word, w.hint, w.subject_id)
            return `($${base + 1}, $${base + 2}, $${base + 3})`
          })
          .join(",")

        const { error, rowCount } = await adminDb.query(
          `INSERT INTO words (word, hint, subject_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          params
        )
        if (error) throw error

        if (admin?.id) {
          await logAdminAction({
            adminId: admin.id,
            action: "IMPORT",
            resourceType: "WORD",
            details: { 
              subject_id: subjectId, 
              count: wordsToInsert.length, 
              success: rowCount || 0, 
              failed: wordsToInsert.length - (rowCount || 0) 
            }
          })
        }
        
        return NextResponse.json({
            success: true,
            inserted: rowCount || 0,
            total_processed: wordsToInsert.length
        })
      }

      return NextResponse.json({
        success: true,
        inserted: 0,
        total_processed: 0
      })
    } catch (error) {
      console.error("[v0] Bulk upload error:", error)
      return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
    }
  })
}