"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DifficultySelectPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter()
  const { subjectId } = params

  const difficulties = [
    {
      level: "easy",
      title: "Easy",
      description: "1 missing letter per word",
      color: "bg-green-500",
      badge: "default",
    },
    {
      level: "medium",
      title: "Medium",
      description: "2 missing letters per word",
      color: "bg-yellow-500",
      badge: "secondary",
    },
    {
      level: "hard",
      title: "Hard",
      description: "3 missing letters per word",
      color: "bg-red-500",
      badge: "destructive",
    },
  ]

  const handleSelectDifficulty = (difficulty: string) => {
    router.push(`/play/game/${subjectId}?difficulty=${difficulty}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Subjects
        </Button>

        <h1 className="text-3xl font-bold text-white mb-8 text-center">Select Difficulty</h1>

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {difficulties.map((diff) => (
            <Card
              key={diff.level}
              className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all bg-slate-800 border-slate-700"
              onClick={() => handleSelectDifficulty(diff.level)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-white">{diff.title}</CardTitle>
                  <Badge variant={diff.badge as any}>{diff.level}</Badge>
                </div>
                <CardDescription className="text-gray-300">{diff.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`h-2 rounded ${diff.color}`}></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
