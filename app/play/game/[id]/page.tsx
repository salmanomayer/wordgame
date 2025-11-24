"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Timer, Hash, Trophy, Lightbulb, Play } from "lucide-react"
import confetti from "canvas-confetti"

interface Word {
  id: string
  word: string
  hint: string
}

interface GameWord extends Word {
  missingIndex: number[]
  options: string[]
}

const triggerFireworks = (type: "small" | "large") => {
  const confettiConfig = type === "small" ? { particleCount: 100, spread: 70 } : { particleCount: 200, spread: 100 }

  confetti(confettiConfig)
}

export default function GamePage({ params }: { params: { id: string } }) {
  const [words, setWords] = useState<GameWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [timer, setTimer] = useState(0)
  const [gameNumber] = useState(Math.floor(Math.random() * 1000))
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSubject, setSelectedSubject] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const initGame = async () => {
      try {
        const supabase = createClient()
        console.log("[v0] Starting game initialization")

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error("[v0] Auth error:", authError)
          router.push("/play/login")
          return
        }

        console.log("[v0] User authenticated, fetching game session")
        setUserId(user.id)

        const { data: gameSession, error: sessionError } = await supabase
          .from("game_sessions")
          .select("*, subjects(name)")
          .eq("id", params.id)
          .single()

        if (sessionError || !gameSession) {
          console.error("[v0] Error fetching game session:", sessionError)
          alert("Game session not found")
          router.push("/play/dashboard")
          return
        }

        console.log("[v0] Game session found:", gameSession)
        setGameSessionId(gameSession.id)
        setSelectedSubject(gameSession.subject_id)
        setDifficulty(gameSession.difficulty)

        const { data: allWords, error: wordsError } = await supabase
          .from("words")
          .select("*")
          .eq("subject_id", gameSession.subject_id)
          .eq("is_active", true)

        if (wordsError) {
          console.error("[v0] Error fetching words:", wordsError)
          alert("Failed to load words. Please try again.")
          router.push("/play/dashboard")
          return
        }

        console.log("[v0] Fetched words:", allWords?.length || 0)

        if (!allWords || allWords.length < 5) {
          alert("Not enough words in this category")
          router.push("/play/dashboard")
          return
        }

        const shuffled = allWords.sort(() => Math.random() - 0.5)
        const selectedWords = shuffled.slice(0, 5)

        const gameWords = selectedWords.map((w) => ({
          ...w,
          ...generatePuzzle(w.word, gameSession.difficulty),
        }))
        setWords(gameWords)

        await supabase.from("game_sessions").update({ total_words: 5 }).eq("id", gameSession.id)

        console.log("[v0] Game initialized successfully with", gameWords.length, "words")
      } catch (error) {
        console.error("[v0] Unexpected error during game init:", error)
        alert("An error occurred. Please try again.")
        router.push("/play/dashboard")
      }
    }

    initGame()
  }, [params.id, router])

  useEffect(() => {
    if (!isComplete && words.length > 0) {
      const interval = setInterval(() => setTimer((t) => t + 1), 1000)
      return () => clearInterval(interval)
    }
  }, [isComplete, words])

  const generatePuzzle = (
    word: string,
    diff: "easy" | "medium" | "hard",
  ): { missingIndex: number[]; options: string[] } => {
    const wordUpper = word.toUpperCase()
    const gapCount = diff === "easy" ? 1 : diff === "medium" ? 2 : 3

    console.log("[v0] Generating puzzle for:", wordUpper, "difficulty:", diff, "gaps:", gapCount)

    const indices: number[] = []
    while (indices.length < Math.min(gapCount, wordUpper.length)) {
      const idx = Math.floor(Math.random() * wordUpper.length)
      if (!indices.includes(idx)) indices.push(idx)
    }

    const missingIndex = indices.sort((a, b) => a - b)
    const correctLetters = missingIndex.map((i) => wordUpper[i]).join("")

    console.log("[v0] Missing indices:", missingIndex, "Correct letters:", correctLetters)

    const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const wrongOptions: string[] = []

    while (wrongOptions.length < 3) {
      let wrongOption = ""
      for (let i = 0; i < gapCount; i++) {
        const randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)]
        wrongOption += randomLetter
      }
      if (wrongOption !== correctLetters && !wrongOptions.includes(wrongOption)) {
        wrongOptions.push(wrongOption)
      }
    }

    const options = [correctLetters, ...wrongOptions].sort(() => Math.random() - 0.5)

    console.log("[v0] Generated options:", options)

    return { missingIndex, options }
  }

  const handleAnswer = async (selectedOption: string) => {
    if (feedback) return

    const currentWord = words[currentIndex]
    const correctLetters = currentWord.missingIndex
      .map((idx) => currentWord.word[idx])
      .join("")
      .toUpperCase()
    const isCorrect = selectedOption.toUpperCase() === correctLetters

    if (isCorrect) {
      const newScore = score + 10
      setScore(newScore)
      setFeedback("correct")
      triggerFireworks("small")
    } else {
      setFeedback("wrong")
    }

    if (gameSessionId) {
      try {
        const supabase = createClient()
        await supabase.from("game_answers").insert({
          game_session_id: gameSessionId,
          word_id: currentWord.id,
          is_correct: isCorrect,
          time_taken: timer,
        })
      } catch (error) {
        console.error("[v0] Failed to save answer:", error)
      }
    }

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setFeedback(null)
        setShowHint(false)
      } else {
        completeGame(isCorrect ? score + 10 : score)
      }
    }, 1500)
  }

  const completeGame = async (finalScore: number) => {
    setIsComplete(true)

    if (finalScore === 50) {
      triggerFireworks("large")
      const interval = setInterval(() => triggerFireworks("small"), 1000)
      setTimeout(() => clearInterval(interval), 5000)
    }

    if (gameSessionId) {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        await supabase
          .from("game_sessions")
          .update({
            score: finalScore,
            words_completed: words.length,
            completed_at: new Date().toISOString(),
          })
          .eq("id", gameSessionId)

        if (user) {
          const { data: player, error: playerError } = await supabase
            .from("players")
            .select("total_score, games_played")
            .eq("id", user.id)
            .single()

          if (playerError) {
            console.error("[v0] Failed to fetch player data:", playerError)
          } else if (player) {
            await supabase
              .from("players")
              .update({
                total_score: player.total_score + finalScore,
                games_played: player.games_played + 1,
              })
              .eq("id", user.id)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to complete game:", error)
      }
    }
  }

  if (words.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950">
        <div className="text-lg text-white">Loading game...</div>
      </div>
    )
  }

  if (isComplete) {
    const allCorrect = score === 50
    const praiseMessages = [
      "Outstanding Performance!",
      "You're a Word Master!",
      "Brilliant Work!",
      "Exceptional Skills!",
      "Phenomenal Achievement!",
    ]
    const randomPraise = praiseMessages[Math.floor(Math.random() * praiseMessages.length)]

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-950 to-blue-950 p-6">
        <Card className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border-emerald-700 text-white">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Trophy className="w-24 h-24 text-yellow-400 animate-bounce" />
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-3xl text-emerald-400 mb-2">{randomPraise}</CardTitle>
            <p className="text-slate-300">Game Complete!</p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6">
              <div className="text-5xl font-bold text-white mb-2">{score}</div>
              <p className="text-white/80">Total Points</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{Math.floor(score / 10)}/5</div>
                <p className="text-slate-400 text-sm">Correct Answers</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{difficulty}</div>
                <p className="text-slate-400 text-sm">Difficulty</p>
              </div>
            </div>

            {allCorrect && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 font-semibold">🎉 Perfect Score! 🎉</p>
                <p className="text-yellow-200 text-sm">You got every word right!</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-6 text-lg"
                onClick={async () => {
                  try {
                    const supabase = createClient()

                    if (!userId || !selectedSubject) {
                      console.error("[v0] Missing userId or selectedSubject")
                      alert("Unable to start new game. Please try again.")
                      return
                    }

                    console.log("[v0] Creating new random game session", { userId, selectedSubject, difficulty })

                    const { data: session, error: sessionError } = await supabase
                      .from("game_sessions")
                      .insert({
                        player_id: userId,
                        subject_id: selectedSubject,
                        difficulty: difficulty,
                        score: 0,
                        words_completed: 0,
                        total_words: 5,
                        is_demo: false,
                      })
                      .select()
                      .single()

                    if (sessionError) {
                      console.error("[v0] Failed to create game session:", sessionError)
                      alert("Failed to start new game. Please try again.")
                      return
                    }

                    if (session) {
                      console.log("[v0] New game session created, redirecting to:", session.id)
                      // Use window.location.href to force a full page reload
                      window.location.href = `/play/game/${session.id}`
                    }
                  } catch (error) {
                    console.error("[v0] Error in Play Again:", error)
                    alert("An error occurred. Please try again.")
                  }
                }}
              >
                <Play className="mr-2 h-5 w-5" />
                Play Again
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent border-2 border-emerald-500 text-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 py-6 text-lg font-semibold"
                onClick={() => router.push("/play/dashboard")}
              >
                Back to Play Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100
  const wordDisplay = currentWord.word
    .split("")
    .map((letter, idx) => (currentWord.missingIndex.includes(idx) ? "_" : letter))

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 p-4 sm:p-6">
      <div className="container mx-auto max-w-4xl py-6 sm:py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => router.push("/play/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Header Stats */}
        <div className="flex gap-2 sm:gap-3 mb-6 flex-wrap">
          <div className="px-3 sm:px-4 py-2 bg-emerald-800/50 backdrop-blur-sm border border-emerald-700 rounded-lg flex items-center gap-2">
            <span className="text-xs text-emerald-200 uppercase font-semibold">{difficulty}</span>
          </div>
          <div className="px-3 sm:px-4 py-2 bg-teal-800/50 backdrop-blur-sm border border-teal-700 rounded-lg flex items-center gap-2">
            <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-teal-200" />
            <span className="text-white font-mono text-xs sm:text-sm">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div className="px-3 sm:px-4 py-2 bg-blue-800/50 backdrop-blur-sm border border-blue-700 rounded-lg flex items-center gap-2">
            <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200" />
            <span className="text-white font-mono text-xs sm:text-sm">#{gameNumber}</span>
          </div>
          <div className="px-3 sm:px-4 py-2 bg-yellow-800/50 backdrop-blur-sm border border-yellow-700 rounded-lg flex items-center gap-2">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-white font-mono text-xs sm:text-sm">{score} pts</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-semibold text-sm sm:text-base">Progress</span>
            <span className="text-white font-mono text-sm sm:text-base">
              {currentIndex + 1} / {words.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-800" />
        </div>

        {/* Main Game Card */}
        <Card className="bg-slate-900/90 backdrop-blur-md border-emerald-700">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Timer Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>

            {/* Word Display */}
            <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-sm border border-emerald-700 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
              <div className="flex justify-center gap-1 sm:gap-2 text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-wider">
                {wordDisplay.map((char, idx) => (
                  <span
                    key={idx}
                    className={
                      currentWord.missingIndex.includes(idx) ? "text-cyan-400 underline underline-offset-8" : ""
                    }
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {currentWord.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={!!feedback}
                  className={`p-5 sm:p-6 rounded-xl text-3xl sm:text-4xl font-bold transition-all border-2 min-h-[60px] sm:min-h-[80px] ${
                    feedback === "correct" &&
                    option.toUpperCase() ===
                      currentWord.missingIndex
                        .map((idx) => currentWord.word[idx])
                        .join("")
                        .toUpperCase()
                      ? "bg-green-500/20 border-green-500 text-green-400"
                      : feedback === "wrong" &&
                          option.toUpperCase() ===
                            currentWord.missingIndex
                              .map((idx) => currentWord.word[idx])
                              .join("")
                              .toUpperCase()
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : "bg-emerald-800/50 border-emerald-700 text-white hover:bg-emerald-700/50 hover:border-emerald-600 active:scale-95"
                  } ${feedback ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {option}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              className="w-full text-teal-300 hover:text-white hover:bg-emerald-800/50"
              onClick={() => setShowHint(!showHint)}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              {showHint ? currentWord.hint : "Show Hint"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
