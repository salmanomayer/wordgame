"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Key, UserCheck, Download, Activity } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [playerLogs, setPlayerLogs] = useState<PlayerLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }

    const fetchPlayers = async () => {
      try {
        const response = await fetch("/api/admin/players", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch players")

        const data = await response.json()
        setPlayers(data)
      } catch (error) {
        console.error("[v0] Error fetching players:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [router])

  const handleExportExcel = () => {
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

      if (!response.ok) throw new Error("Failed to fetch logs")

      const data = await response.json()
      setPlayerLogs(data)
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
            <CardTitle>Player Management</CardTitle>
            <Button onClick={handleExportExcel} variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Games Played</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell>{player.display_name || "N/A"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{player.email || "N/A"}</TableCell>
                      <TableCell>{player.phone_number || "N/A"}</TableCell>
                      <TableCell>{player.total_score}</TableCell>
                      <TableCell>{player.games_played}</TableCell>
                      <TableCell>{new Date(player.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant={player.is_active ? "default" : "secondary"}
                          size="sm"
                          onClick={() => handleToggleStatus(player.id, player.is_active)}
                        >
                          {player.is_active ? "Active" : "Disabled"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
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
          </CardContent>
        </Card>

        {/* Password Dialog */}
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
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
