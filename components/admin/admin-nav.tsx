"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, LogOut, UserCog, LayoutDashboard } from "lucide-react"

export function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    router.push("/admin/login")
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/players", label: "Players", icon: Users },
    { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { href: "/admin/users", label: "Admin Users", icon: UserCog },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold">Word Game Admin</h1>
          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => router.push(item.href)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </nav>
  )
}
