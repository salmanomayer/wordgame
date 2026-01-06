"use client"

import { useCallback, useEffect, useState } from "react"
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
  ChevronsRight
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState("20")
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [playerLogs, setPlayerLogs] = useState<PlayerLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const router = useRouter()

  const fetchPlayers = useCallback(
    async (q: string, p: number, l: string, sort: string, order: string) => {
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
        const response = await fetch(`/api/admin/players?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch players")
        }
        const result = await response.json()
        setPlayers(Array.isArray(result.data) ? result.data : [])
        setTotal(result.total || 0)
      } catch (error) {
        console.error("[v0] Error fetching players:", error)
        setPlayers([])
        setTotal(0)
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
    setLoading(true)
    const handle = setTimeout(() => {
      fetchPlayers(search, page, limit, sortBy, sortOrder)
    }, 250)
    return () => clearTimeout(handle)
  }, [router, fetchPlayers, search, page, limit, sortBy, sortOrder])

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
                  placeholder="Search players..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <Button onClick={handleExportExcel} variant="outline" className="w-full sm:w-auto gap-2 bg-transparent shrink-0">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
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
                      <TableCell colSpan={8} className="text-center">
                        No players found
                      </TableCell>
                    </TableRow>
                  ) : (
                    players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="whitespace-nowrap">{player.display_name || "N/A"}</TableCell>
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

          <AdminFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
