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
  Plus,
  Clock,
  Calendar,
  Play,
  Search
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
import { format } from "date-fns"
import { AdminGameTestModal } from "@/components/admin/game-test-modal"
import { AdminFooter } from "@/components/admin/admin-footer"

interface Game {
  id: string
  title: string
  start_time: string | null
  end_time: string | null
  correct_marks: number
  time_per_word: number
  is_active: boolean
  created_at: string
  subject_count: number
  stage_count: number
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState("20")
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  
  const [deletingGame, setDeletingGame] = useState<Game | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [testingGameId, setTestingGameId] = useState<string | null>(null)
  
  const router = useRouter()
  const { toast } = useToast()

  const fetchGames = useCallback(
    async (q: string, p: number, l: string, sort: string, order: string) => {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }

      setLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: p.toString(),
          limit: l,
          sort_by: sort,
          sort_order: order,
        })
        if (q) queryParams.append("q", q)

        const response = await fetch(`/api/admin/games?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch games")
        }

        const result = await response.json()
        setGames(Array.isArray(result.data) ? result.data : [])
        setTotal(result.total || 0)
      } catch (error) {
        console.error("[v0] Error fetching games:", error)
        setGames([])
        setTotal(0)
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Could not load games. Please try again.",
        })
      } finally {
        setLoading(false)
      }
    },
    [router, toast]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGames(search, page, limit, sortBy, sortOrder)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, page, limit, sortBy, sortOrder, fetchGames])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deletingGame) return
    const token = localStorage.getItem("admin_token")
    
    try {
      const response = await fetch(`/api/admin/games/${deletingGame.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to delete game")

      toast({
        title: "Success",
        description: "Game deleted successfully",
      })
      fetchGames(search, page, limit, sortBy, sortOrder)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete game",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingGame(null)
    }
  }

  const totalPages = limit === "all" ? 1 : Math.ceil(total / parseInt(limit))

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  return (
    <SidebarProvider>
      <AdminNav />
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-bold">Games Management</h1>
        </header>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-[240px] max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search games..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <Button onClick={() => router.push("/admin/games/new")} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" /> New Game
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Game List ({total})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                        onClick={() => handleSort("title")}
                      >
                        <div className="flex items-center">Title <SortIcon column="title" /></div>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Configuration</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                        onClick={() => handleSort("start_time")}
                      >
                        <div className="flex items-center">Schedule <SortIcon column="start_time" /></div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-center whitespace-nowrap"
                        onClick={() => handleSort("is_active")}
                      >
                        <div className="flex items-center justify-center">Status <SortIcon column="is_active" /></div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right whitespace-nowrap"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center justify-end">Created <SortIcon column="created_at" /></div>
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">Loading games...</TableCell>
                      </TableRow>
                    ) : games.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">No games found.</TableCell>
                      </TableRow>
                    ) : (
                      games.map((game) => (
                        <TableRow key={game.id}>
                          <TableCell className="font-medium whitespace-nowrap">{game.title}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Badge variant="outline" className="font-normal">{game.correct_marks} Marks</Badge>
                                <Badge variant="outline" className="font-normal">{game.time_per_word}s/Word</Badge>
                              </span>
                              <span className="flex items-center gap-1 mt-1">
                                {game.stage_count > 0 ? (
                                  <Badge variant="secondary" className="text-[10px] px-1 h-4">{game.stage_count} Stages</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1 h-4">{game.subject_count} Subjects</Badge>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {game.start_time ? format(new Date(game.start_time), "MMM d, yyyy HH:mm") : "No start"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {game.end_time ? format(new Date(game.end_time), "MMM d, yyyy HH:mm") : "No end"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge variant={game.is_active ? "default" : "secondary"}>
                              {game.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(game.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => setTestingGameId(game.id)}
                                title="Test Game"
                              >
                                <Play className="h-4 w-4 fill-current" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => router.push(`/admin/games/${game.id}/edit`)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setDeletingGame(game)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
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

              {/* Pagination UI same as Words page */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</p>
                  <Select value={limit} onValueChange={(v) => { setLimit(v); setPage(1); }}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={limit} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-sm font-medium whitespace-nowrap">
                    Page {page} of {totalPages || 1}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages || totalPages === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages || totalPages === 0}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <AdminFooter />
        </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the game {deletingGame?.title} 
                and all its stages.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete Game</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AdminGameTestModal 
          gameId={testingGameId} 
          onClose={() => setTestingGameId(null)} 
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
