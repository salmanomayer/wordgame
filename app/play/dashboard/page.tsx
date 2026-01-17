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

interface Subject {
  id: string
  name: string
  description: string
}

export default function DashboardPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [user, setUser] = useState<any>(null)
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
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handlePlayNow = async () => {
    router.push("/play/random")
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {["SCIENCE", "BRAIN", "PUZZLE", "WORD", "GAME", "LEARN", "FUN", "QUIZ"].map((word, i) => (
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

      <div className="container relative z-10 mx-auto p-4 sm:p-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
              Ready to Play?
            </h1>
            <p className="text-sm sm:text-base text-gray-300">Welcome back, {player?.display_name || "Player"}!</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
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

        <Card className="bg-slate-800/90 backdrop-blur border-slate-700 shadow-2xl mb-6">
          <CardContent className="p-6 sm:p-8 md:p-12 text-center">
            <div className="mb-6 sm:mb-8">
              <div className="relative inline-block mb-4">
                <Brain className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mx-auto text-emerald-400 animate-pulse" />
                <Zap className="h-8 w-8 sm:h-10 sm:w-10 absolute -top-2 -right-2 text-yellow-400 animate-bounce" />
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 absolute -bottom-1 -left-1 text-yellow-300 animate-pulse" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Start Your Challenge!
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-2">
                Subject: <span className="text-emerald-400 font-semibold">{getSelectedSubjectName()}</span>
              </p>
              <p className="text-sm sm:text-base text-gray-400">Difficulty: {getDifficultyLabel()}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Button
                size="lg"
                onClick={handlePlayNow}
                disabled={!selectedSubject}
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-bold py-4 sm:py-6 md:py-8 text-lg sm:text-xl md:text-2xl h-auto shadow-lg hover:shadow-xl transition-all"
              >
                <Play className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                Play Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/play/challenge")}
                className="py-4 sm:py-6 md:py-8 h-auto bg-transparent"
              >
                <Play className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                Challenge Game
              </Button>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="py-4 sm:py-6 md:py-8 h-auto bg-transparent">
                    <Settings className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-base sm:text-lg">Change Mode</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl">Customize Your Game</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Choose your subject and difficulty level
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Subject Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Subject</Label>
                      <RadioGroup value={selectedSubject} onValueChange={setSelectedSubject}>
                        {subjects.map((subject) => (
                          <div key={subject.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={subject.id} id={subject.id} />
                            <Label htmlFor={subject.id} className="cursor-pointer">
                              {subject.name}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Difficulty Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Difficulty</Label>
                      <RadioGroup value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="easy" id="easy" />
                          <Label htmlFor="easy" className="cursor-pointer">
                            Easy (1 missing letter)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium" className="cursor-pointer">
                            Medium (2 missing letters)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hard" id="hard" />
                          <Label htmlFor="hard" className="cursor-pointer">
                            Hard (3 missing letters)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <Button onClick={() => setShowSettings(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Apply Settings
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-slate-800/90 backdrop-blur border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Game Mode</p>
              <p className="text-base sm:text-lg font-bold text-white">Random Play</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/90 backdrop-blur border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Words per Game</p>
              <p className="text-base sm:text-lg font-bold text-emerald-400">5 Words</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/90 backdrop-blur border-slate-700 col-span-2 sm:col-span-1">
            <CardContent className="p-4 text-center">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Your Status</p>
              <p className="text-base sm:text-lg font-bold text-green-400">Ready!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
