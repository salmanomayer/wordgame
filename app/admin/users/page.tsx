"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit } from "lucide-react"
import { AdminFooter } from "@/components/admin/admin-footer"

interface AdminUserType {
  id: string
  email: string
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUserType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUserType | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "admin" as "super_admin" | "admin" | "moderator",
  })

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        localStorage.removeItem("admin_token")
        router.push("/admin/login")
        return
      }

      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data.users) ? data.users : [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Failed to fetch users:", errorData.error || response.statusText)
        setUsers([])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("admin_token")

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users"

      const method = editingUser ? "PUT" : "POST"

      const body: any = {
        email: formData.email,
        role: formData.role,
      }

      if (!editingUser || formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setEditingUser(null)
        setFormData({ email: "", password: "", role: "admin" })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save user")
      }
    } catch (error) {
      console.error("Failed to save user:", error)
      alert("Failed to save user")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin user?")) {
      return
    }

    const token = localStorage.getItem("admin_token")

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      alert("Failed to delete user")
    }
  }

  const openEditDialog = (user: AdminUserType) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: "",
      role: user.role as any,
    })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormData({ email: "", password: "", role: "admin" })
    setIsDialogOpen(true)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-500"
      case "admin":
        return "bg-blue-500"
      case "moderator":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AdminNav />
        <SidebarInset>
          <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Admin Users</h2>
          </header>
          <div className="container mx-auto p-6">
            <p>Loading...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AdminNav />
      <SidebarInset className="min-w-0">
        <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <h2 className="text-lg font-semibold">Admin Users</h2>
        </header>
        <div className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Users</h1>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Admin User
            </Button>
          </div>

          <div className="w-full overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Role</TableHead>
                  <TableHead className="whitespace-nowrap">Created At</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium whitespace-nowrap">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={getRoleBadgeColor(user.role)}>{user.role.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit Admin User" : "Add Admin User"}</DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update admin user details and permissions"
                    : "Create a new admin user with specific role and permissions"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password {editingUser && "(leave blank to keep current)"}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {formData.role === "super_admin" && "Full access to all features including user management"}
                      {formData.role === "admin" && "Can manage subjects, words, and view players"}
                      {formData.role === "moderator" && "Can edit subjects and manage words"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingUser ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <AdminFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
