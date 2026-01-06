"use client"

import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { GameForm } from "@/components/admin/game-form"
import { AdminFooter } from "@/components/admin/admin-footer"

export default function NewGamePage() {
  return (
    <SidebarProvider>
      <AdminNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-bold">Create New Game</h1>
        </header>
        <main className="p-6">
          <GameForm />
          <AdminFooter />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
