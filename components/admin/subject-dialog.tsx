"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface Subject {
  id: string
  name: string
  description: string
  is_active: boolean
}

interface SubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject | null
  onSuccess: () => void
}

export function SubjectDialog({ open, onOpenChange, subject, onSuccess }: SubjectDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (subject) {
      setName(subject.name)
      setDescription(subject.description)
      setIsActive(subject.is_active)
    } else {
      setName("")
      setDescription("")
      setIsActive(true)
    }
  }, [subject, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const token = localStorage.getItem("admin_token")
    try {
      const url = subject ? `/api/admin/subjects/${subject.id}` : "/api/admin/subjects"
      const method = subject ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, is_active: isActive }),
      })

      if (!response.ok) throw new Error("Failed to save subject")

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving subject:", error)
      alert("Failed to save subject")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subject ? "Edit Subject" : "Add Subject"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Animals, Science, Geography"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this subject category"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
