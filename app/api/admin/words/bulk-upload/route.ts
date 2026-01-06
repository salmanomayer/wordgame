import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
  try {
      const formData = await request.formData()
      const file = formData.get("file") as File
      const subjectEntry = formData.get("subject_id")
      const specificSubjectId = typeof subjectEntry === "string" && subjectEntry.trim() ? subjectEntry : null

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length === 0) {
        return NextResponse.json({ error: "Empty file" }, { status: 400 })
      }

      const wordsToInsert = []
      const subjectsMap = new Map<string, string>()

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(",").map((part) => part.trim())
        if (parts.length < 1) continue

      let subjectName, word, hint, difficulty = "medium"
      let subjectId: string | undefined = specificSubjectId ?? undefined

        if (subjectId) {
          if (parts.length >= 3) {
            const p0 = parts[0].toLowerCase()
            if (["easy", "medium", "hard"].includes(p0)) {
              ;[difficulty, word, hint] = parts
            } else {
              ;[, word, hint] = parts
            }
          } else if (parts.length === 2) {
            ;[word, hint] = parts
          } else {
            ;[word] = parts
          }
        } else {
          if (parts.length < 2) continue

          if (parts.length >= 4) {
            // Format: subject_name, difficulty, word, hint
            ;[subjectName, difficulty, word, hint] = parts
            if (!["easy", "medium", "hard"].includes(difficulty.toLowerCase())) {
              difficulty = "medium"
            }
          } else if (parts.length === 3) {
            // Format: subject_name, word, hint
            ;[subjectName, word, hint] = parts
          } else {
            // Format: subject_name, word
            ;[subjectName, word] = parts
          }
        }

        if (!word || (!subjectName && !subjectId)) continue

        if (!subjectId && subjectName) {
          subjectId = subjectsMap.get(subjectName)
          if (!subjectId) {
            const { rows: existingSubjectRows, error: existingSubjectError } = await adminDb.query(
              "SELECT id FROM subjects WHERE name = $1",
              [subjectName]
            )

            if (existingSubjectError) throw existingSubjectError

            const existingSubject = existingSubjectRows[0]

            if (existingSubject) {
              subjectId = existingSubject.id
            } else {
              const { rows: newSubjectRows, error: newSubjectError } = await adminDb.query(
                "INSERT INTO subjects (name, description, is_active) VALUES ($1, $2, $3) RETURNING id",
                [subjectName, `Auto-created from bulk upload`, true]
              )

              if (newSubjectError) throw newSubjectError

              const newSubject = newSubjectRows[0]

              if (!newSubject) {
                console.error("Failed to create subject: No data returned")
                continue
              }
              subjectId = newSubject.id
            }
            if (subjectId) {
              subjectsMap.set(subjectName, subjectId)
            }
          }
        }

        if (subjectId) {
          wordsToInsert.push({
            word: word.toUpperCase(),
            hint: hint || null,
            subject_id: subjectId,
          })
        }
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

        const { error } = await adminDb.query(
          `INSERT INTO words (word, hint, subject_id) VALUES ${values}`,
          params
        )
        if (error) throw error
      }

      return NextResponse.json({
        success: true,
        inserted: wordsToInsert.length,
      })
    } catch (error) {
      console.error("[v0] Bulk upload error:", error)
      return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
    }
  })
}
