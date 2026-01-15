"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, Settings, Trophy, Play, Sparkles, Brain, Zap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format } from "date-fns"

interface Subject {
  id: string
  name: string
  description: string
}

interface Game {
  id: string
  title: string
  description?: string
  start_time: string | null
  end_time: string | null
  correct_marks: number
  time_per_word: number
  word_count: number
  difficulty: string
  is_active: boolean
  stage_count: number
}

export default function ChallangeGamePage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [user, setUser] = useState<any>(null)
  const [games, setGames] = useState<Game[]>([])
  const [player, setPlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium")
  const [showSettings, setShowSettings] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
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

        setUser(currentPlayer)
        setPlayer(currentPlayer)

        if (!currentPlayer.is_active) {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
          router.push("/play/login")
          return
        }

        try {
          await fetch("/api/player/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "dashboard_visit" }),
          })
        } catch (logError) {
          console.error("[v0] Failed to log activity:", logError)
        }

        const subjectsRes = await fetch("/api/subjects")
        const subjects = await subjectsRes.json().catch(() => [])

        if (Array.isArray(subjects) && subjects.length > 0) {
          setSubjects(subjects)
          const randomIndex = Math.floor(Math.random() * subjects.length)
          setSelectedSubject(subjects[randomIndex].id)
        }

        const gamesRes = await fetch("/api/game/list")
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json().catch(() => [])
          if (Array.isArray(gamesData.games)) {
            setGames(gamesData.games)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handlePlayGame = async (gameId: string) => {
    console.log("[v0] Play game clicked", { gameId })
    if (!player?.id) {
      console.error("[v0] No player record found")
      alert("Player profile not found. Please refresh the page or log in again.")
      router.push("/play/login")
      return
    }

    try {
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: gameId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to join game")
      router.push(`/play/game/${data.session_id}`)
    } catch (error) {
      console.error("[v0] Failed to join game", error)
      alert(error instanceof Error ? error.message : "Failed to join game. Please try again.")
    }
  }

  const handlePlayNow = async () => {
    console.log("[v0] Play Now clicked", { selectedSubject, selectedDifficulty })
    if (!selectedSubject) {
      console.log("[v0] No subject selected")
      alert("Please select a subject first")
      return
    }

    if (!player?.id) {
      console.error("[v0] No player record found")
      alert("Player profile not found. Please refresh the page or log in again.")
      router.push("/play/login")
      return
    }

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: selectedSubject, difficulty: selectedDifficulty, is_demo: false }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to start game")
      router.push(`/play/game/${data.session_id}`)
    } catch (error) {
      console.error("[v0] Failed to start game", error)
      alert(error instanceof Error ? error.message : "Failed to start game. Please try again.")
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    router.push("/")
  }

  const getSelectedSubjectName = () => {
    const subject = subjects.find((s) => s.id === selectedSubject)
    return subject?.name || "Random"
  }

  const getDifficultyLabel = () => {
    switch (selectedDifficulty) {
      case "easy":
        return "Easy (1 gap)"
      case "medium":
        return "Medium (2 gaps)"
      case "hard":
        return "Hard (3 gaps)"
      default:
        return "Medium"
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 relative overflow-hidden">
      {/* Background floating words */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {["SCIENCE", "BRAIN", "PUZZLE", "WORD", "GAME", "LEARN", "FUN", "QUIZ"].map((word, i) => (
          <div
            key={i}
            className="absolute text-2xl sm:text-3xl md:text-4xl font-bold text-white animate-float"
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

      <div className="container relative z-10 mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-400 flex-shrink-0" />
              <span className="truncate">Ready to Play?</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-300 truncate">
              Welcome back, {player?.display_name || "Player"}!
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => router.push("/play/leaderboard")} 
              className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
            >
              <Trophy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:hidden md:inline">Leaderboard</span>
              <span className="xs:hidden sm:inline md:hidden">Scores</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="flex-1 sm:flex-none bg-transparent text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
            >
              <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:hidden md:inline">Logout</span>
              <span className="xs:hidden sm:inline md:hidden">Exit</span>
            </Button>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="bg-slate-800/90 backdrop-blur border-slate-700 shadow-2xl mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12 text-center">
            <div className="mb-4 sm:mb-6 md:mb-8">
              <div className="relative inline-block mb-3 sm:mb-4">
                <Brain className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 mx-auto text-emerald-400 animate-pulse" />
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-yellow-400 animate-bounce" />
                <Zap className="h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8 absolute -bottom-0.5 -left-0.5 sm:-bottom-1 sm:-left-1 text-yellow-300 animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
                Start Your Challenge!
              </h2>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {games.map((game) => (
                <Card
                  key={game.id}
                  className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent pointer-events-none rounded-lg" />
                  
                  <CardContent className="relative p-3 sm:p-4 md:p-5 flex flex-col h-full min-h-[180px] sm:min-h-[200px]">
                    <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-3xl sm:text-lg md:text-lg lg:text-xl font-semibold text-white mb-1 break-words line-clamp-2">
                          {game.title}
                        </h3>
                        {game.description && (
                          <p className="text-xs sm:text-sm text-gray-200 break-words line-clamp-2">
                            {game.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5  sm:py-1 rounded-full bg-gradient-to-r from-red-200 via-red-300 to-yellow-200 hover:bg-gradient-to-bl focus:ring-4 text-black focus:outline-none focus:ring-red-100 dark:focus:ring-red-400  uppercase tracking-wide font-semibold shadow-sm whitespace-nowrap flex-shrink-0">
                        {game.difficulty}
                      </span>
                    </div>

                    <div className="mt-auto space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-emerald-400/20">
                      <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-emerald-100/90">
                        {!game.start_time && !game.end_time ? (
                          <span className="flex items-center gap-1 truncate text-emerald-200 font-semibold">
                            Play anytime
                          </span>
                        ) : (
                          <>
                            <span className="flex items-center gap-1 truncate">
                              <span className="font-semibold text-emerald-200">Start:</span>
                              {game.start_time ? format(new Date(game.start_time), "MMM d, yyyy HH:mm") : "TBA"}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <span className="font-semibold text-emerald-200">End:</span>
                              {game.end_time ? format(new Date(game.end_time), "MMM d, yyyy HH:mm") : "TBA"}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <button 
                        className="w-full text-white bg-orange-300 font-medium rounded-lg text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 text-center leading-tight sm:leading-5 transition-all active:scale-95"
                        onClick={() => handlePlayGame(game.id)}
                      >
                        Play Now
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty state */}
            {games.length === 0 && (
              <div className="text-center py-8 sm:py-12 md:py-16">
                <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-4">
                  No active games available at the moment.
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                  Check back later for new challenges!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  )
}