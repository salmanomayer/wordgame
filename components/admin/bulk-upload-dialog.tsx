"use client"

import { Input } from "@/components/ui/input"
import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { Label } from "@/components/ui/label"

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  subjectId?: string
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess, subjectId }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Please upload a CSV file. Excel files (.xlsx) are not supported yet.")
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    const token = localStorage.getItem("admin_token")
    const formData = new FormData()
    formData.append("file", file)
    if (subjectId) {
      formData.append("subject_id", subjectId)
    }

    try {
      const response = await fetch("/api/admin/words/bulk-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        throw new Error("Server returned an invalid response. Please check if the file is too large or incorrectly formatted.")
      }

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      onSuccess()
      onOpenChange(false)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Upload Words {subjectId ? "(Selected Subject)" : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload CSV file</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-semibold">
                File format: {subjectId ? "difficulty, word, hint" : "subject_name, difficulty, word, hint"}
              </p>
              <div className="bg-muted p-2 rounded font-mono text-xs space-y-1">
                {subjectId ? (
                  <>
                    <p>Easy, CAT, A furry pet that says meow</p>
                    <p>Hard, PHOTOSYNTHESIS, Plants make food using sunlight</p>
                    <p>Medium, NEBULA, Cloud of gas and dust in space</p>
                    <p>MOUNTAIN, A large natural elevation (Default Medium)</p>
                  </>
                ) : (
                  <>
                    <p>Animals, Easy, CAT, A furry pet that says meow</p>
                    <p>Science, Hard, PHOTOSYNTHESIS, Plants make food using sunlight</p>
                    <p>Space, Medium, NEBULA, Cloud of gas and dust in space</p>
                    <p>Geography, Medium, MOUNTAIN, A large natural elevation</p>
                  </>
                )}
              </div>
              <p className="text-xs mt-2">
                Supported formats:
                {subjectId ? (
                   <>
                    <br />• 3 columns: difficulty, word, hint
                    <br />• 2 columns: word, hint (default: medium)
                    <br />• 1 column: word (default: medium, no hint)
                   </>
                ) : (
                   <>
                    <br />• 4 columns: subject, difficulty, word, hint
                    <br />• 3 columns: subject, word, hint (default: medium)
                    <br />• 2 columns: subject, word (default: medium, no hint)
                   </>
                )}
              </p>
              {!subjectId && (
                <p className="text-xs mt-2">
                  Each row creates a word under the specified subject. Subjects are auto-created if they don&apos;t exist.
                </p>
              )}
            </div>
            <Input type="file" accept=".csv" onChange={handleFileChange} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || isLoading}>
              <Upload className="mr-2 h-4 w-4" />
              {isLoading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
