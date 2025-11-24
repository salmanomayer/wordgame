"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Timer, Hash, Trophy, Lightbulb } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import confetti from "canvas-confetti"

interface Word {
  word: string
  hint: string
}

const DEMO_WORDS: Word[] = [
  { word: "PLANT", hint: "A living organism that grows in soil" },
  { word: "BRAIN", hint: "Organ that controls thinking" },
  { word: "MUSIC", hint: "Sound arranged in a pleasant way" },
  { word: "SPACE", hint: "The vast area beyond Earth" },
  { word: "OCEAN", hint: "Large body of salt water" },
]

function generateOptions(correctLetter: string): string[] {
  const vowels = ["A", "E", "I", "O", "U"]
  const consonants = [
    "B",
    "C",
    "D",
    "F",
    "G",
    "H",
    "J",
    "K",
    "L",
    "M",
    "N",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ]
  const allLetters = [...vowels, ...consonants]

  const options = [correctLetter.toUpperCase()]
  const availableLetters = allLetters.filter((l) => l !== correctLetter.toUpperCase())

  // Add 3 more random letters
  while (options.length < 4) {
    const randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)]
    if (!options.includes(randomLetter)) {
      options.push(randomLetter)
    }
  }

  // Shuffle the options
  return options.sort(() => Math.random() - 0.5)
}

export default function DemoPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [gameNumber] = useState(127)
  const [currentMissingIndex, setCurrentMissingIndex] = useState<number>(0)
  const [currentOptions, setCurrentOptions] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const word = DEMO_WORDS[currentIndex].word
    const missingIdx = Math.floor(Math.random() * word.length)
    const correctLetter = word[missingIdx]
    const options = generateOptions(correctLetter)

    setCurrentMissingIndex(missingIdx)
    setCurrentOptions(options)
  }, [currentIndex])

  useEffect(() => {
    if (!isComplete) {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isComplete])

  useEffect(() => {
    if (isComplete) {
      // Launch fireworks for game completion
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isComplete])

  const handleAnswer = (selectedLetter: string) => {
    console.log("[v0] Letter clicked:", selectedLetter)

    if (feedback) {
      console.log("[v0] Feedback already showing, ignoring click")
      return
    }

    const currentWord = DEMO_WORDS[currentIndex]
    const correctLetter = currentWord.word[currentMissingIndex]
    const isCorrect = selectedLetter.toUpperCase() === correctLetter.toUpperCase()

    console.log("[v0] Is correct?", isCorrect, "Correct letter:", correctLetter)

    if (isCorrect) {
      // Launch party fireworks for correct answer
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#818cf8", "#a78bfa", "#c084fc", "#e879f9"],
      })

      const newScore = score + 10
      setScore(newScore)
      setFeedback("correct")

      setTimeout(() => {
        if (currentIndex < DEMO_WORDS.length - 1) {
          console.log("[v0] Moving to next word")
          setCurrentIndex(currentIndex + 1)
          setFeedback(null)
          setShowHint(false)
        } else {
          console.log("[v0] Game complete!")
          setIsComplete(true)
        }
      }, 1500)
    } else {
      setFeedback("wrong")
      setTimeout(() => setFeedback(null), 1500)
    }
  }

  if (isComplete) {
    const allCorrect = score === 50
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
        <Card className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-center text-2xl sm:text-3xl">
              {allCorrect ? "🏆 Perfect Score!" : "Game Complete!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {score} points
            </div>
            <p className="text-gray-300 text-sm sm:text-base">You got {Math.floor(score / 10)} out of 5 correct</p>
            {allCorrect && (
              <p className="text-yellow-400 font-semibold text-sm sm:text-base">Amazing! You're a word master! 🌟</p>
            )}
            <div className="flex flex-col gap-2 mt-6">
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-12 sm:h-auto"
                onClick={() => window.location.reload()}
              >
                Play Again
              </Button>
              <Button
                variant="outline"
                className="w-full border-indigo-500/50 bg-indigo-500/10 text-white hover:bg-indigo-500/20 h-12 sm:h-auto"
                onClick={() => router.push("/play/signup")}
              >
                Sign Up to Save Progress
              </Button>
              <Button
                variant="outline"
                className="w-full border-purple-500/50 bg-purple-500/10 text-white hover:bg-purple-500/20 h-12 sm:h-auto"
                onClick={() => router.push("/play/login")}
              >
                Login (Existing Player)
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white h-12 sm:h-auto"
                onClick={() => router.push("/")}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentWord = DEMO_WORDS[currentIndex]
  const progress = ((currentIndex + 1) / DEMO_WORDS.length) * 100
  const wordDisplay = currentWord.word.split("").map((letter, idx) => (idx === currentMissingIndex ? "_" : letter))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="container mx-auto max-w-4xl py-4 sm:py-8">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 mb-4 sm:mb-6 h-10 sm:h-auto"
          onClick={() => router.push("/play/instant")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header Stats */}
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
          <div className="px-3 sm:px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Easy</span>
          </div>
          <div className="px-3 sm:px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg flex items-center gap-2">
            <Timer className="w-4 h-4 text-slate-400" />
            <span className="text-white font-mono text-sm">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div className="px-3 sm:px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="text-white font-mono text-sm">#{gameNumber}</span>
          </div>
          <div className="px-3 sm:px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-white font-mono text-sm">{score} pts</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-semibold text-sm sm:text-base">Progress</span>
            <span className="text-white font-mono text-sm sm:text-base">
              {currentIndex + 1} / {DEMO_WORDS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-800" />
        </div>

        {/* Main Game Card */}
        <Card className="bg-slate-900/90 backdrop-blur-md border-slate-700">
          <CardContent className="p-4 sm:p-8">
            {/* Timer Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 flex items-center justify-center">
                <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>

            {/* Word Display */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8">
              <div className="flex justify-center gap-1 sm:gap-2 text-4xl sm:text-6xl font-bold text-white tracking-wider">
                {wordDisplay.map((char, idx) => (
                  <span
                    key={idx}
                    className={
                      idx === currentMissingIndex
                        ? "text-indigo-500 underline underline-offset-4 sm:underline-offset-8"
                        : ""
                    }
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {currentOptions.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleAnswer(letter)}
                  disabled={!!feedback}
                  className={`p-4 sm:p-6 rounded-xl text-3xl sm:text-4xl font-bold transition-all border-2 active:scale-95 ${
                    feedback === "correct" &&
                    letter.toUpperCase() === currentWord.word[currentMissingIndex].toUpperCase()
                      ? "bg-green-500/20 border-green-500 text-green-400"
                      : feedback === "wrong" && letter === currentWord.word[currentMissingIndex]
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : "bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 hover:border-slate-600 active:bg-slate-600/50"
                  } ${feedback ? "cursor-not-allowed opacity-50" : "cursor-pointer"} min-h-[80px] sm:min-h-[100px]`}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* Show Hint Button */}
            <Button
              variant="ghost"
              className="w-full text-slate-400 hover:text-white hover:bg-slate-800 h-12 sm:h-auto"
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
