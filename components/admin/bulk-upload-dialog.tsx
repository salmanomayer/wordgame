"use client"

import { Input } from "@/components/ui/input"
import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Subject {
  id: string
  name: string
}

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  subjectId?: string
  subjects?: Subject[]
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess, subjectId, subjects = [] }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>("")

  const effectiveSubjectId = subjectId || selectedSubject

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        setError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)")
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }
    
    if (!effectiveSubjectId) {
      setError("Please select a subject")
      return
    }

    setIsLoading(true)
    setError(null)

    const token = localStorage.getItem("admin_token")
    const formData = new FormData()
    formData.append("file", file)
    formData.append("subject_id", effectiveSubjectId)

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
      setSelectedSubject("")
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
          <DialogTitle>Bulk Upload Words</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!subjectId && (
            <div className="space-y-2">
              <Label>Select Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Upload File</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-semibold">
                File format: word, hint
              </p>
              <div className="bg-muted p-2 rounded font-mono text-xs space-y-1">
                <p>CAT, A furry pet that says meow</p>
                <p>PHOTOSYNTHESIS, Plants make food using sunlight</p>
                <p>NEBULA, Cloud of gas and dust in space</p>
                <p>MOUNTAIN, A large natural elevation</p>
              </div>
              <p className="text-xs mt-2">
                Supported files: .csv, .xlsx, .xls
                <br />• Column 1: Word
                <br />• Column 2: Hint (Optional)
              </p>
            </div>
            <Input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || isLoading || !effectiveSubjectId}>
              <Upload className="mr-2 h-4 w-4" />
              {isLoading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}