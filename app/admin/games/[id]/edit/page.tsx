"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { GameForm } from "@/components/admin/game-form"
import { useToast } from "@/hooks/use-toast"
import { AdminFooter } from "@/components/admin/admin-footer"

export default function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [game, setGame] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchGame = async () => {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }

      try {
        const response = await fetch(`/api/admin/games/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Failed to fetch game")
        const data = await response.json()
        setGame(data)
      } catch (error) {
        console.error("[v0] Error fetching game:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load game details.",
        })
        router.push("/admin/games")
      } finally {
        setLoading(false)
      }
    }

    fetchGame()
  }, [id, router, toast])

  return (
    <SidebarProvider>
      <AdminNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-bold">Edit Game</h1>
        </header>
        <main className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">Loading game details...</div>
          ) : game ? (
            <GameForm initialData={game} isEdit={true} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">Game not found.</div>
          )}
          <AdminFooter />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
