import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, BookOpen, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalPlayers: number
    totalGames: number
    totalSubjects: number
    avgScore: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Players",
      value: stats.totalPlayers,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Games Played",
      value: stats.totalGames,
      icon: Trophy,
      color: "text-green-600",
    },
    {
      title: "Active Subjects",
      value: stats.totalSubjects,
      icon: BookOpen,
      color: "text-purple-600",
    },
    {
      title: "Avg Score",
      value: stats.avgScore.toFixed(1),
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
