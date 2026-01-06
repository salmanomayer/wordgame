"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Plus, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SubjectDialog } from "@/components/admin/subject-dialog"
import { WordsDialog } from "@/components/admin/words-dialog"
import { BulkUploadDialog } from "@/components/admin/bulk-upload-dialog"
import { AdminFooter } from "@/components/admin/admin-footer"

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

  const fetchSubjects = useCallback(async () => {
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
      if (Array.isArray(data)) {
        setSubjects(data)
      } else {
        console.error("[v0] API returned non-array data:", data)
        setSubjects([])
      }
    } catch (error) {
      console.error("[v0] Error fetching subjects:", error)
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

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
      <SidebarProvider>
        <AdminNav />
        <SidebarInset className="bg-muted/40">
          <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Subjects</h2>
          </header>
          <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center">
            <div className="text-lg">Loading...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AdminNav />
      <SidebarInset className="min-w-0 bg-muted/40">
        <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <h2 className="text-lg font-semibold">Subjects</h2>
        </header>
        <div className="p-4 sm:p-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Subject Management</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={() => setShowBulkUpload(true)} variant="outline" className="w-full sm:w-auto">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
                <Button
                  className="w-full sm:w-auto"
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
              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Description</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
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
                        <TableCell className="font-medium whitespace-nowrap">{subject.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{subject.description}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={subject.is_active ? "default" : "secondary"}>
                            {subject.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
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
            </div>
          </CardContent>
        </Card>
          <AdminFooter />
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
      </SidebarInset>
    </SidebarProvider>
  )
}
