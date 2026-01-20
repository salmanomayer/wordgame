"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Trophy, Play, Sparkles, Brain, Zap, ArrowLeft, Gamepad2 } from "lucide-react"

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
  attempts_count: number
}

export default function ChallengePage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me")
        if (!meRes.ok) {
          router.push("/play/login")
          return
        }
        const me = await meRes.json().catch(() => null)
        const currentPlayer = me?.player
        if (!currentPlayer) {
          router.push("/play/login")
          return
        }
        setPlayer(currentPlayer)

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
    try {
      // Check for multi-stage progress
      const progressRes = await fetch(`/api/player/game/${game.id}/progress`)
      const progress = await progressRes.json().catch(() => null)

      let startParams: any = {
        game_id: game.id,
        is_demo: false,
        difficulty: game.difficulty || "medium",
      }

      if (progress?.next_stage_id) {
        // Start next stage
        startParams.stage_id = progress.next_stage_id
      } else if (progress?.stages && progress.stages.length > 0) {
        // If has stages but no next stage (completed) or no progress (start fresh), start first stage
        // If completed, we restart
        startParams.stage_id = progress.stages[0].id
      } else {
        // Legacy/Single subject game
        const subjectId = game.subjects[0]?.id
        if (!subjectId) {
          alert("This game has no available subjects")
          return
        }
        startParams.subject_id = subjectId
      }

      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(startParams),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error("Game start failed:", data)
        throw new Error(data?.error || "Failed to start game")
      }
      router.push(`/play/game/${data.session_id}`)
    } catch (err) {
      console.error("Game start error:", err)
      alert(err instanceof Error ? err.message : "Failed to start game")
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 relative overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {["CHALLENGE", "MASTER", "PUZZLE", "WORD", "GAME", "SKILL", "FUN", "WIN"].map((word, i) => (
          <div
            key={i}
            className="absolute text-4xl font-bold text-white animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          >
            {word}
          </div>
        ))}
      </div>

      <div className="container relative z-10 mx-auto p-4 sm:p-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
              Challenge Arena
            </h1>
            <p className="text-sm sm:text-base text-gray-300">Pick a challenge, {player?.display_name || "Player"}!</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.push("/play/random")} className="flex-1 sm:flex-none">
              <Gamepad2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Random Play</span>
              <span className="sm:hidden">Random</span>
            </Button>
            <Button variant="outline" onClick={() => router.push("/play/leaderboard")} className="flex-1 sm:flex-none">
              <Trophy className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">Scores</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex-1 sm:flex-none bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/90 backdrop-blur border-slate-700 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            {games.length === 0 ? (
              <div className="text-center text-white py-12">
                <Brain className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-semibold mb-2">No Challenges Available</h3>
                <p className="text-gray-400">Check back later for new games!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((g) => (
                  <Card key={g.id} className="bg-gradient-to-r from-emerald-500 to-blue-600 border-none text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-white/20 text-white transition-colors">
                          <Trophy className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-mono text-white/80 bg-black/20 px-2 py-1 rounded">
                          {g.difficulty?.toUpperCase() || "MEDIUM"}
                        </span>
                      </div>
                      <CardTitle className="text-white text-xl mt-4 line-clamp-1">{g.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm text-emerald-50">
                        <div className="flex justify-between">
                          <span>Words to solve:</span>
                          <span className="font-semibold text-white">{g.word_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stages:</span>
                          <span className="font-semibold text-white">{g.stage_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Topic:</span>
                          <span className="font-semibold text-white line-clamp-1 text-right max-w-[50%]">
                            {g.subjects.length > 0 ? g.subjects.map((s) => s.name).join(", ") : "Mixed"}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        className={`w-full font-bold py-2 shadow-lg backdrop-blur-sm ${
                            g.attempts_limit !== null && g.attempts_count >= g.attempts_limit
                            ? "bg-gray-500/50 cursor-not-allowed text-gray-300 border border-gray-600"
                            : "bg-white/20 hover:bg-white/30 text-white border border-white/40"
                        }`}
                        onClick={() => {
                            if (g.attempts_limit === null || g.attempts_count < g.attempts_limit) {
                                handlePlayGame(g)
                            }
                        }}
                        disabled={g.attempts_limit !== null && g.attempts_count >= g.attempts_limit}
                      >
                        {g.attempts_limit !== null && g.attempts_count >= g.attempts_limit ? (
                            <span>Attempts Limit Reached</span>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" />
                                Start Challenge
                            </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
