"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Lightbulb, Timer, Trophy } from "lucide-react"
import confetti from "canvas-confetti"

interface Word {
  id: string
  word: string
  hint: string
  missing_position?: number
  correct_letter?: string
  wrong_options?: string[]
}

interface WordPuzzleProps {
  words: Word[]
  difficulty: string
  onComplete: (score: number) => void
  showTimer?: boolean
  gameNumber?: number
  marksPerWord?: number
  timePerWord?: number
}

function fnv1a32(input: string) {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWithRng<T>(items: T[], rng: () => number) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function WordPuzzle({ 
  words, 
  difficulty, 
  onComplete, 
  showTimer = false, 
  gameNumber,
  marksPerWord = 10,
  timePerWord = 30
}: WordPuzzleProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timePerWord)
  const [timerActive, setTimerActive] = useState(showTimer)
  const [currentGapIndex, setCurrentGapIndex] = useState(0)

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  const puzzleData = useMemo(() => {
    if (!currentWord) return null

    if (
      typeof currentWord.missing_position === "number" &&
      currentWord.correct_letter &&
      Array.isArray(currentWord.wrong_options) &&
      currentWord.wrong_options.length > 0
    ) {
      const correctLetter = currentWord.correct_letter
      const wrongOptions = currentWord.wrong_options
      return {
        missingPositions: [currentWord.missing_position],
        correctLetters: [correctLetter],
        options: shuffleWithRng([...wrongOptions, correctLetter], mulberry32(fnv1a32(`${currentWord.id}|${currentIndex}`))),
      }
    }

    const rng = mulberry32(fnv1a32(`${currentWord.id}|${gameNumber ?? ""}|${currentIndex}`))
    const wordText = currentWord.word
    const diff = (difficulty || "medium").toLowerCase()
    const targetGaps = diff === "easy" ? 1 : diff === "hard" ? 3 : 2
    const positions: number[] = []
    while (positions.length < targetGaps && wordText.length > 0) {
      const pos = Math.floor(rng() * wordText.length)
      if (!positions.includes(pos)) {
        if (diff === "medium") {
          const adjacent = positions.some((p) => Math.abs(p - pos) === 1)
          if (adjacent) continue
        }
        positions.push(pos)
      }
    }
    const unresolvedPositions = positions.slice(currentGapIndex)
    const correctLetters = unresolvedPositions.map((pos) => wordText[pos])

    const isLatin = /^[A-Za-z]+$/.test(wordText)
    const isBengali = /[\u0980-\u09FF]/.test(wordText)
    let pool: string[] = []
    if (isLatin) {
      pool = "abcdefghijklmnopqrstuvwxyz".split("")
    } else if (isBengali) {
      const bnVowels = "অআইঈউঊঋএঐওঔ".split("")
      const bnConsonants = "কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ".split("")
      pool = [...bnVowels, ...bnConsonants]
    } else {
      const uniqueChars = Array.from(new Set(wordText.split("").filter((c) => !correctLetters.includes(c))))
      pool = uniqueChars.length > 0 ? uniqueChars : correctLetters
    }
    const groupSize = correctLetters.length
    const makeGroupLabel = (letters: string[]) => letters.join(", ")
    const correctLabel = makeGroupLabel(correctLetters)
    const setEquals = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false
      const sa = new Set(a)
      for (const x of b) if (!sa.has(x)) return false
      return true
    }
    const makeWrongGroup = () => {
      const available = pool.filter((l) => !correctLetters.includes(l))
      const pick: string[] = []
      while (pick.length < groupSize && available.length > 0) {
        const idx = Math.floor(rng() * available.length)
        const candidate = available[idx]
        if (!pick.includes(candidate)) pick.push(candidate)
      }
      if (pick.length < groupSize) {
        const fallbackPool = Array.from(new Set(wordText.split("").filter((c) => !correctLetters.includes(c))))
        while (pick.length < groupSize && fallbackPool.length > 0) {
          const idx = Math.floor(rng() * fallbackPool.length)
          const candidate = fallbackPool[idx]
          if (!pick.includes(candidate)) pick.push(candidate)
        }
      }
      if (setEquals(pick, correctLetters)) {
        // force difference by swapping one letter
        const alt = pool.find((l) => !correctLetters.includes(l) && !pick.includes(l))
        if (alt) {
          pick[0] = alt
        }
      }
      return makeGroupLabel(pick)
    }
    const wrongLabels: string[] = []
    while (wrongLabels.length < 3) {
      const label = makeWrongGroup()
      if (label !== correctLabel && !wrongLabels.includes(label)) wrongLabels.push(label)
    }

    return {
      missingPositions: positions,
      correctLetters,
      options: shuffleWithRng([correctLabel, ...wrongLabels], rng),
    }
  }, [currentIndex, currentWord, gameNumber, difficulty, currentGapIndex])

  const displayWord =
    currentWord && puzzleData
      ? currentWord.word
          .split("")
          .map((char, i) => {
            const posList = puzzleData?.missingPositions ?? []
            const unresolved = posList
              .slice(currentGapIndex)
              .includes(i)
            return unresolved ? "_" : char
          })
          .join("")
      : ""

  const triggerFireworks = useCallback((intensity: "small" | "large" = "small") => {
    const count = intensity === "large" ? 5 : 2
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 }

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      })
    }

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        fire(0.25, { spread: 26, startVelocity: 55 })
        fire(0.2, { spread: 60 })
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
        fire(0.1, { spread: 120, startVelocity: 45 })
      }, i * 300)
    }
  }, [])

  const handleGameComplete = useCallback(
    (finalScore: number) => {
      const perfectScore = words.length * marksPerWord
      if (finalScore === perfectScore) {
        triggerFireworks("large")
        const interval = setInterval(() => triggerFireworks("small"), 1000)
        setTimeout(() => clearInterval(interval), 5000)
      }
      onComplete(finalScore)
    },
    [onComplete, triggerFireworks, words.length, marksPerWord],
  )

  const goToIndex = useCallback((nextIndex: number) => {
    setCurrentIndex(nextIndex)
    setTimeLeft(timePerWord)
    setShowHint(false)
    setSelectedLetter(null)
    setIsCorrect(null)
    setCurrentGapIndex(0)
  }, [timePerWord])

  const handleTimeout = useCallback(() => {
    setIsCorrect(false)
    setTimeout(() => {
      const gaps = puzzleData?.missingPositions?.length ?? 1
      if (currentGapIndex < gaps - 1) {
        setCurrentGapIndex((prev) => prev + 1)
        setSelectedLetter(null)
        setIsCorrect(null)
        setTimeLeft(timePerWord)
      } else {
        if (currentIndex < words.length - 1) {
          goToIndex(currentIndex + 1)
        } else {
          handleGameComplete(score)
        }
      }
    }, 1500)
  }, [currentIndex, goToIndex, handleGameComplete, score, words.length, currentGapIndex, puzzleData, timePerWord])

  useEffect(() => {
    if (!timerActive || isCorrect !== null) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerActive, isCorrect, handleTimeout])

  const handleLetterSelect = (letter: string) => {
    if (isCorrect !== null) return
    if (!puzzleData) return

    setSelectedLetter(letter)
    const chosen = letter.split(",").map((s) => s.trim())
    const correct = Array.isArray(puzzleData.correctLetters) &&
      chosen.length === puzzleData.correctLetters.length &&
      chosen.every((c) => puzzleData.correctLetters?.includes(c))

    setIsCorrect(correct)

    const nextScore = correct ? score + marksPerWord : score

    if (correct) {
      setScore(nextScore)
      triggerFireworks("small")
    }

    setTimeout(() => {
      const gaps = puzzleData?.missingPositions?.length ?? 1
      if (correct) {
        // selecting the group fills all remaining gaps at once
        if (currentIndex < words.length - 1) {
          goToIndex(currentIndex + 1)
        } else {
          handleGameComplete(nextScore)
        }
      } else {
        // wrong selection, proceed like before
        if (currentGapIndex < gaps - 1) {
          setCurrentGapIndex((prev) => prev + 1)
          setSelectedLetter(null)
          setIsCorrect(null)
          setTimeLeft(timePerWord)
        } else {
          if (currentIndex < words.length - 1) {
            goToIndex(currentIndex + 1)
          } else {
            handleGameComplete(nextScore)
          }
        }
      }
    }, 1500)
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="outline" className="bg-slate-800/50 text-white border-slate-600 px-4 py-2 text-sm">
          {difficulty.toUpperCase()}
        </Badge>

        {showTimer && (
          <Badge variant="outline" className="bg-slate-800/50 text-white border-slate-600 px-4 py-2 text-sm">
            <Timer className="mr-2 h-4 w-4" />
            {timeLeft}s
          </Badge>
        )}

        {gameNumber && (
          <Badge variant="outline" className="bg-slate-800/50 text-white border-slate-600 px-4 py-2 text-sm">
            #{gameNumber}
          </Badge>
        )}

        <Badge variant="outline" className="bg-slate-800/50 text-white border-slate-600 px-4 py-2 text-sm">
          <Trophy className="mr-2 h-4 w-4" />
          {score} pts
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Progress</span>
          <span>
            {currentIndex + 1} / {words.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 bg-slate-800" />
      </div>

      {/* Removed large timer circle */}

      <Card className="bg-slate-800/30 border-slate-700/50 p-8 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-5xl md:text-7xl font-bold text-white tracking-wider mb-6 font-mono">
            {displayWord.split("").map((char, i) => (
              <span
                key={i}
                className={char === "_" ? "text-blue-400 inline-block mx-1 border-b-4 border-blue-400 w-12" : ""}
              >
                {char === "_" ? "\u00A0" : char}
              </span>
            ))}
          </div>

          {isCorrect !== null && (
            <div className={`text-xl font-semibold mt-4 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
              {isCorrect
                ? "✓ Correct!"
                : `✗ Wrong! The answer was "${(Array.isArray(puzzleData?.correctLetters) ? puzzleData?.correctLetters.join(", ") : (puzzleData?.correctLetters?.[0] ?? ""))?.toUpperCase()}"`}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {(puzzleData?.options ?? []).map((letter) => (
          <Button
            key={`${letter}-${currentGapIndex}`}
            onClick={() => handleLetterSelect(letter)}
            disabled={isCorrect !== null}
            className={`h-24 text-4xl font-bold transition-all ${
              selectedLetter === letter && isCorrect === true
                ? "bg-green-600 hover:bg-green-700 border-green-400"
                : selectedLetter === letter && isCorrect === false
                  ? "bg-red-600 hover:bg-red-700 border-red-400"
                  : "bg-slate-800/50 hover:bg-slate-700/50 border-slate-600"
            }`}
            variant="outline"
          >
            {letter
              .split(",")
              .map((s) => s.trim().toUpperCase())
              .join(", ")}
          </Button>
        ))}
      </div>

      <div className="text-center">
        {!showHint ? (
          <Button
            variant="ghost"
            onClick={() => setShowHint(true)}
            className="text-gray-400 hover:text-white"
            disabled={isCorrect !== null}
          >
            <Lightbulb className="mr-2 h-5 w-5" />
            Show Hint
          </Button>
        ) : (
          <Card className="bg-amber-500/10 border-amber-500/30 p-4">
            <p className="text-amber-200 text-center">{currentWord.hint || "No hint available"}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
