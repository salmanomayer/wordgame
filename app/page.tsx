"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Brain, Zap, Trophy, ArrowRight, Sparkles } from "lucide-react"

const floatingWords = [
  "QUANTUM",
  "PHOTOSYNTHESIS",
  "NEBULA",
  "ALGORITHM",
  "MOLECULE",
  "GRAVITY",
  "SYNAPSE",
  "CATALYST",
  "EVOLUTION",
  "NEUTRON",
  "SPECTRUM",
  "ELECTRON",
  "PLASMA",
  "ENZYME",
  "CHROMOSOME",
  "AXIOM",
  "THEOREM",
  "FRACTAL",
  "RESONANCE",
  "MOMENTUM",
]

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {floatingWords.map((word, i) => (
          <div
            key={i}
            className="absolute text-2xl font-bold text-white animate-float"
            style={{
              left: `${(i * 37 + word.length * 3) % 100}%`,
              top: `${(i * 53 + word.length * 7) % 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${15 + ((i * 7 + word.length) % 10)}s`,
            }}
          >
            {word}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-600 opacity-20 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-600 opacity-20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 h-60 w-60 rounded-full bg-blue-600 opacity-15 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
          <div className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-300 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            Brain Training Made Fun
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-balance text-white mb-4 sm:mb-6 leading-tight px-4">
            Level Up Your Brain
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              One Word at a Time
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-300 text-balance max-w-2xl mb-8 sm:mb-10 px-4">
            Challenge yourself with engaging word puzzles across multiple difficulty levels. Improve vocabulary, boost
            memory, and have fun while learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-12 sm:mb-16 w-full max-w-md px-4">
            <Button
              size="lg"
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              onClick={() => router.push("/play/instant")}
            >
              Play demo
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-indigo-500/50 bg-indigo-500/10 text-white hover:bg-indigo-500/20 backdrop-blur-sm w-full sm:w-auto"
              onClick={() => router.push("/play/login")}
            >
              Have a fun with sign in
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl w-full px-4">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-shadow border border-white/10 hover:border-indigo-500/50">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Boost Your Brain</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Enhance cognitive abilities with scientifically designed word challenges
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-shadow border border-white/10 hover:border-purple-500/50">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Multiple Levels</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Progress from easy to hard with adaptive difficulty challenges
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-shadow border border-white/10 hover:border-pink-500/50">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Track Progress</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Monitor your improvement with detailed stats and achievements
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.1;
          }
          25% {
            transform: translate(10vw, 10vh) rotate(5deg);
            opacity: 0.15;
          }
          50% {
            transform: translate(-5vw, 20vh) rotate(-3deg);
            opacity: 0.1;
          }
          75% {
            transform: translate(15vw, 5vh) rotate(8deg);
            opacity: 0.12;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  )
}
