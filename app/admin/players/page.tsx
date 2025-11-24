"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface Player {
  id: string
  display_name: string
  phone_number: string
  total_score: number
  games_played: number
  created_at: string
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
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
          <CardHeader>
            <CardTitle>Player Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Games Played</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No players found
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>{player.display_name || "N/A"}</TableCell>
                      <TableCell>{player.phone_number || "N/A"}</TableCell>
                      <TableCell>{player.total_score}</TableCell>
                      <TableCell>{player.games_played}</TableCell>
                      <TableCell>{new Date(player.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
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
      </div>
    </div>
  )
}
