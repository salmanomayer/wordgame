"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, Upload } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BulkUploadDialog } from "@/components/admin/bulk-upload-dialog"

interface Word {
  id: string
  word: string
  hint: string
  is_active: boolean
}

interface WordsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectId: string
}

export function WordsDialog({ open, onOpenChange, subjectId }: WordsDialogProps) {
  const [words, setWords] = useState<Word[]>([])
  const [newWord, setNewWord] = useState("")
  const [newHint, setNewHint] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)

  const fetchWords = useCallback(async () => {
    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch(`/api/admin/words?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch words")
      }

      const data = await response.json()
      setWords(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Error fetching words:", error)
      setWords([])
    }
  }, [subjectId])

  useEffect(() => {
    if (open) {
      fetchWords()
    }
  }, [open, fetchWords])

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch("/api/admin/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          word: newWord.toUpperCase(),
          hint: newHint,
          subject_id: subjectId,
        }),
      })

      if (!response.ok) throw new Error("Failed to add word")

      setNewWord("")
      setNewHint("")
      fetchWords()
    } catch (error) {
      console.error("[v0] Error adding word:", error)
      alert("Failed to add word")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWord = async (wordId: string) => {
    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch(`/api/admin/words/${wordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to delete word")

      setWords(words.filter((w) => w.id !== wordId))
    } catch (error) {
      console.error("[v0] Error deleting word:", error)
      alert("Failed to delete word")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Manage Words</DialogTitle>
            <Button variant="outline" size="sm" onClick={() => setShowBulkUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleAddWord} className="space-y-4 border-b pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="word">Word</Label>
              <Input
                id="word"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Enter word"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hint">Hint</Label>
              <Input id="hint" value={newHint} onChange={(e) => setNewHint(e.target.value)} placeholder="Enter hint" />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {isLoading ? "Adding..." : "Add Word"}
          </Button>
        </form>

        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word</TableHead>
                <TableHead>Hint</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {words.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No words found
                  </TableCell>
                </TableRow>
              ) : (
                words.map((word) => (
                  <TableRow key={word.id}>
                    <TableCell className="font-medium">{word.word}</TableCell>
                    <TableCell>{word.hint}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteWord(word.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>

      <BulkUploadDialog
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onSuccess={fetchWords}
        subjectId={subjectId}
      />
    </Dialog>
  )
}
