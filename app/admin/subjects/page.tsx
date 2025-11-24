"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Plus, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SubjectDialog } from "@/components/admin/subject-dialog"
import { WordsDialog } from "@/components/admin/words-dialog"
import { BulkUploadDialog } from "@/components/admin/bulk-upload-dialog"

interface Subject {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [showSubjectDialog, setShowSubjectDialog] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [showWordsDialog, setShowWordsDialog] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const router = useRouter()

  const fetchSubjects = async () => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }

    try {
      const response = await fetch("/api/admin/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch subjects")

      const data = await response.json()
      setSubjects(data)
    } catch (error) {
      console.error("[v0] Error fetching subjects:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [router])

  const handleDelete = async (subjectId: string) => {
    if (!confirm("Are you sure? This will delete all associated words.")) return

    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to delete subject")

      setSubjects(subjects.filter((s) => s.id !== subjectId))
    } catch (error) {
      console.error("[v0] Error deleting subject:", error)
      alert("Failed to delete subject")
    }
  }

  const handleManageWords = (subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setShowWordsDialog(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <AdminNav />
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subject Management</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setShowBulkUpload(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
              <Button
                onClick={() => {
                  setEditingSubject(null)
                  setShowSubjectDialog(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No subjects found
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{subject.description}</TableCell>
                      <TableCell>
                        <Badge variant={subject.is_active ? "default" : "secondary"}>
                          {subject.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleManageWords(subject.id)}>
                            Words
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingSubject(subject)
                              setShowSubjectDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(subject.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <SubjectDialog
        open={showSubjectDialog}
        onOpenChange={setShowSubjectDialog}
        subject={editingSubject}
        onSuccess={fetchSubjects}
      />

      {selectedSubjectId && (
        <WordsDialog open={showWordsDialog} onOpenChange={setShowWordsDialog} subjectId={selectedSubjectId} />
      )}

      <BulkUploadDialog open={showBulkUpload} onOpenChange={setShowBulkUpload} onSuccess={fetchSubjects} />
    </div>
  )
}
