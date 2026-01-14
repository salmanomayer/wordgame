"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, GripVertical, Clock, Calendar, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Subject {
  id: string
  name: string
}

interface Stage {
  id?: string
  title: string
  subjects: string[]
  word_count: number
  difficulty: string
}

interface GameFormProps {
  initialData?: any
  isEdit?: boolean
}

export function GameForm({ initialData, isEdit }: GameFormProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(initialData?.title || "")
  const [startTime, setStartTime] = useState(initialData?.start_time ? new Date(initialData.start_time).toISOString().slice(0, 16) : "")
  const [endTime, setEndTime] = useState(initialData?.end_time ? new Date(initialData.end_time).toISOString().slice(0, 16) : "")
  const [correctMarks, setCorrectMarks] = useState(initialData?.correct_marks || 10)
  const [timePerWord, setTimePerWord] = useState(initialData?.time_per_word || 30)
  const [wordCount, setWordCount] = useState(initialData?.word_count || 5)
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || "medium")
  const [isActive, setIsActive] = useState(initialData?.is_active !== undefined ? initialData.is_active : true)
  const [gameSubjects, setGameSubjects] = useState<string[]>(Array.isArray(initialData?.subjects) ? initialData.subjects : [])
  const [stages, setStages] = useState<Stage[]>(Array.isArray(initialData?.stages) ? initialData.stages : [])
  const [hasStages, setHasStages] = useState(Array.isArray(initialData?.stages) && initialData.stages.length > 0)
  const [attemptsLimit, setAttemptsLimit] = useState<string>(
    initialData?.attempts_limit !== undefined && initialData?.attempts_limit !== null
      ? String(initialData.attempts_limit)
      : ""
  )

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubjects = async () => {
      const token = localStorage.getItem("admin_token")
      try {
        const res = await fetch("/api/admin/subjects", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setSubjects(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch subjects", error)
        setSubjects([])
      }
    }
    fetchSubjects()
  }, [])

  const handleAddStage = () => {
    setStages([...stages, { title: `Stage ${stages.length + 1}`, subjects: [], word_count: 5, difficulty: "medium" }])
  }

  const handleRemoveStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index))
  }

  const handleStageChange = (index: number, field: keyof Stage, value: any) => {
    const newStages = [...stages]
    newStages[index] = { ...newStages[index], [field]: value }
    setStages(newStages)
  }

  const toggleSubject = (subjectId: string, target: "game" | number) => {
    if (target === "game") {
      setGameSubjects(prev => 
        prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
      )
    } else {
      const newStages = [...stages]
      const currentSubjects = newStages[target].subjects
      newStages[target].subjects = currentSubjects.includes(subjectId)
        ? currentSubjects.filter(id => id !== subjectId)
        : [...currentSubjects, subjectId]
      setStages(newStages)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !correctMarks) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and marks are mandatory.",
      })
      return
    }

    setLoading(true)
    const token = localStorage.getItem("admin_token")
    const payload = {
      title,
      start_time: startTime || null,
      end_time: endTime || null,
      correct_marks: Number(correctMarks),
      time_per_word: Number(timePerWord),
      word_count: Number(wordCount),
      difficulty,
      is_active: isActive,
      attempts_limit: attemptsLimit !== "" ? Number(attemptsLimit) : null,
      subjects: hasStages ? [] : gameSubjects,
      stages: hasStages ? stages : []
    }

    try {
      const url = isEdit ? `/api/admin/games/${initialData.id}` : "/api/admin/games"
      const method = isEdit ? "PATCH" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save game")
      }

      toast({
        title: "Success",
        description: `Game ${isEdit ? "updated" : "created"} successfully.`,
      })
      router.push("/admin/games")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-12">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Game" : "Create New Game"}</CardTitle>
          <CardDescription>Configure basic game settings and rules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Game Title *</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Weekly Challenge #1"
                required
              />
            </div>
            <div className="flex items-center space-x-2 sm:pt-8">
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="active">Game Active</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="marks">Correct Answer Marks *</Label>
              <Input 
                id="marks" 
                type="number" 
                value={correctMarks} 
                onChange={(e) => setCorrectMarks(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time per Word (seconds)</Label>
              <Input 
                id="time" 
                type="number" 
                value={timePerWord} 
                onChange={(e) => setTimePerWord(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="attempts">Attempts per Player (optional)</Label>
              <Input
                id="attempts"
                type="number"
                min="1"
                value={attemptsLimit}
                onChange={(e) => setAttemptsLimit(e.target.value)}
                placeholder="Leave blank for unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start">Start Date & Time (Optional)</Label>
              <Input 
                id="start" 
                type="datetime-local" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Date & Time (Optional)</Label>
              <Input 
                id="end" 
                type="datetime-local" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Game Structure</CardTitle>
              <CardDescription>
                {hasStages 
                  ? "Configure multiple stages for this game." 
                  : "Select subjects for a single-level game."}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="has-stages">Enable Stages</Label>
              <Switch id="has-stages" checked={hasStages} onCheckedChange={setHasStages} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasStages ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="game-word-count">Number of Words to Play</Label>
                  <Input 
                    id="game-word-count" 
                    type="number" 
                    value={wordCount} 
                    onChange={(e) => setWordCount(e.target.value)} 
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="game-difficulty">Difficulty</Label>
                  <select
                    id="game-difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Select Subjects</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 border rounded-md p-4 max-h-60 overflow-y-auto">
                {subjects.map((s) => (
                  <div key={s.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`subject-${s.id}`} 
                      checked={gameSubjects.includes(s.id)}
                      onCheckedChange={() => toggleSubject(s.id, "game")}
                    />
                    <Label htmlFor={`subject-${s.id}`} className="text-sm font-normal cursor-pointer">
                      {s.name}
                    </Label>
                  </div>
                ))}
              </div>
              {gameSubjects.length === 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Please select at least one subject.
                </p>
              )}
            </div>
          </div>
          ) : (
            <div className="space-y-6">
              {stages.map((stage, index) => (
                <div key={index} className="relative border rounded-lg p-4 bg-muted/30 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <Label>Stage {index + 1} Title</Label>
                        <Input 
                          value={stage.title} 
                          onChange={(e) => handleStageChange(index, "title", e.target.value)}
                          className="h-8 w-64"
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => handleRemoveStage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Word Count</Label>
                      <Input 
                        type="number" 
                        value={stage.word_count} 
                        onChange={(e) => handleStageChange(index, "word_count", e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Difficulty</Label>
                      <select
                        value={stage.difficulty}
                        onChange={(e) => handleStageChange(index, "difficulty", e.target.value)}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Stage Subjects</Label>
                      <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-background">
                        {subjects.map((s) => (
                          <div key={s.id} className="flex items-center space-x-2 py-1">
                            <Checkbox 
                              id={`stage-${index}-subject-${s.id}`} 
                              checked={stage.subjects.includes(s.id)}
                              onCheckedChange={() => toggleSubject(s.id, index)}
                            />
                            <Label htmlFor={`stage-${index}-subject-${s.id}`} className="text-xs font-normal cursor-pointer">
                              {s.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={handleAddStage}>
                <Plus className="mr-2 h-4 w-4" /> Add Stage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/games")}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Game" : "Create Game"}
        </Button>
      </div>
    </form>
  )
}
