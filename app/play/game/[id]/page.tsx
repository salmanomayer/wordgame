"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Timer, Hash, Trophy, Lightbulb, Play, Star } from "lucide-react"
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
  if (typeof window === "undefined") return
  const confettiConfig = type === "small" ? { particleCount: 100, spread: 70 } : { particleCount: 200, spread: 100 }

  confetti(confettiConfig)
}

function generatePuzzle(
  word: string,
  diff: "easy" | "medium" | "hard",
): { missingIndex: number[]; options: string[] } {
  const wordUpper = word.toUpperCase()
  // Ensure we don't try to create more gaps than non-space characters
  const nonSpaceCount = wordUpper.replace(/\s/g, '').length
  const gapCount = Math.min(diff === "easy" ? 1 : diff === "medium" ? 2 : 3, nonSpaceCount)

  console.log("[v0] Generating puzzle for:", wordUpper, "difficulty:", diff, "gaps:", gapCount)

  const indices: number[] = []
  let attempts = 0
  const maxAttempts = wordUpper.length * 5 // Safety limit

  while (indices.length < gapCount && attempts < maxAttempts) {
    attempts++
    const idx = Math.floor(Math.random() * wordUpper.length)
    // Only pick index if it's not a space and not already picked
    if (!indices.includes(idx) && wordUpper[idx] !== ' ') {
      indices.push(idx)
    }
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

  const options = [correctLetters, ...wrongOptions].map(opt => {
    if (diff === 'hard' && opt.length > 1) {
       return opt.split('').sort(() => Math.random() - 0.5).join('')
    }
    return opt
  }).sort(() => Math.random() - 0.5)

  console.log("[v0] Generated options:", options)

  return { missingIndex, options }
}

const normalizeStr = (str: string) => str.split('').sort().join('').toUpperCase()

export default function GamePage() {
  const params = useParams()
  const sessionId = params?.id as string

  const [words, setWords] = useState<GameWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [timer, setTimer] = useState(0)
  const gameNumber = (() => {
    if (!sessionId) return 0
    const str = Array.isArray(sessionId) ? sessionId[0] : sessionId
    if (!str) return 0
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 1000
    }
    return hash
  })()
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy")
  const [hasStarted, setHasStarted] = useState(false)
  const [gameId, setGameId] = useState<string | null>(null)
  const [nextStageId, setNextStageId] = useState<string | null>(null)
  const [nextStageTitle, setNextStageTitle] = useState<string | null>(null)
  const [currentStageTitle, setCurrentStageTitle] = useState<string | null>(null)
  
  // New State Variables
  const [gameTitle, setGameTitle] = useState<string | null>(null)
  const [stageNumber, setStageNumber] = useState<number | null>(null)
  const [totalStages, setTotalStages] = useState<number | null>(null)
  const [firstStageId, setFirstStageId] = useState<string | null>(null)
  const [pointsPerWord, setPointsPerWord] = useState(10)
  const [timePerWord, setTimePerWord] = useState<number | null>(null)
  const [wordTimeLeft, setWordTimeLeft] = useState<number | null>(null)
  const [attemptsLimit, setAttemptsLimit] = useState<number | null>(null)
  const [attemptsCount, setAttemptsCount] = useState<number>(0)
  
  const router = useRouter()
  const [selectedSubject, setSelectedSubject] = useState("")

  useEffect(() => {
    const initGame = async () => {
      try {
        console.log("[v0] Starting game initialization for session:", sessionId)

        if (!sessionId || sessionId === "undefined") {
          console.error("[v0] Invalid session ID:", sessionId)
          alert("Invalid game session. Please start a new game from the dashboard.")
          router.push("/play/dashboard")
          return
        }

        const meRes = await fetch("/api/auth/me")
        if (!meRes.ok) {
          alert("You must be logged in to play. Redirecting to login...")
          router.push("/play/login")
          return
        }

        const me = await meRes.json().catch(() => null)
        const player = me?.player
        if (!player) {
          router.push("/play/login")
          return
        }

        if (!player.is_active) {
          alert("Your account is not active. Please contact support.")
          router.push("/play/login")
          return
        }

        const sessionRes = await fetch(`/api/game/session/${encodeURIComponent(sessionId)}`)
        const sessionPayload = await sessionRes.json().catch(() => null)
        if (!sessionRes.ok) {
          alert((sessionPayload as any)?.error || "Game session not found. Please start a new game from the dashboard.")
          router.push("/play/dashboard")
          return
        }

        const gameSession = (sessionPayload as any)?.session ?? sessionPayload
        if (!gameSession) {
          router.push("/play/dashboard")
          return
        }

        console.log("[v0] Game session found and verified:", gameSession)
        setGameSessionId(gameSession.id)
        setSelectedSubject(gameSession.subject_id)
        setDifficulty(gameSession.difficulty)
        setGameId(gameSession.game_id)

        if (gameSession.game_id) {
            console.log("[v0] Fetching progress for game:", gameSession.game_id)
            const progressRes = await fetch(`/api/player/game/${gameSession.game_id}/progress`)
            const progress = await progressRes.json().catch(() => null)
            console.log("[v0] Progress response:", progress)

            if (progress) {
                // Fetch Game Title
                if (progress.game) {
                    console.log("[v0] Setting game title:", progress.game.title)
                    setGameTitle(progress.game.title)
                    if (progress.game.correct_marks) {
                        setPointsPerWord(progress.game.correct_marks)
                    }
                    
                    // Only enable countdown timer if there is an attempts limit AND a time limit
                    // Actually, if time_per_word is set, it SHOULD count down for that word regardless of attempts limit
                    // The "attempts limit" logic was likely about "Game Over on timeout", but user says "count down use by given second set in the bd"
                    // If time_per_word is set, we should use it.
                    // The previous instruction was: "if the game do not have any attemp limit if the player play game then try again or play agian it do not use countdown."
                    // This implies: Unlimited attempts -> No countdown. Limited attempts -> Countdown.
                    // But now user says: "time per word second setted to 10, but in the play no count down."
                    // Checking the screenshot, "Attempts per Player" is blank (unlimited).
                    // So my previous logic disabled it because attempts_limit was null.
                    
                    // User Intent Clarification:
                    // "time per word second setted to 10, but in the play no count down."
                    // This implies they WANT the countdown even if attempts are unlimited?
                    // OR they think it's broken.
                    // Let's re-read the previous instruction:
                    // "if the game do not have any attemp limit... it do not use countdown."
                    // "but if the player play random game then no setted time. contdown only for how much time taken to answer."
                    
                    // Maybe "Attempts per Player" being blank means "Unlimited attempts to PLAY THE GAME", not "Unlimited lives inside the game"?
                    // In `app/admin/games/page.tsx` (inferred), "Attempts per Player" usually means how many times they can play the whole session.
                    
                    // If the user explicitly sets "Time per Word" in the Admin UI (as seen in screenshot 1), they expect that time limit to apply to each word.
                    // The confusion might be around "Attempts Limit" vs "Time Limit".
                    // If I set a time limit, I expect a countdown.
                    // The previous request said: "if the game do not have any attemp limit ... it do not use countdown."
                    
                    // Let's assume the user wants the countdown IF `time_per_word` is set > 0.
                    // The previous logic `if (progress.game.time_per_word && progress.game.attempts_limit)` is preventing it because attempts_limit is null.
                    
                    // Revised Logic:
                    // If `time_per_word` is set, use it.
                    // The previous request might have been misunderstood or phrasing was tricky.
                    // "if the player play random game then no setted time" -> Random game has no `time_per_word` in DB usually (or we don't fetch it).
                    // Challenge game HAS `time_per_word` in DB.
                    
                    if (progress.game.time_per_word) {
                        setTimePerWord(progress.game.time_per_word)
                        setWordTimeLeft(progress.game.time_per_word)
                    }
                    
                    if (progress.game.attempts_limit) {
                        setAttemptsLimit(progress.game.attempts_limit)
                    }
                }
                
                if (progress.attempts_count !== undefined) {
                    setAttemptsCount(progress.attempts_count)
                }

                // Fetch Stage Info
                if (progress.stages) {
                    if (progress.stages.length > 0) {
                        setFirstStageId(progress.stages[0].id)
                    }

                    if (gameSession.stage_id) {
                        const currentStageIndex = progress.stages.findIndex((s: any) => s.id === gameSession.stage_id)
                        if (currentStageIndex !== -1) {
                            const currentStage = progress.stages[currentStageIndex]
                            setCurrentStageTitle(currentStage.title)
                            setStageNumber(currentStageIndex + 1)
                        }
                    }
                    setTotalStages(progress.stages.length)
                }
            }
        }

        const wordsParams = new URLSearchParams({ subject_id: String(gameSession.subject_id) })
        const wordsRes = await fetch(`/api/words?${wordsParams.toString()}`)
        const allWords = (await wordsRes.json().catch(() => [])) as Word[]

        console.log("[v0] Fetched words:", Array.isArray(allWords) ? allWords.length : 0)

        if (!Array.isArray(allWords) || allWords.length < 5) {
          alert("Not enough words in this category")
          router.push("/play/dashboard")
          return
        }

        const shuffled = allWords.slice().sort(() => Math.random() - 0.5)
        const countToTake = gameSession.total_words || 5
        const selectedWords = shuffled.slice(0, countToTake)

        const gameWords = selectedWords.map((w) => ({
          ...w,
          ...generatePuzzle(w.word, gameSession.difficulty),
        }))
        setWords(gameWords)

        console.log("[v0] Game initialized successfully with", gameWords.length, "words (Target:", countToTake, ")")
      } catch (error) {
        console.error("[v0] Unexpected error during game init:", error)
        alert("An error occurred. Please try again.")
        router.push("/play/dashboard")
      }
    }

    initGame()
  }, [sessionId, router])

  useEffect(() => {
    if (hasStarted && !isComplete && words.length > 0) {
      const interval = setInterval(() => setTimer((t) => t + 1), 1000)
      return () => clearInterval(interval)
    }
  }, [hasStarted, isComplete, words])

  // Countdown Timer Effect
  useEffect(() => {
    if (hasStarted && !isComplete && !feedback && timePerWord !== null && wordTimeLeft !== null) {
        if (wordTimeLeft > 0) {
             const timerId = setTimeout(() => setWordTimeLeft(t => t !== null ? t - 1 : null), 1000)
             return () => clearTimeout(timerId)
        } else {
             handleAnswer(null) // Trigger timeout
        }
    }
  }, [wordTimeLeft, hasStarted, isComplete, feedback, timePerWord])

  const handleAnswer = async (selectedOption: string | null) => {
    if (feedback) return

    const currentWord = words[currentIndex]
    // Calculate time taken for this specific word
    // If timePerWord is set, it's (timePerWord - wordTimeLeft)
    // If selectedOption is null, it means timeout, so time taken is timePerWord
    let timeTakenForWord = 0
    if (timePerWord !== null && wordTimeLeft !== null) {
        timeTakenForWord = timePerWord - wordTimeLeft
    }
    
    // Logic for Timeout (null selectedOption)
    if (selectedOption === null) {
        setFeedback("wrong") // Or specific "timeout" feedback
        timeTakenForWord = timePerWord || 0
    }

    let isCorrect = false
    if (selectedOption) {
        const correctLetters = currentWord.missingIndex
        .map((idx) => currentWord.word[idx])
        .join("")
        .toUpperCase()
        isCorrect = normalizeStr(selectedOption) === normalizeStr(correctLetters)
    
        if (isCorrect) {
          const newScore = score + pointsPerWord
          setScore(newScore)
          setFeedback("correct")
          triggerFireworks("small")
        } else {
          setFeedback("wrong")
        }
    } else {
        // Timeout case
        setFeedback("wrong") 
    }

    if (gameSessionId) {
      try {
        await fetch("/api/game/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: gameSessionId,
            word_id: currentWord.id,
            is_correct: isCorrect,
            time_taken: timeTakenForWord, // Send individual word time
          }),
        })
      } catch (error) {
        console.error("[v0] Failed to save answer:", error)
      }
    }

    setTimeout(
      () => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setFeedback(null)
          setShowHint(false)
          if (timePerWord !== null) {
              setWordTimeLeft(timePerWord)
          }
        } else {
          completeGame(isCorrect ? score + pointsPerWord : score)
        }
      },
      isCorrect ? 1500 : 1000,
    )
  }

  const completeGame = async (finalScore: number) => {
    const maxScore = words.length * pointsPerWord
    
    if (gameSessionId) {
      try {
        await fetch("/api/game/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: gameSessionId,
            score: finalScore,
            words_completed: words.length,
          }),
        })

        if (gameId) {
           const progressRes = await fetch(`/api/player/game/${gameId}/progress`)
           const progress = await progressRes.json().catch(() => null)
           if (progress && progress.next_stage_id) {
               setNextStageId(progress.next_stage_id)
               if (progress.stages) {
                   const nextStage = progress.stages.find((s: any) => s.id === progress.next_stage_id)
                   setNextStageTitle(nextStage?.title || "Next Stage")
               }
               setIsComplete(true)
               triggerFireworks("small")
           } else {
               // Game Fully Complete
               setIsComplete(true)
               triggerFireworks("large")
               if (finalScore === maxScore) {
                 const interval = setInterval(() => triggerFireworks("small"), 1000)
                 setTimeout(() => clearInterval(interval), 5000)
               }
           }
        } else {
           setIsComplete(true)
           triggerFireworks("large")
           if (finalScore === maxScore) {
             const interval = setInterval(() => triggerFireworks("small"), 1000)
             setTimeout(() => clearInterval(interval), 5000)
           }
        }

      } catch (error) {
        console.error("[v0] Failed to complete game:", error)
        setIsComplete(true) // Fallback
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
  
  if (!hasStarted && words.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 p-4 sm:p-6">
        <Card className="relative w-full max-w-lg bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-emerald-500/30 text-white shadow-2xl shadow-emerald-500/10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
          <CardHeader className="text-center pt-8 pb-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-2xl scale-150 animate-pulse" />
                <div className="relative bg-gradient-to-b from-emerald-300 to-emerald-500 rounded-full p-4 shadow-lg shadow-emerald-500/50">
                   <Play className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-900 ml-2" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent mb-2">
              {gameTitle || currentStageTitle || "Ready to Play?"}
            </CardTitle>
            <p className="text-slate-400 text-sm sm:text-base">
                {stageNumber && totalStages 
                  ? `Stage ${stageNumber} of ${totalStages}${currentStageTitle && gameTitle ? `: ${currentStageTitle}` : ''}` 
                  : `Game #${gameNumber}`}
            </p>
          </CardHeader>
           <CardContent className="text-center space-y-6 px-6 pb-8">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xl font-bold text-emerald-400 capitalize">{difficulty}</div>
                    <p className="text-slate-400 text-xs mt-1">Difficulty</p>
                </div>
                <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xl font-bold text-cyan-400">{words.length}</div>
                    <p className="text-slate-400 text-xs mt-1">Words</p>
                </div>
             </div>

             {/* Points Per Word Display */}
             <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50 flex justify-between items-center">
                 <span className="text-slate-400 text-sm">Points per Word</span>
                 <div className="flex items-center gap-2">
                     <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                     <span className="text-xl font-bold text-yellow-400">{pointsPerWord}</span>
                 </div>
             </div>
             
             <Button
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => setHasStarted(true)}
              >
                Start Game
              </Button>
               <Button
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
                onClick={() => router.push("/play/dashboard")}
              >
                Cancel
              </Button>
           </CardContent>
        </Card>
      </div>
    )
  }

  if (isComplete) {
    const maxScore = words.length * pointsPerWord
    const allCorrect = score === maxScore
    const praiseMessages = [
      "Outstanding Performance!",
      "You're a Word Master!",
      "Brilliant Work!",
      "Exceptional Skills!",
      "Phenomenal Achievement!",
    ]
    const randomPraise = praiseMessages[gameNumber % praiseMessages.length]

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
    }

    const accuracy = Math.round((score / maxScore) * 100) || 0

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 p-4 sm:p-6 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <Card className="relative w-full max-w-lg bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-emerald-500/30 text-white shadow-2xl shadow-emerald-500/10 overflow-hidden">
          {/* Decorative top border gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          <CardHeader className="text-center pt-8 pb-4">
            {/* Trophy with enhanced glow effect */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-2xl scale-150 animate-pulse" />
                <div className="relative bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full p-4 shadow-lg shadow-yellow-500/50">
                  <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-900" />
                </div>
                {allCorrect && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full px-2 py-1 text-xs font-bold animate-bounce">
                    PERFECT!
                  </div>
                )}
              </div>
            </div>

            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent mb-2">
              {currentStageTitle || (nextStageId ? "Stage Complete!" : randomPraise)}
            </CardTitle>
            <p className="text-slate-400 text-sm sm:text-base">
              {nextStageId 
                ? "Great job! Ready for the next challenge?" 
                : "Game Complete! You've mastered this challenge."}
            </p>
          </CardHeader>

          <CardContent className="text-center space-y-6 px-6 pb-8">
            {/* Main Score Card */}
            <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 rounded-2xl p-6 shadow-lg shadow-emerald-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC00djJoNHYtMnptMC02djRoLTR2LTJoMnYtMmgyem0tNi02di0yaDR2LTJoLTR2MmgtMnYyaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative">
                <div className="text-6xl sm:text-7xl font-black text-white mb-1 drop-shadow-lg">{score}</div>
                <p className="text-emerald-100 font-medium text-sm sm:text-base uppercase tracking-wider">
                  Total Points
                </p>
              </div>
            </div>

            {/* Stats Grid - 3 columns with time taken */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50 hover:border-emerald-500/50 transition-colors">
                <div className="text-xl sm:text-2xl font-bold text-emerald-400">{Math.floor(score / pointsPerWord)}/{words.length}</div>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">Correct</p>
              </div>
              <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50 hover:border-teal-500/50 transition-colors">
                <div className="text-xl sm:text-2xl font-bold text-teal-400 capitalize">{difficulty}</div>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">Difficulty</p>
              </div>
              <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-colors">
                <div className="text-xl sm:text-2xl font-bold text-cyan-400">{formatTime(timer)}</div>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">Time</p>
              </div>
            </div>

            {/* Accuracy Bar */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">Accuracy</span>
                <span className="text-emerald-400 font-bold">{accuracy}%</span>
              </div>
              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            {allCorrect && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 rounded-xl p-4 backdrop-blur">
                <p className="text-yellow-300 font-bold text-lg">Perfect Score!</p>
                <p className="text-yellow-200/80 text-sm">You got every word right!</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/50"
                disabled={!nextStageId && attemptsLimit !== null && attemptsCount >= attemptsLimit}
                onClick={async () => {
                  try {
                    if (nextStageId) {
                        const res = await fetch("/api/game/start", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ 
                             game_id: gameId, 
                             stage_id: nextStageId,
                             is_demo: false 
                          }),
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          alert(data?.error || "Failed to start next stage.")
                          return
                        }
                        if (data?.session_id) {
                          window.location.href = `/play/game/${data.session_id}`
                        }
                        return
                    }

                    // Case: Restart Game (Play Again / Try Again)
                    // If firstStageId exists (multi-stage game), start from stage 1
                    // Else (single stage game), just restart the game
                    if (firstStageId) {
                         const res = await fetch("/api/game/start", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ 
                             game_id: gameId, 
                             stage_id: firstStageId,
                             is_demo: false 
                          }),
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          alert(data?.error || "Failed to restart game.")
                          return
                        }
                        if (data?.session_id) {
                          window.location.href = `/play/game/${data.session_id}`
                        }
                        return
                    }

                    // Fallback to old behavior if no stages (though gameId check above should cover most)
                    if (!selectedSubject) {
                      console.error("[v0] Missing selectedSubject")
                      alert("Unable to start new game. Please try again.")
                      return
                    }

                    const res = await fetch("/api/game/start", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ subject_id: selectedSubject, difficulty, is_demo: false }),
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) {
                      alert(data?.error || "Failed to start new game. Please try again.")
                      return
                    }

                    if (data?.session_id) {
                      window.location.href = `/play/game/${data.session_id}`
                    } else {
                      alert("Failed to start new game. Please try again.")
                    }
                  } catch (error) {
                    console.error("[v0] Error in Play Again:", error)
                    alert("An error occurred. Please try again.")
                  }
                }}
              >
                <Play className="mr-2 h-5 w-5" />
                {nextStageId 
                    ? (nextStageTitle ? `Start ${nextStageTitle}` : "Start Next Stage") 
                    : (attemptsLimit !== null && attemptsCount >= attemptsLimit 
                        ? "Attempts Limit Reached" 
                        : (attemptsLimit !== null ? "Try Again" : "Play Again"))}
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

  // Group letters into words based on spaces
  const renderWord = () => {
    // We need to reconstruct the display respecting word boundaries
    // The original word might have spaces.
    // currentWord.word is the full string (e.g. "HELLO WORLD")
    // wordDisplay is the array of characters with gaps (e.g. ['H', 'E', '_', 'L', 'O', ' ', 'W', 'O', 'R', 'L', 'D'])
    
    // Split the original word by space to know the lengths of each part
    const wordParts = currentWord.word.split(' ');
    let globalIdx = 0;

    return (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {wordParts.map((part, partIndex) => {
                const partLength = part.length;
                const partDisplay = wordDisplay.slice(globalIdx, globalIdx + partLength);
                // Advance globalIdx by length + 1 (for space)
                globalIdx += partLength + 1; 

                return (
                    <div key={partIndex} className="flex gap-1 sm:gap-2">
                        {partDisplay.map((char, charIdx) => {
                             // The index in the original word string corresponding to this character
                             // We need this to check if it's a gap
                             // Actually, `char` is already "_" if it's a gap.
                             
                             return (
                                <span
                                    key={charIdx}
                                    className={`
                                        text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider
                                        ${char === "_" ? "text-cyan-400 underline underline-offset-8" : "text-white"}
                                    `}
                                >
                                    {char}
                                </span>
                             )
                        })}
                    </div>
                )
            })}
        </div>
    )
  }

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
           <div className="px-3 sm:px-4 py-2 bg-blue-800/50 backdrop-blur-sm border border-blue-700 rounded-lg flex items-center gap-2">
            <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200" />
            <span className="text-white font-mono text-xs sm:text-sm">{gameTitle || `#${gameNumber}`}</span>
          </div>
          {(stageNumber && totalStages) && (
              <div className="px-3 sm:px-4 py-2 bg-purple-800/50 backdrop-blur-sm border border-purple-700 rounded-lg flex items-center gap-2">
                <span className="text-white font-mono text-xs sm:text-sm">Stage {stageNumber}/{totalStages}</span>
              </div>
          )}
          <div className="px-3 sm:px-4 py-2 bg-emerald-800/50 backdrop-blur-sm border border-emerald-700 rounded-lg flex items-center gap-2">
            <span className="text-xs text-emerald-200 uppercase font-semibold">{difficulty}</span>
          </div>
          {wordTimeLeft !== null && (
              <div className={`px-3 sm:px-4 py-2 backdrop-blur-sm border rounded-lg flex items-center gap-2 ${wordTimeLeft <= 3 ? 'bg-red-800/50 border-red-700 animate-pulse' : 'bg-teal-800/50 border-teal-700'}`}>
                <Timer className={`w-3 h-3 sm:w-4 sm:h-4 ${wordTimeLeft <= 3 ? 'text-red-200' : 'text-teal-200'}`} />
                <span className="text-white font-mono text-xs sm:text-sm">
                  0:{wordTimeLeft.toString().padStart(2, "0")}
                </span>
              </div>
          )}
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
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  wordTimeLeft !== null && wordTimeLeft <= 3 
                    ? "bg-red-600 animate-pulse shadow-lg shadow-red-500/50" 
                    : "bg-gradient-to-br from-emerald-600 to-teal-600"
              }`}>
                {wordTimeLeft !== null ? (
                    <span className="text-xl sm:text-2xl font-bold text-white">{wordTimeLeft}</span>
                ) : (
                    <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                )}
              </div>
            </div>

            {/* Word Display */}
            <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-sm border border-emerald-700 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
              {renderWord()}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {currentWord.options.map((option) => {
                const correctLetters = currentWord.missingIndex
                  .map((idx) => currentWord.word[idx])
                  .join("")
                  .toUpperCase()
                const isCorrectOption = normalizeStr(option) === normalizeStr(correctLetters)

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={!!feedback}
                    className={`p-5 sm:p-6 rounded-xl text-3xl sm:text-4xl font-bold transition-all border-2 min-h-[60px] sm:min-h-[80px] ${
                      feedback === "correct" && isCorrectOption
                        ? "bg-green-500/20 border-green-500 text-green-400"
                        : feedback === "wrong" && !isCorrectOption
                          ? "bg-red-500/20 border-red-500 text-red-400 opacity-50"
                          : "bg-emerald-800/50 border-emerald-700 text-white hover:bg-emerald-700/50 hover:border-emerald-600 active:scale-95"
                    } ${feedback ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {option.split('').join(', ')}
                  </button>
                )
              })}
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
