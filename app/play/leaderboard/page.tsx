"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react"

interface LeaderboardEntry {
  player_id: string
  display_name: string | null
  phone_number: string | null
  total_score: number
  games_played: number
  rank: number
}

export default function LeaderboardPage() {
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([])
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<{ weekly: number | null; monthly: number | null }>({
    weekly: null,
    monthly: null,
  })
  const [isChallenge, setIsChallenge] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const meRes = await fetch("/api/auth/me")
        if (!meRes.ok) {
          router.push("/play/login")
          return
        }
        const me = await meRes.json().catch(() => null)
        const playerId = me?.player?.id as string | undefined
        if (!playerId) {
          router.push("/play/login")
          return
        }

        const [weeklyRes, monthlyRes] = await Promise.all([
          fetch(`/api/leaderboard/weekly?is_challenge=${isChallenge}`),
          fetch(`/api/leaderboard/monthly?is_challenge=${isChallenge}`),
        ])

        if (!weeklyRes.ok || !monthlyRes.ok) {
          router.push("/play/login")
          return
        }

        const weekly = (await weeklyRes.json().catch(() => [])) as LeaderboardEntry[]
        const monthly = (await monthlyRes.json().catch(() => [])) as LeaderboardEntry[]

        if (Array.isArray(weekly)) setWeeklyLeaders(weekly)
        if (Array.isArray(monthly)) setMonthlyLeaders(monthly)

        if (Array.isArray(weekly)) {
          const userWeekly = weekly.find((entry) => entry.player_id === playerId)
          setCurrentUserRank((prev) => ({ ...prev, weekly: userWeekly?.rank || null }))
        }

        if (Array.isArray(monthly)) {
          const userMonthly = monthly.find((entry) => entry.player_id === playerId)
          setCurrentUserRank((prev) => ({ ...prev, monthly: userMonthly?.rank || null }))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboards()
  }, [router, isChallenge])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return null
  }

  const LeaderboardTable = ({ data }: { data: LeaderboardEntry[] }) => (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-700/50">
          <TableHead className="text-slate-300">Rank</TableHead>
          <TableHead className="text-slate-300">Player</TableHead>
          <TableHead className="text-slate-300 text-right">Score</TableHead>
          <TableHead className="text-slate-300 text-right">Games</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-slate-400 py-8">
              No data yet. Be the first to play!
            </TableCell>
          </TableRow>
        ) : (
          data.map((entry) => (
            <TableRow key={entry.player_id} className="border-slate-700/50 hover:bg-slate-800/30 transition-colors">
              <TableCell className="font-bold text-white">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  <span>#{entry.rank}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-200">
                {entry.display_name || entry.phone_number || "Anonymous Player"}
              </TableCell>
              <TableCell className="text-right font-bold text-emerald-400">{entry.total_score}</TableCell>
              <TableCell className="text-right text-slate-300">{entry.games_played}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950">
        <div className="text-lg text-white">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 p-4 sm:p-6">
      <div className="container mx-auto max-w-4xl py-6">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 mb-6"
          onClick={() => router.push("/play/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Leaderboard</h1>
            <p className="text-slate-400">See how you stack up against other players</p>
          </div>
          <div className="flex bg-slate-800/90 p-1 rounded-lg">
            <button
              onClick={() => setIsChallenge(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !isChallenge ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Random Play
            </button>
            <button
              onClick={() => setIsChallenge(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isChallenge ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Challenge
            </button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 border-none mb-6 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white/80 text-sm mb-2">Your Ranking</h3>
                <div className="flex gap-6">
                  <div>
                    <span className="text-white text-3xl font-bold">
                      {currentUserRank.weekly ? `#${currentUserRank.weekly}` : "N/A"}
                    </span>
                    <span className="text-white/70 text-sm ml-2 block sm:inline">This Week</span>
                  </div>
                  <div>
                    <span className="text-white text-3xl font-bold">
                      {currentUserRank.monthly ? `#${currentUserRank.monthly}` : "N/A"}
                    </span>
                    <span className="text-white/70 text-sm ml-2 block sm:inline">This Month</span>
                  </div>
                </div>
              </div>
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-white/30" />
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Tabs */}
        <Card className="bg-slate-900/90 backdrop-blur border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/90 p-1">
                <TabsTrigger
                  value="weekly"
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  This Week
                </TabsTrigger>
                <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  This Month
                </TabsTrigger>
              </TabsList>
              <TabsContent value="weekly" className="mt-4">
                <LeaderboardTable data={weeklyLeaders} />
              </TabsContent>
              <TabsContent value="monthly" className="mt-4">
                <LeaderboardTable data={monthlyLeaders} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
