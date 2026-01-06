"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Edit2, 
  Trash2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { AdminFooter } from "@/components/admin/admin-footer"

interface Subject {
  id: string
  name: string
}

interface Word {
  id: string
  word: string
  hint: string | null
  subject_id: string
  subject_name?: string
  is_active: boolean
  created_at: string
}

export default function AdminWordsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedSubjectId, setSelectedSubjectId] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState("20")
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  
  // Action states
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [deletingWord, setDeletingWord] = useState<Word | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({ word: "", hint: "", subject_id: "", is_active: true })
  
  const router = useRouter()
  const { toast } = useToast()

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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch subjects")
      }
      const data = await response.json()
      setSubjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Error fetching subjects:", error)
      setSubjects([])
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not load subjects",
      })
    }
  }, [router])

  const fetchWords = useCallback(
    async (q: string, subjectId: string, p: number, l: string, sort: string, order: string) => {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }

      const params = new URLSearchParams()
      const trimmed = q.trim()
      if (trimmed) params.set("q", trimmed)
      if (subjectId && subjectId !== "all") params.set("subject_id", subjectId)
      params.set("page", p.toString())
      params.set("limit", l)
      params.set("sort_by", sort)
      params.set("sort_order", order)

      try {
        const response = await fetch(`/api/admin/words?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch words")
        }
        const result = await response.json()
        setWords(Array.isArray(result.data) ? result.data : [])
        setTotal(result.total || 0)
      } catch (error) {
        console.error("[v0] Error fetching words:", error)
        setWords([])
        setTotal(0)
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Could not load words",
        })
      } finally {
        setLoading(false)
      }
    },
    [router],
  )

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }

    fetchSubjects()
  }, [router, fetchSubjects])

  useEffect(() => {
    setLoading(true)
    const handle = setTimeout(() => {
      fetchWords(search, selectedSubjectId, page, limit, sortBy, sortOrder)
    }, 250)
    return () => clearTimeout(handle)
  }, [fetchWords, search, selectedSubjectId, page, limit, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
    setPage(1)
  }

  const handleDelete = async (word: Word) => {
    setDeletingWord(word)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingWord) return
    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch(`/api/admin/words/${deletingWord.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to delete word")
      toast({ title: "Success", description: "Word deleted successfully" })
      fetchWords(search, selectedSubjectId, page, limit, sortBy, sortOrder)
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete word", variant: "destructive" })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingWord(null)
    }
  }

  const handleEdit = (word: Word) => {
    setEditingWord(word)
    setEditFormData({
      word: word.word,
      hint: word.hint || "",
      subject_id: word.subject_id,
      is_active: word.is_active
    })
    setIsEditDialogOpen(true)
  }

  const confirmEdit = async () => {
    if (!editingWord) return
    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch(`/api/admin/words/${editingWord.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(editFormData),
      })
      if (!response.ok) throw new Error("Failed to update word")
      toast({ title: "Success", description: "Word updated successfully" })
      fetchWords(search, selectedSubjectId, page, limit, sortBy, sortOrder)
    } catch (error) {
      toast({ title: "Error", description: "Failed to update word", variant: "destructive" })
    } finally {
      setIsEditDialogOpen(false)
      setEditingWord(null)
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AdminNav />
        <SidebarInset className="bg-muted/40">
          <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Words</h2>
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
          <h2 className="text-lg font-semibold">Words</h2>
        </header>
        <div className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Word Management</h1>
              <p className="text-muted-foreground">Add, edit, and manage your word database</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="word-search">Search</Label>
                  <Input
                    id="word-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search word, hint, or subject..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={selectedSubjectId} onValueChange={(value) => setSelectedSubjectId(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("word")}>
                      <div className="flex items-center gap-1">
                        Word
                        {sortBy === "word" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("hint")}>
                      <div className="flex items-center gap-1">
                        Hint
                        {sortBy === "hint" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("subject_name")}>
                      <div className="flex items-center gap-1">
                        Subject
                        {sortBy === "subject_name" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center gap-1">
                        Created
                        {sortBy === "created_at" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {words.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No words found
                      </TableCell>
                    </TableRow>
                  ) : (
                    words.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium whitespace-nowrap">{w.word}</TableCell>
                        <TableCell className="whitespace-nowrap">{w.hint || ""}</TableCell>
                        <TableCell className="whitespace-nowrap">{w.subject_name || ""}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={w.is_active ? "default" : "secondary"}>{w.is_active ? "Active" : "Inactive"}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(w)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(w)}>
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

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 mt-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
                  <Select
                    value={limit}
                    onValueChange={(value) => {
                      setLimit(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={limit} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {["20", "50", "100", "all"].map((pageSize) => (
                        <SelectItem key={pageSize} value={pageSize}>
                          {pageSize === "all" ? "All" : pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {page} of {limit === "all" ? 1 : Math.ceil(total / parseInt(limit)) || 1}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      <span className="sr-only">Go to first page</span>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(page + 1)}
                      disabled={limit === "all" || page >= Math.ceil(total / parseInt(limit))}
                    >
                      <span className="sr-only">Go to next page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => setPage(Math.ceil(total / parseInt(limit)))}
                      disabled={limit === "all" || page >= Math.ceil(total / parseInt(limit))}
                    >
                      <span className="sr-only">Go to last page</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Word</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-word">Word</Label>
                <Input
                  id="edit-word"
                  value={editFormData.word}
                  onChange={(e) => setEditFormData({ ...editFormData, word: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hint">Hint</Label>
                <Input
                  id="edit-hint"
                  value={editFormData.hint}
                  onChange={(e) => setEditFormData({ ...editFormData, hint: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select 
                  value={editFormData.subject_id} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, subject_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editFormData.is_active}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Word</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the word {deletingWord?.word}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AdminFooter />
      </SidebarInset>
    </SidebarProvider>
  )
}
