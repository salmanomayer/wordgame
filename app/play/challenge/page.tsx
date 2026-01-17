"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, ArrowLeft, Trophy } from "lucide-react"

interface Subject {
  id: string
  name: string
}

interface Game {
  id: string
  title: string
  difficulty: string | null
  word_count: number
  attempts_limit: number | null
  stage_count: number
  subjects: Subject[]
}

export default function ChallengePage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me")
        if (!meRes.ok) {
          router.push("/play/login")
          return
        }
        const gamesRes = await fetch("/api/player/games")
        const data = await gamesRes.json().catch(() => ({}))
        if (gamesRes.ok && Array.isArray(data.games)) {
          setGames(data.games)
        } else {
          setGames([])
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const handlePlayGame = async (game: Game) => {
    const subjectId = game.subjects[0]?.id
    if (!subjectId) {
      alert("This game has no available subjects")
      return
    }
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subjectId,
          difficulty: game.difficulty || "medium",
          game_id: game.id,
          is_demo: false,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to start game")
      router.push(`/play/game/${data.session_id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start game")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950">
        <div className="text-lg text-white">Loading games...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 p-4 sm:p-6">
      <div className="container mx-auto max-w-5xl py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => router.push("/play/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={() => router.push("/play/leaderboard")}>
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Challenge Game</h1>
          <p className="text-slate-300">Pick a game created by admin and start playing</p>
        </div>

        {games.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 text-center text-white">No games available</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((g) => (
              <Card key={g.id} className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-white">{g.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-slate-300 text-sm">
                    Difficulty: <span className="text-white">{g.difficulty || "medium"}</span>
                  </div>
                  <div className="text-slate-300 text-sm">
                    Words: <span className="text-white">{g.word_count}</span>
                  </div>
                  <div className="text-slate-300 text-sm">
                    Stages: <span className="text-white">{g.stage_count}</span>
                  </div>
                  <div className="text-slate-300 text-sm">
                    Subjects:{" "}
                    <span className="text-white">
                      {g.subjects.length > 0 ? g.subjects.map((s) => s.name).join(", ") : "None"}
                    </span>
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handlePlayGame(g)}>
                    <Play className="mr-2 h-4 w-4" />
                    Play
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
