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
  employee_id?: string | null
  total_score: number
  games_played: number
  rank: number
  total_time_seconds?: number
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
  stage_status?: string
}

export default function ChallengeResultsPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>("")
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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

  const [leaderboardSortColumn, setLeaderboardSortColumn] = useState<string | null>(null)
  const [leaderboardSortDirection, setLeaderboardSortDirection] = useState<"asc" | "desc">("asc")

  const formatTime = (seconds: number) => {
    if (!seconds && seconds !== 0) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const filteredLeaderboard = useMemo(() => {
    let result = [...leaderboard]
    const q = search.trim().toLowerCase()
    
    if (q) {
        result = result.filter(
          (l) =>
            l.display_name?.toLowerCase().includes(q) ||
            String(l.total_score).includes(q) ||
            String(l.rank).includes(q),
        )
    }

    if (leaderboardSortColumn) {
        result.sort((a: any, b: any) => {
            const valA = a[leaderboardSortColumn]
            const valB = b[leaderboardSortColumn]
            if (valA < valB) return leaderboardSortDirection === 'asc' ? -1 : 1
            if (valA > valB) return leaderboardSortDirection === 'asc' ? 1 : -1
            return 0
        })
    }
    
    return result
  }, [leaderboard, search, leaderboardSortColumn, leaderboardSortDirection])

  const handleLeaderboardSort = (column: string) => {
      if (leaderboardSortColumn === column) {
          setLeaderboardSortDirection(leaderboardSortDirection === 'asc' ? 'desc' : 'asc')
      } else {
          setLeaderboardSortColumn(column)
          setLeaderboardSortDirection('asc')
      }
  }

  const filteredSessions = useMemo(() => {
    let result = [...sessions]
    const q = search.trim().toLowerCase()
    
    if (q) {
        result = result.filter(
          (s) =>
            (s.display_name || "").toLowerCase().includes(q) ||
            (s.email || "").toLowerCase().includes(q) ||
            s.subject_name.toLowerCase().includes(q) ||
            s.difficulty.toLowerCase().includes(q) ||
            String(s.score).includes(q),
        )
    }

    if (sortColumn) {
        result.sort((a: any, b: any) => {
            let valA = a[sortColumn]
            let valB = b[sortColumn]
            
            // Handle specific column cases if needed
            if (sortColumn === 'completed_at') {
                valA = new Date(valA).getTime()
                valB = new Date(valB).getTime()
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1
            return 0
        })
    }

    return result
  }, [sessions, search, sortColumn, sortDirection])

  const paginatedSessions = useMemo(() => {
      const startIndex = (currentPage - 1) * rowsPerPage
      return filteredSessions.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredSessions, currentPage, rowsPerPage])

  const totalPages = Math.ceil(filteredSessions.length / rowsPerPage)

  const handleSort = (column: string) => {
      if (sortColumn === column) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      } else {
          setSortColumn(column)
          setSortDirection('asc')
      }
  }

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
            <h1 className="text-lg font-semibold">Challenge Game Results</h1>
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
                    employee_id: l.employee_id || "",
                    total_score: l.total_score,
                    games_played: l.games_played,
                  }))
                  const csv =
                    "rank,player,employee_id,total_score,games_played\n" +
                    rows.map((r) => `${r.rank},${r.player},${r.employee_id},${r.total_score},${r.games_played}`).join("\n")
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
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleLeaderboardSort('rank')}>
                      Rank {leaderboardSortColumn === 'rank' && (leaderboardSortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleLeaderboardSort('display_name')}>
                      Player {leaderboardSortColumn === 'display_name' && (leaderboardSortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleLeaderboardSort('total_score')}>
                      Total Score {leaderboardSortColumn === 'total_score' && (leaderboardSortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleLeaderboardSort('games_played')}>
                      Games Played {leaderboardSortColumn === 'games_played' && (leaderboardSortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaderboard.map((l) => (
                    <TableRow key={l.player_id}>
                      <TableCell>{l.rank}</TableCell>
                      <TableCell>
                        <div className="font-medium">{l.display_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{l.employee_id || "-"}</div>
                      </TableCell>
                      <TableCell>{l.total_score}</TableCell>
                      <TableCell>{formatTime(l.total_time_seconds || 0)}</TableCell>
                      <TableCell>{l.games_played}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-3">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-emerald-500" />
                <h2 className="text-base font-semibold">Sessions</h2>
              </div>
              <div className="flex items-center gap-3">
                  <select
                      value={rowsPerPage}
                      onChange={(e) => {
                          setRowsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                      }}
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                  >
                      <option value={10}>10 rows</option>
                      <option value={20}>20 rows</option>
                      <option value={50}>50 rows</option>
                      <option value={100}>100 rows</option>
                  </select>
              </div>
            </div>
            <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('display_name')}>
                      Player {sortColumn === 'display_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('subject_name')}>
                      Subject {sortColumn === 'subject_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('difficulty')}>
                      Difficulty {sortColumn === 'difficulty' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('score')}>
                      Score {sortColumn === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Words</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('completed_at')}>
                      Completed {sortColumn === 'completed_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.display_name || s.email || s.player_id}</TableCell>
                      <TableCell>
                        <div>{s.subject_name}</div>
                        {s.stage_status && <div className="text-xs text-muted-foreground">{s.stage_status}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="uppercase">{s.difficulty}</div>
                        {s.stage_status && <div className="text-xs text-muted-foreground">{s.stage_status}</div>}
                      </TableCell>
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
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredSessions.length)} of {filteredSessions.length} entries
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = i + 1
                            if (totalPages > 5 && currentPage > 3) {
                                pageNum = currentPage - 2 + i
                                if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                            }
                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                    onClick={() => setCurrentPage(pageNum)}
                                >
                                    {pageNum}
                                </Button>
                            )
                        })}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next
                    </Button>
                </div>
            </div>
          </Card>

          <AdminFooter />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
