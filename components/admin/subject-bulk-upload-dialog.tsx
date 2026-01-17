"use client"

import { Input } from "@/components/ui/input"
import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { Label } from "@/components/ui/label"

interface SubjectBulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SubjectBulkUploadDialog({ open, onOpenChange, onSuccess }: SubjectBulkUploadDialogProps) {
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

    try {
      const response = await fetch("/api/admin/subjects/bulk-upload", {
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

      // Show success message with details
      const message = data.message || "Upload successful"
      const errorDetails = data.errors && data.errors.length > 0 ? `\n\nErrors:\n${data.errors.join("\n")}` : ""
      alert(message + errorDetails)

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
          <DialogTitle>Bulk Upload Subjects</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload CSV file</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-semibold">File format: name, description, is_active</p>
              <div className="bg-muted p-2 rounded font-mono text-xs space-y-1">
                <p>Animals, Learn about different animals, true</p>
                <p>Science, Scientific concepts and theories, true</p>
                <p>Geography, World geography and landmarks, true</p>
                <p>History, Historical events and figures, false</p>
              </div>
              <p className="text-xs mt-2">
                Supported formats:
                <br />• 3 columns: name, description, is_active (true/false)
                <br />• 2 columns: name, description (default: is_active = true)
                <br />• 1 column: name (default: description = null, is_active = true)
              </p>
              <p className="text-xs mt-2">
                Note: If a subject with the same name already exists, it will be updated instead of creating a duplicate.
              </p>
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

