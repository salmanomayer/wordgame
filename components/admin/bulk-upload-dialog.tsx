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
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".csv")) {
        setError("Please upload a CSV or Excel file")
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

    try {
      const response = await fetch("/api/admin/words/bulk-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
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
          <DialogTitle>Bulk Upload Words</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload CSV or Excel file</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-semibold">File format: subject_name, word, hint</p>
              <div className="bg-muted p-2 rounded font-mono text-xs space-y-1">
                <p>Animals, CAT, A furry pet that says meow</p>
                <p>Science, PHOTOSYNTHESIS, Plants make food using sunlight</p>
                <p>Space, NEBULA, Cloud of gas and dust in space</p>
                <p>Geography, MOUNTAIN, A large natural elevation</p>
              </div>
              <p className="text-xs mt-2">
                Each row creates a word under the specified subject. Subjects are auto-created if they don't exist.
              </p>
              <p className="text-xs text-yellow-600">
                Note: Players select difficulty (Easy/Medium/Hard) when playing, which determines how many gaps appear
                in the word.
              </p>
            </div>
            <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
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
