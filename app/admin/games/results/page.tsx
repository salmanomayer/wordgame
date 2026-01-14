"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminFooter } from "@/components/admin/admin-footer"
import { Play, Trophy, Filter } from "lucide-react"

interface Game {
  id: string
  title: string
  difficulty: string | null
  start_time: string | null
  end_time: string | null
}

interface LeaderboardEntry {
  player_id: string
  display_name: string
  total_score: number
  games_played: number
  rank: number
}

interface SessionRow {
  id: string
  player_id: string
  display_name: string | null
  email: string | null
  subject_name: string
  difficulty: string
  score: number
  words_completed: number
  total_words: number
  completed_at: string
}

export default function AdminResultsPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>("")
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }
      const gamesRes = await fetch("/api/admin/games?limit=all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const gamesJson = await gamesRes.json().catch(() => ({ data: [] }))
      const list = Array.isArray(gamesJson?.data) ? gamesJson.data : []
      setGames(list)
      if (list.length > 0) {
        setSelectedGameId(list[0].id)
      }
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    const loadResults = async () => {
      const token = localStorage.getItem("admin_token")
      if (!token || !selectedGameId) return
      const res = await fetch(`/api/admin/games/${selectedGameId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      setLeaderboard(Array.isArray(json?.leaderboard) ? json.leaderboard : [])
      setSessions(Array.isArray(json?.sessions) ? json.sessions : [])
    }
    loadResults()
  }, [selectedGameId])

  const filteredLeaderboard = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leaderboard
    return leaderboard.filter(
      (l) =>
        l.display_name?.toLowerCase().includes(q) ||
        String(l.total_score).includes(q) ||
        String(l.rank).includes(q),
    )
  }, [leaderboard, search])

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter(
      (s) =>
        (s.display_name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        s.subject_name.toLowerCase().includes(q) ||
        s.difficulty.toLowerCase().includes(q) ||
        String(s.score).includes(q),
    )
  }, [sessions, search])

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <SidebarProvider>
      <AdminNav />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="mr-2" />
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Game Results</h1>
          </div>
        </header>
        <main className="p-4 space-y-6">
          <Card className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Select Game</label>
                <select
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  className="flex h-9 rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search player, subject, difficulty or score"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-72"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h2 className="text-base font-semibold">Leaderboard</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const rows = filteredLeaderboard.map((l) => ({
                    rank: l.rank,
                    player: l.display_name,
                    total_score: l.total_score,
                    games_played: l.games_played,
                  }))
                  const csv =
                    "rank,player,total_score,games_played\n" +
                    rows.map((r) => `${r.rank},${r.player},${r.total_score},${r.games_played}`).join("\n")
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = "leaderboard.csv"
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Export CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Games Played</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaderboard.map((l) => (
                    <TableRow key={l.player_id}>
                      <TableCell>{l.rank}</TableCell>
                      <TableCell>{l.display_name}</TableCell>
                      <TableCell>{l.total_score}</TableCell>
                      <TableCell>{l.games_played}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Play className="h-5 w-5 text-emerald-500" />
              <h2 className="text-base font-semibold">Sessions</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Words</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No sessions
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.display_name || s.email || s.player_id}</TableCell>
                      <TableCell>{s.subject_name}</TableCell>
                      <TableCell className="uppercase">{s.difficulty}</TableCell>
                      <TableCell>{s.score}</TableCell>
                      <TableCell>
                        {s.words_completed}/{s.total_words}
                      </TableCell>
                      <TableCell>{new Date(s.completed_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <AdminFooter />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
