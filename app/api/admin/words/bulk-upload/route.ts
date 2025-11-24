import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length === 0) {
        return NextResponse.json({ error: "Empty file" }, { status: 400 })
      }

      const supabase = createAdminClient()
      const wordsToInsert = []
      const subjectsMap = new Map<string, string>()

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(",").map((part) => part.trim())
        if (parts.length < 2) continue

        const [subjectName, word, hint] = parts

        // Get or create subject (without difficulty)
        let subjectId = subjectsMap.get(subjectName)
        if (!subjectId) {
          const { data: existingSubject } = await supabase
            .from("subjects")
            .select("id")
            .eq("name", subjectName)
            .maybeSingle()

          if (existingSubject) {
            subjectId = existingSubject.id
          } else {
            const { data: newSubject, error } = await supabase
              .from("subjects")
              .insert({ name: subjectName, description: `Auto-created from bulk upload` })
              .select()
              .single()

            if (error || !newSubject) {
              console.error("Failed to create subject:", error)
              continue
            }
            subjectId = newSubject.id
          }
          subjectsMap.set(subjectName, subjectId)
        }

        wordsToInsert.push({
          word: word.toUpperCase(),
          hint: hint || null,
          subject_id: subjectId,
        })
      }

      // Insert all words
      if (wordsToInsert.length > 0) {
        const { error } = await supabase.from("words").insert(wordsToInsert)
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
