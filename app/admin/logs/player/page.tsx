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
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Eye,
  MapPin,
  Monitor,
  Globe,
  Users
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { AdminFooter } from "@/components/admin/admin-footer"
import { Badge } from "@/components/ui/badge"

interface PlayerLog {
  id: string
  player_id: string
  player_email: string
  player_name: string
  action: string
  ip_address: string
  user_agent: string
  browser: string
  device: string
  os: string
  country: string
  city: string
  region: string
  latitude: number
  longitude: number
  created_at: string
}

export default function PlayerLogsPage() {
  const [logs, setLogs] = useState<PlayerLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState("20")
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  
  const [selectedLog, setSelectedLog] = useState<PlayerLog | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()

  const fetchLogs = useCallback(
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
        const response = await fetch(`/api/admin/logs/player?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch player logs")
        }
        const result = await response.json()
        setLogs(Array.isArray(result.data) ? result.data : [])
        setTotal(result.total || 0)
      } catch (error) {
        console.error("Error fetching logs:", error)
        setLogs([])
        setTotal(0)
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Could not load logs",
        })
      } finally {
        setLoading(false)
      }
    },
    [router, toast]
  )

  useEffect(() => {
    setLoading(true)
    const handle = setTimeout(() => {
      fetchLogs(search, page, limit, sortBy, sortOrder)
    }, 250)
    return () => clearTimeout(handle)
  }, [fetchLogs, search, page, limit, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
    setPage(1)
  }

  const handleViewDetails = (log: PlayerLog) => {
    setSelectedLog(log)
    setIsDetailOpen(true)
  }

  const getActionColor = (action: string) => {
    const act = action.toLowerCase()
    if (act.includes("login")) return "bg-green-500/10 text-green-500 border-green-500/20"
    if (act.includes("logout")) return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    if (act.includes("game")) return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    if (act.includes("register")) return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    return "bg-slate-500/10 text-slate-500 border-slate-500/20"
  }

  if (loading && logs.length === 0) {
    return (
      <SidebarProvider>
        <AdminNav />
        <SidebarInset className="bg-muted/40">
          <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Player Logs</h2>
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
          <h2 className="text-lg font-semibold">Player Logs</h2>
        </header>
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Player Activity Logs</h1>
            <p className="text-muted-foreground">Monitor player logins, registrations, and game activities</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-6">
                <Label htmlFor="log-search">Search</Label>
                <Input
                  id="log-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by player, email, IP, action, or country..."
                />
              </div>

              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] whitespace-nowrap">S/N</TableHead>
                      <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("created_at")}>
                        <div className="flex items-center gap-1">
                          Timestamp
                          {sortBy === "created_at" ? (
                            sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("player_email")}>
                        <div className="flex items-center gap-1">
                          Player
                          {sortBy === "player_email" ? (
                            sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("action")}>
                        <div className="flex items-center gap-1">
                          Action
                          {sortBy === "action" ? (
                            sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("country")}>
                        <div className="flex items-center gap-1">
                          Location
                          {sortBy === "country" ? (
                            sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("ip_address")}>
                        <div className="flex items-center gap-1">
                          IP & Device
                          {sortBy === "ip_address" ? (
                            sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No player logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log, index) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {limit === "all" ? index + 1 : (page - 1) * parseInt(limit) + index + 1}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-sm">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col">
                                <span className="font-medium">{log.player_name || "Unknown"}</span>
                                <span className="text-xs text-muted-foreground">{log.player_email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className={getActionColor(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1">
                                {log.country && <Globe className="h-3 w-3 text-muted-foreground" />}
                                <span>{log.city ? `${log.city}, ` : ""}{log.country || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            <div className="font-mono mb-0.5">{log.ip_address}</div>
                            <div className="text-muted-foreground truncate max-w-[150px]" title={log.device || log.os}>
                                {log.device} {log.os && `(${log.os})`}
                            </div>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(log)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
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

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    Showing {logs.length > 0 ? (limit === "all" ? 1 : (page - 1) * parseInt(limit) + 1) : 0} to{" "}
                    {limit === "all" 
                      ? total 
                      : Math.min(page * parseInt(limit), total)
                    } of {total} entries
                  </div>
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

        {/* Details Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Activity Details</DialogTitle>
              <DialogDescription>
                Full details for player activity log {selectedLog?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Timestamp</Label>
                    <p className="text-sm font-medium">{new Date(selectedLog.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Action</Label>
                    <p className="text-sm font-medium">
                      <Badge variant="outline" className={getActionColor(selectedLog.action)}>
                        {selectedLog.action}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" /> Player Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Display Name</Label>
                            <p className="text-sm font-medium">{selectedLog.player_name}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Email</Label>
                            <p className="text-sm font-medium">{selectedLog.player_email}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Player ID</Label>
                            <p className="text-xs font-mono text-muted-foreground">{selectedLog.player_id}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Monitor className="h-4 w-4" /> Device & Network
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">IP Address</Label>
                            <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Browser</Label>
                            <p className="text-sm">{selectedLog.browser}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">OS</Label>
                            <p className="text-sm">{selectedLog.os}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Device Type</Label>
                            <p className="text-sm">{selectedLog.device}</p>
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">User Agent</Label>
                        <p className="text-xs font-mono text-muted-foreground break-all mt-1">{selectedLog.user_agent}</p>
                    </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Location Data
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Country</Label>
                            <p className="text-sm">{selectedLog.country || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Region</Label>
                            <p className="text-sm">{selectedLog.region || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">City</Label>
                            <p className="text-sm">{selectedLog.city || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Coordinates</Label>
                            <p className="text-sm font-mono">
                                {selectedLog.latitude && selectedLog.longitude 
                                    ? `${selectedLog.latitude}, ${selectedLog.longitude}` 
                                    : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AdminFooter />
      </SidebarInset>
    </SidebarProvider>
  )
}
