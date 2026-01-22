"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Trash2, 
  Key, 
  UserCheck, 
  Download, 
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Upload,
  Pencil
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminFooter } from "@/components/admin/admin-footer"

interface Player {
  id: string
  display_name: string
  phone_number: string
  total_score: number
  games_played: number
  created_at: string
  is_active: boolean
  email?: string
  employee_id?: string
}

interface PlayerLog {
  id: string
  player_id: string
  ip_address: string
  browser: string
  device: string
  os: string
  country: string
  city: string
  action: string
  created_at: string
}

import * as XLSX from "xlsx"

interface PlayerImportPreview {
  employee_id: string
  display_name: string
  email: string
  phone_number: string
  isValid: boolean
  errors: string[]
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState("20")
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  
  // Dialog states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [showPlayerDialog, setShowPlayerDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [playerLogs, setPlayerLogs] = useState<PlayerLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Import states
  const [importPreview, setImportPreview] = useState<PlayerImportPreview[]>([])
  const [importing, setImporting] = useState(false)
  
  // Form states
  const [newPassword, setNewPassword] = useState("")
  const [updatingPassword, setUpdatingPassword] = useState(false)
  
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [playerEmail, setPlayerEmail] = useState("")
  const [playerPhone, setPlayerPhone] = useState("")
  const [playerPassword, setPlayerPassword] = useState("") // Only for create
  const [savingPlayer, setSavingPlayer] = useState(false)
  
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()

