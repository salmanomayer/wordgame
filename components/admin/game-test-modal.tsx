"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { WordPuzzle } from "@/components/game/word-puzzle"
import { Card } from "@/components/ui/card"

interface AdminGameTestModalProps {
  gameId: string | null
  onClose: () => void
}

export function AdminGameTestModal({ gameId, onClose }: AdminGameTestModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameData, setGameData] = useState<any>(null)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [isGameComplete, setIsGameComplete] = useState(false)

  useEffect(() => {
    if (gameId) {
      fetchGameData()
    }
  }, [gameId])

  const fetchGameData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("admin_token")
      const res = await fetch(`/api/admin/games/${gameId}/test-words`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch game test data")
      const data = await res.json()
      setGameData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleStageComplete = (stageScore: number) => {
    setTotalScore(prev => prev + stageScore)
    
    if (gameData.stages && gameData.stages.length > 0) {
      if (currentStageIndex < gameData.stages.length - 1) {
        setCurrentStageIndex(prev => prev + 1)
      } else {
        setIsGameComplete(true)
      }
    } else {
      setIsGameComplete(true)
    }
  }

  const resetGame = () => {
    setCurrentStageIndex(0)
    setTotalScore(0)
    setIsGameComplete(false)
    fetchGameData()
  }

  if (!gameId) return null

  // Important: We need a key for WordPuzzle that changes when the stage changes
  // to force a full re-mount and reset the internal state of the puzzle.
  const puzzleKey = `stage-${currentStageIndex}`

  return (
    <Dialog open={!!gameId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Test Game: {gameData?.game?.title || "Loading..."}
            {gameData?.game?.is_active === false && (
              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">Inactive</span>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Admins can test games regardless of start/end dates.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-slate-400">Preparing your test game...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-xl font-semibold">Error Loading Game</p>
              <p className="text-slate-400">{error}</p>
              <Button onClick={fetchGameData}>Try Again</Button>
            </div>
          ) : isGameComplete ? (
            <div className="flex flex-col items-center justify-center py-10 gap-6 text-center">
              <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-2">Test Complete!</h3>
                <p className="text-slate-400 text-lg">
                  Final Score: <span className="text-emerald-400 font-bold">{totalScore}</span> points
                </p>
              </div>
              <div className="flex gap-4">
                <Button onClick={resetGame} variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                  Play Again
                </Button>
                <Button onClick={onClose}>Finish Test</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {gameData.stages && gameData.stages.length > 0 ? (
                <div>
                  <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400">
                        Stage {currentStageIndex + 1}: {gameData.stages[currentStageIndex].title}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Progress: {currentStageIndex + 1} of {gameData.stages.length} stages
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400 text-sm">Total Score</p>
                      <p className="text-xl font-bold text-emerald-400">{totalScore}</p>
                    </div>
                  </div>
                  
                  {gameData.stages[currentStageIndex].words && gameData.stages[currentStageIndex].words.length > 0 ? (
                    <WordPuzzle
                      key={puzzleKey}
                      words={gameData.stages[currentStageIndex].words}
                      difficulty={gameData.stages[currentStageIndex].difficulty || "medium"}
                      onComplete={handleStageComplete}
                      showTimer={true}
                      marksPerWord={gameData.game.correct_marks}
                      timePerWord={gameData.game.time_per_word}
                    />
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-slate-400">No words found for this stage.</p>
                      <Button onClick={() => handleStageComplete(0)} className="mt-4">Skip Stage</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400">Single Level Game</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Total Score</p>
                      <p className="text-xl font-bold text-emerald-400">{totalScore}</p>
                    </div>
                  </div>

                  {gameData.words && gameData.words.length > 0 ? (
                    <WordPuzzle
                      key="single-level"
                      words={gameData.words}
                      difficulty={gameData.game.difficulty || "medium"}
                      onComplete={handleStageComplete}
                      showTimer={true}
                      marksPerWord={gameData.game.correct_marks}
                      timePerWord={gameData.game.time_per_word}
                    />
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-slate-400">No words found for this game.</p>
                      <Button onClick={onClose} variant="outline" className="mt-4">Close</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
