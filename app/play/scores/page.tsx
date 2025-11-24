"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface GameSession {
  id: string
  score: number
  difficulty: string
  words_completed: number
  total_words: number
  completed_at: string
  subjects: {
    name: string
  }
}

interface PlayerStats {
  total_score: number
  games_played: number
}

interface SubjectStats {
  subject_id: string
  subject_name: string
  games_played: number
  total_score: number
  avg_score: number
  best_score: number
}

export default function ScoresPage() {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/play/login")
        return
      }

      // Fetch player stats
      const { data: player } = await supabase
        .from("players")
        .select("total_score, games_played")
        .eq("id", user.id)
        .single()

      if (player) setStats(player)

      // Fetch game sessions
      const { data: gameSessions } = await supabase
        .from("game_sessions")
        .select("*, subjects(name)")
        .eq("player_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(10)

      if (gameSessions) setSessions(gameSessions as GameSession[])

      const { data: subjectData } = await supabase.rpc("get_player_subject_stats", {
        p_player_id: user.id,
      })

      if (subjectData) setSubjectStats(subjectData)

      setLoading(false)
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="container mx-auto max-w-5xl py-6">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 mb-6"
          onClick={() => router.push("/play/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card className="bg-slate-900/90 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Score</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.total_score || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Games Played</CardTitle>
              <Trophy className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.games_played || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/90 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Your Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="recent">Recent Games</TabsTrigger>
                <TabsTrigger value="subjects">By Subject</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Category</TableHead>
                      <TableHead className="text-slate-300">Difficulty</TableHead>
                      <TableHead className="text-slate-300">Score</TableHead>
                      <TableHead className="text-slate-300">Words</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400">
                          No games played yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((session) => (
                        <TableRow key={session.id} className="border-slate-700">
                          <TableCell className="font-medium text-white">{session.subjects.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                session.difficulty === "easy"
                                  ? "default"
                                  : session.difficulty === "medium"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {session.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-green-400">{session.score}</TableCell>
                          <TableCell className="text-slate-300">
                            {session.words_completed}/{session.total_words}
                          </TableCell>
                          <TableCell className="text-slate-400">
                            {new Date(session.completed_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="subjects" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Subject</TableHead>
                      <TableHead className="text-slate-300 text-right">Games</TableHead>
                      <TableHead className="text-slate-300 text-right">Total Score</TableHead>
                      <TableHead className="text-slate-300 text-right">Avg Score</TableHead>
                      <TableHead className="text-slate-300 text-right">Best Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400">
                          No subject data yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      subjectStats.map((stat) => (
                        <TableRow key={stat.subject_id} className="border-slate-700">
                          <TableCell className="font-medium text-white">{stat.subject_name}</TableCell>
                          <TableCell className="text-right text-slate-300">{stat.games_played}</TableCell>
                          <TableCell className="text-right font-bold text-green-400">{stat.total_score}</TableCell>
                          <TableCell className="text-right text-slate-300">{stat.avg_score.toFixed(1)}</TableCell>
                          <TableCell className="text-right font-bold text-yellow-400">{stat.best_score}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
