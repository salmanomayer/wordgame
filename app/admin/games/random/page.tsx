"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminFooter } from "@/components/admin/admin-footer"
import { Shuffle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Subject {
  id: string
  name: string
  description: string
  is_active: boolean
  is_random_active: boolean // New field we need to add to DB or simulate
}

export default function RandomGameSettingsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
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
        // Assuming we will add an 'is_random_active' column to subjects table later
        // For now, we might default it or use 'is_active' if that was the intent.
        // But user specifically asked "select subject can be play for random play".
        // This implies a specific toggle for random play.
        // Let's assume the API returns this field or we mock it for now until we update the schema.
        setSubjects(data)
      } catch (error) {
        console.error("Error fetching subjects:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load subjects",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [router, toast])

  const handleToggleRandom = async (subject: Subject) => {
    setUpdating(subject.id)
    const token = localStorage.getItem("admin_token")
    
    try {
      // We'll need an endpoint to toggle this specific flag
      const response = await fetch(`/api/admin/subjects/${subject.id}/random-toggle`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_random_active: !subject.is_random_active })
      })

      if (!response.ok) throw new Error("Failed to update subject")

      const updatedSubject = await response.json()
      setSubjects(subjects.map(s => s.id === subject.id ? updatedSubject : s))
      
      toast({
        title: "Success",
        description: `Subject ${updatedSubject.is_random_active ? "enabled" : "disabled"} for random play`,
      })
    } catch (error) {
      console.error("Error updating subject:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update random play setting",
      })
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AdminNav />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="mr-2" />
          <div className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Random Game Settings</h1>
          </div>
        </header>
        <main className="p-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject Selection</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select which subjects are available for Random Game mode. 
                Players will be served random words from these enabled subjects.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Global Status</TableHead>
                    <TableHead>Random Play</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                        No subjects found. Please create subjects first.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell className="text-muted-foreground">{subject.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={subject.is_active ? "default" : "secondary"}>
                            {subject.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id={`random-${subject.id}`}
                              checked={subject.is_random_active}
                              onCheckedChange={() => handleToggleRandom(subject)}
                              disabled={updating === subject.id}
                            />
                            <label 
                              htmlFor={`random-${subject.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {updating === subject.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                subject.is_random_active ? "Enabled" : "Disabled"
                              )}
                            </label>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <AdminFooter />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
