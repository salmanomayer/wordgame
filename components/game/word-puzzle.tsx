"use client"

import { useState, useEffect } from "react"
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
}

export function WordPuzzle({ words, difficulty, onComplete, showTimer = false, gameNumber }: WordPuzzleProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerActive, setTimerActive] = useState(showTimer)

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  const getPuzzleData = (word: Word) => {
    if (word.missing_position && word.correct_letter && word.wrong_options) {
      return {
        missingPos: word.missing_position,
        correctLetter: word.correct_letter.toLowerCase(),
        options: [...word.wrong_options, word.correct_letter.toLowerCase()].sort(() => Math.random() - 0.5),
      }
    }

    // Auto-generate puzzle from word
    const wordLower = word.word.toLowerCase()
    const missingPos = Math.floor(Math.random() * wordLower.length)
    const correctLetter = wordLower[missingPos]

    // Generate 3 random wrong letters
    const vowels = ["a", "e", "i", "o", "u"]
    const consonants = "bcdfghjklmnpqrstvwxyz".split("")
    const isVowel = vowels.includes(correctLetter)
    const pool = isVowel ? vowels : consonants
    const wrongOptions = pool
      .filter((l) => l !== correctLetter)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    return {
      missingPos,
      correctLetter,
      options: [correctLetter, ...wrongOptions].sort(() => Math.random() - 0.5),
    }
  }

  const puzzleData = getPuzzleData(currentWord)

  const displayWord = currentWord.word
    .split("")
    .map((char, i) => (i === puzzleData.missingPos ? "_" : char))
    .join("")

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
  }, [timerActive, isCorrect])

  useEffect(() => {
    setTimeLeft(30)
    setShowHint(false)
    setSelectedLetter(null)
    setIsCorrect(null)
  }, [currentIndex])

  const triggerFireworks = (intensity: "small" | "large" = "small") => {
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
  }

  const handleLetterSelect = (letter: string) => {
    if (isCorrect !== null) return

    setSelectedLetter(letter)
    const correct = letter === puzzleData.correctLetter

    setIsCorrect(correct)

    if (correct) {
      const points = 10
      setScore(score + points)
      triggerFireworks("small")
    }

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        handleGameComplete(correct ? score + 10 : score)
      }
    }, 1500)
  }

  const handleTimeout = () => {
    setIsCorrect(false)
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        handleGameComplete(score)
      }
    }, 1500)
  }

  const handleGameComplete = (finalScore: number) => {
    const perfectScore = words.length * 10
    if (finalScore === perfectScore) {
      triggerFireworks("large")
      const interval = setInterval(() => triggerFireworks("small"), 1000)
      setTimeout(() => clearInterval(interval), 5000)
    }
    onComplete(finalScore)
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

      {showTimer && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 border-2 border-slate-600">
            <span className="text-2xl font-bold text-white">{Math.floor(timeLeft / 10)}</span>
          </div>
        </div>
      )}

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
              {isCorrect ? "✓ Correct!" : `✗ Wrong! The answer was "${puzzleData.correctLetter}"`}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {puzzleData.options.map((letter) => (
          <Button
            key={letter}
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
            {letter}
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
