"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LogOut, Trophy } from "lucide-react"

interface Subject {
  id: string
  name: string
  description: string
}

export default function CategoriesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch("/api/auth/me")
        if (!meRes.ok) {
          router.push("/play/login")
          return
        }
        const me = await meRes.json().catch(() => null)
        setUser(me?.player ?? null)

        const subjectsRes = await fetch("/api/subjects")
        const subjects = await subjectsRes.json().catch(() => [])
        if (Array.isArray(subjects)) setSubjects(subjects)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    router.push("/")
  }

  const handleSelectSubject = (subjectId: string) => {
    router.push(`/play/difficulty-select/${subjectId}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Select a Subject</h1>
            <p className="text-gray-300">Welcome, {user?.email || user?.phone || "Player"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/play/scores")}>
              <Trophy className="mr-2 h-4 w-4" />
              My Scores
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              className="cursor-pointer hover:shadow-lg transition-shadow bg-slate-800 border-slate-700"
              onClick={() => handleSelectSubject(subject.id)}
            >
              <CardHeader>
                <CardTitle className="text-white">{subject.name}</CardTitle>
                <CardDescription className="text-gray-300">{subject.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">Click to select difficulty and play</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
