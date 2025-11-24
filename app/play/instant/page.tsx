"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Sparkles, Zap } from "lucide-react"

export default function InstantPlayPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="max-w-2xl w-full bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">How to Play</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Find the Missing Letter</h3>
                  <p className="text-sm text-gray-300">
                    Look at the word with a blank space and select the correct missing letter
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Choose From 4 Options</h3>
                  <p className="text-sm text-gray-300">Tap one of the four letter choices to fill in the blank</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-pink-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Earn Points & See Fireworks!</h3>
                  <p className="text-sm text-gray-300">
                    Get 10 points for each correct answer and enjoy celebration animations
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4 rounded-lg border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <h3 className="font-semibold">Playing in Easy Mode</h3>
              </div>
              <p className="text-sm text-gray-300">
                You'll solve 5 word puzzles. Sign up to unlock Medium and Hard modes with timers!
              </p>
            </div>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={() => router.push("/play/demo")}
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Game
            </Button>

            <Button variant="ghost" className="w-full text-gray-400 hover:text-white" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