  const fetchPlayers = useCallback(
    async (q: string, p: number, l: string, sort: string, order: string, signal?: AbortSignal) => {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }

      const params = new URLSearchParams()
      const trimmed = q.trim()
      if (trimmed) params.set("q", trimmed)
      params.set("page", p.toString())
      params.set("limit", l)
      params.set("sort_by", sort)
      params.set("sort_order", order)

      try {
        setIsFetching(true)
        const response = await fetch(`/api/admin/players?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch players")
        }
        const result = await response.json()
        setPlayers(Array.isArray(result.data) ? result.data : [])
        setTotal(result.total || 0)
      } catch (error) {
        if ((error as any)?.name === "AbortError") return
        console.error("[v0] Error fetching players:", error)
        setPlayers([])
        setTotal(0)
      } finally {
        setLoading(false)
        setIsFetching(false)
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
    const controller = new AbortController()
    const handle = setTimeout(() => {
      fetchPlayers(search, page, limit, sortBy, sortOrder, controller.signal)
    }, 500) // Increased debounce time for better UX
    return () => {
      clearTimeout(handle)
      controller.abort()
    }
  }, [search, page, limit, sortBy, sortOrder, fetchPlayers, router])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
    setPage(1)
  }

  const handleExportExcel = () => {
    if (!Array.isArray(players) || players.length === 0) {
      alert("No players data available to export")
      return
    }
    
    const headers = ["Name", "Email", "Phone", "Total Score", "Games Played", "Joined", "Status"]
    const csvContent = [
      headers.join(","),
      ...players.map((player) =>
        [
          `"${player.display_name || "N/A"}"`,
          `"${player.email || "N/A"}"`,
          `"${player.phone_number || "N/A"}"`,
          player.total_score,
          player.games_played,
          new Date(player.created_at).toLocaleDateString(),
          player.is_active ? "Active" : "Disabled",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `players_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewLogs = async (player: Player) => {
    setSelectedPlayer(player)
    setShowLogsDialog(true)
    setLogsLoading(true)

    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch(`/api/admin/players/${player.id}/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch logs")
      }

      const data = await response.json()
      setPlayerLogs(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Error fetching player logs:", error)
      setPlayerLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const handleDelete = async (playerId: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return

    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch(`/api/admin/players/${playerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete player")

      setPlayers(players.filter((p) => p.id !== playerId))
    } catch (error) {
      console.error("[v0] Error deleting player:", error)
      alert("Failed to delete player")
    }
  }

  const handleToggleStatus = async (playerId: string, currentStatus: boolean) => {
    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch(`/api/admin/players/${playerId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (!response.ok) throw new Error("Failed to update player status")

      setPlayers(players.map((p) => (p.id === playerId ? { ...p, is_active: !currentStatus } : p)))
    } catch (error) {
      console.error("[v0] Error updating player status:", error)
      alert("Failed to update player status")
    }
  }

  const handleSetPassword = async () => {
    if (!selectedPlayer || !newPassword) return
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }

    setUpdatingPassword(true)
    const token = localStorage.getItem("admin_token")

    try {
      const response = await fetch(`/api/admin/players/${selectedPlayer.id}/password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update password")
      }

      alert("Password updated successfully")
      setShowPasswordDialog(false)
      setNewPassword("")
      setSelectedPlayer(null)
    } catch (error: any) {
      console.error("[v0] Error updating password:", error)
      alert(error.message || "Failed to update password")
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleActivateUser = async (playerId: string) => {
    const token = localStorage.getItem("admin_token")
    try {
      const response = await fetch(`/api/admin/players/${playerId}/activate`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to activate user")
      }

      setPlayers(players.map((p) => (p.id === playerId ? { ...p, is_active: true } : p)))
      alert("User activated successfully")
    } catch (error: any) {
      console.error("[v0] Error activating user:", error)
      alert(error.message || "Failed to activate user")
    }
  }

  // --- New Handlers for CRUD and Bulk Upload ---

  const openAddPlayerDialog = () => {
    setEditingPlayer(null)
    setPlayerName("")
    setPlayerEmail("")
    setPlayerPhone("")
    setPlayerPassword("")
    setShowPlayerDialog(true)
  }

  const openEditPlayerDialog = (player: Player) => {
    setEditingPlayer(player)
    setPlayerName(player.display_name || "")
    setPlayerEmail(player.email || "")
    setPlayerPhone(player.phone_number || "")
    setPlayerPassword("") // Usually don't show old password
    setShowPlayerDialog(true)
  }

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPlayer(true)
    const token = localStorage.getItem("admin_token")

    try {
      const url = editingPlayer 
        ? `/api/admin/players/${editingPlayer.id}` 
        : "/api/admin/players"
      
      const method = editingPlayer ? "PUT" : "POST"
      
      const body: any = {
        display_name: playerName,
        email: playerEmail,
        phone_number: playerPhone,
      }

      if (!editingPlayer && playerPassword) {
        body.password = playerPassword
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save player")
      }

      alert(editingPlayer ? "Player updated successfully" : "Player created successfully")
      setShowPlayerDialog(false)
      fetchPlayers(search, page, limit, sortBy, sortOrder) // Refresh list
    } catch (error: any) {
      console.error("Error saving player:", error)
      alert(error.message || "Failed to save player")
    } finally {
      setSavingPlayer(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const normalizeOptional = (value: any, mode: "email" | "phone") => {
        if (value === undefined || value === null) return ""
        const str = String(value).trim()
        if (!str) return ""
        const lowered = str.toLowerCase()
        if (
          lowered === "-" ||
          lowered === "–" ||
          lowered === "—" ||
          lowered === "n/a" ||
          lowered === "na" ||
          lowered === "null" ||
          lowered === "undefined"
        ) {
          return ""
        }
        if (mode === "email") return lowered
        return str
      }

      const normalizeEmployeeId = (value: any) => {
        if (value === undefined || value === null) return ""
        return String(value).trim().toUpperCase()
      }

      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const previewData: PlayerImportPreview[] = jsonData.map((row: any) => {
        const employee_id =
          row["Employee ID"] || row["employee_id"] || row["EmployeeID"] || row["Employee Id"] || ""
        const display_name = row["Name"] || row["name"] || row["Display Name"] || row["display_name"] || ""
        const email = row["Email"] || row["email"] || ""
        const phone_number =
          row["Mobile Number"] ||
          row["Mobile"] ||
          row["Phone"] ||
          row["phone"] ||
          row["phone_number"] ||
          ""

        const normalizedEmployeeId = normalizeEmployeeId(employee_id)
        const normalizedEmail = normalizeOptional(email, "email")
        const normalizedPhone = normalizeOptional(phone_number, "phone")
        const normalizedName = String(display_name ?? "").trim()

        const errors: string[] = []
        if (!normalizedEmployeeId) errors.push("Missing Employee ID")

        return {
          employee_id: normalizedEmployeeId,
          display_name: normalizedName,
          email: normalizedEmail,
          phone_number: normalizedPhone,
          isValid: errors.length === 0,
          errors,
        }
      })

      const seenEmployeeIds = new Map<string, number>()
      for (const row of previewData) {
        if (!row.employee_id) continue
        seenEmployeeIds.set(row.employee_id, (seenEmployeeIds.get(row.employee_id) || 0) + 1)
      }

      const validatedPreview = previewData.map((row) => {
        if (row.employee_id && (seenEmployeeIds.get(row.employee_id) || 0) > 1) {
          return {
            ...row,
            isValid: false,
            errors: Array.from(new Set([...row.errors, "Duplicate Employee ID in file"])),
          }
        }
        return row
      })

      setImportPreview(validatedPreview)
      setShowImportDialog(true)
    } catch (error: any) {
      console.error("Error parsing file:", error)
      alert("Failed to parse file: " + error.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = "" // Reset input
      }
    }
  }

  const handleConfirmImport = async () => {
    const validRecords = importPreview.filter(p => p.isValid)
    if (validRecords.length === 0) {
      alert("No valid records to import.")
      return
    }

    setImporting(true)
    const token = localStorage.getItem("admin_token")

    try {
      const response = await fetch("/api/admin/players/bulk-import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ players: validRecords }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to import players")
      }

      alert(`Import completed.\nSuccess: ${data.results.success}\nFailed: ${data.results.failed}\nErrors: ${data.results.errors.join(", ")}`)
      setShowImportDialog(false)
      fetchPlayers(search, page, limit, sortBy, sortOrder)
    } catch (error: any) {
      console.error("Error importing players:", error)
      alert(error.message || "Failed to import players")
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AdminNav />
        <SidebarInset className="bg-muted/40">
          <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Players</h2>
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
          <h2 className="text-lg font-semibold">Players</h2>
        </header>
        <div className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-[240px] max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, employee id, email or phone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls, .csv, text/csv"
                onChange={handleFileChange}
              />
              <Button onClick={handleUploadClick} variant="outline" className="gap-2" disabled={uploading}>
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Import Excel"}
              </Button>
              <Button onClick={openAddPlayerDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Player
              </Button>
              <Button onClick={handleExportExcel} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Player List ({total})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
            <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("display_name")}>
                      <div className="flex items-center gap-1">
                        Name
                        {sortBy === "display_name" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("employee_id")}>
                      <div className="flex items-center gap-1">
                        Employee ID
                        {sortBy === "employee_id" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("email")}>
                      <div className="flex items-center gap-1">
                        Email
                        {sortBy === "email" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("phone_number")}>
                      <div className="flex items-center gap-1">
                        Phone
                        {sortBy === "phone_number" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("total_score")}>
                      <div className="flex items-center gap-1">
                        Total Score
                        {sortBy === "total_score" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("games_played")}>
                      <div className="flex items-center gap-1">
                        Games Played
                        {sortBy === "games_played" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center gap-1">
                        Joined
                        {sortBy === "created_at" ? (
                          sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("is_active")}>
                      <div className="flex items-center gap-1">
                        Status
                        {sortBy === "is_active" ? (
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
                  {players.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        {isFetching ? "Loading..." : "No players found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="whitespace-nowrap">{player.display_name || "N/A"}</TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-sm">{player.employee_id || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{player.email || "N/A"}</TableCell>
                        <TableCell className="whitespace-nowrap">{player.phone_number || "N/A"}</TableCell>
                        <TableCell className="whitespace-nowrap">{player.total_score}</TableCell>
                        <TableCell className="whitespace-nowrap">{player.games_played}</TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(player.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Button
                            variant={player.is_active ? "default" : "secondary"}
                            size="sm"
                            onClick={() => handleToggleStatus(player.id, player.is_active)}
                          >
                            {player.is_active ? "Active" : "Disabled"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          <Button variant="outline" size="sm" onClick={() => openEditPlayerDialog(player)} title="Edit Player">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewLogs(player)} title="View Logs">
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPlayer(player)
                              setShowPasswordDialog(true)
                            }}
                            title="Set Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          {!player.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateUser(player.id)}
                              title="Activate User"
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(player.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

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

        {/* Dialog for Add/Edit Player */}
        <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
              <DialogDescription>
                {editingPlayer ? "Update player details." : "Fill in the details to create a new player."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSavePlayer}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="playerName">Display Name</Label>
                  <Input
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playerEmail">Email</Label>
                  <Input
                    id="playerEmail"
                    type="email"
                    value={playerEmail}
                    onChange={(e) => setPlayerEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playerPhone">Phone Number</Label>
                  <Input
                    id="playerPhone"
                    type="tel"
                    value={playerPhone}
                    onChange={(e) => setPlayerPhone(e.target.value)}
                    placeholder="+880..."
                  />
                </div>
                {!editingPlayer && (
                  <div className="space-y-2">
                    <Label htmlFor="playerPassword">Password</Label>
                    <Input
                      id="playerPassword"
                      type="password"
                      value={playerPassword}
                      onChange={(e) => setPlayerPassword(e.target.value)}
                      placeholder="Enter password (optional)"
                    />
                    <p className="text-xs text-muted-foreground">If left blank, a random password will be generated.</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPlayerDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={savingPlayer}>
                  {savingPlayer ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Set Password for {selectedPlayer?.display_name || "Player"}</DialogTitle>
                <DialogDescription>
                  Enter a new password for this user. The password must be at least 6 characters.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <Button onClick={handleSetPassword} disabled={updatingPassword || !newPassword} className="w-full">
                  {updatingPassword ? "Updating..." : "Set Password"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Activity Logs - {selectedPlayer?.display_name || "Player"}</DialogTitle>
                <DialogDescription>Device, browser, and location information for this player.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {logsLoading ? (
                  <div className="text-center py-8">Loading logs...</div>
                ) : playerLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No logs found for this player.</div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Browser</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {playerLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{log.action}</TableCell>
                            <TableCell className="text-sm font-mono">{log.ip_address || "N/A"}</TableCell>
                            <TableCell className="text-sm">{log.browser || "N/A"}</TableCell>
                            <TableCell className="text-sm">
                              {log.device || "N/A"} {log.os ? `(${log.os})` : ""}
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.city && log.country ? `${log.city}, ${log.country}` : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Preview</DialogTitle>
                <DialogDescription>
                  Review the data from your file before importing. Records with missing Employee ID will be skipped.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Total: {importPreview.length} | Valid: {importPreview.filter(p => p.isValid).length} | Invalid: {importPreview.filter(p => !p.isValid).length}
                  </div>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((row, i) => (
                        <TableRow key={i} className={!row.isValid ? "bg-red-50 dark:bg-red-900/20" : ""}>
                          <TableCell>
                            {row.isValid ? (
                              <span className="text-green-600 font-medium">Valid</span>
                            ) : (
                              <span className="text-red-600 font-medium text-xs">
                                {row.errors.join(", ")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{row.employee_id || "-"}</TableCell>
                          <TableCell>{row.display_name || "-"}</TableCell>
                          <TableCell>{row.email || "-"}</TableCell>
                          <TableCell>{row.phone_number || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
                <Button onClick={handleConfirmImport} disabled={importing || importPreview.filter(p => p.isValid).length === 0}>
                  {importing ? "Importing..." : `Import ${importPreview.filter(p => p.isValid).length} Records`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AdminFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
