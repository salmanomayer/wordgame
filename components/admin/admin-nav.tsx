"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, BookOpen, UserCog, LogOut, FileText, Cog, Trophy, ClipboardList, Gamepad2, Shuffle, History } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"

export function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [siteTitle, setSiteTitle] = useState("Word Game")
  const [logoUrl, setLogoUrl] = useState("")
  const [adminFooterText, setAdminFooterText] = useState("")
  const [adminLinks, setAdminLinks] = useState<Array<{ label: string; url: string }>>([])

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    router.push("/admin/login")
  }
  
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" })
        const data = await res.json()
        setSiteTitle(data?.title || "Word Game")
        setLogoUrl(data?.logo_url || "")
        setAdminFooterText(data?.admin_footer_text || "")
        setAdminLinks(Array.isArray(data?.admin_footer_links) ? data.admin_footer_links : [])
      } catch {
        setSiteTitle("Word Game")
        setLogoUrl("")
        setAdminFooterText("")
        setAdminLinks([])
      }
    }
    load()
  }, [])

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/players", label: "Players", icon: Users },
    { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { href: "/admin/words", label: "Words", icon: FileText },
    { 
      label: "Games", 
      icon: Gamepad2,
      isSubmenu: true,
      href: "/admin/games",
      items: [
        { href: "/admin/games", label: "Challenge Game", icon: Trophy },
        { href: "/admin/games/random", label: "Random Game", icon: Shuffle }
      ]
    },
    { 
      label: "Results", 
      icon: Trophy,
      isSubmenu: true,
      href: "/admin/games/results", // Parent path for active check
      items: [
        { href: "/admin/games/results/challenge", label: "Challenge Game", icon: Trophy },
        { href: "/admin/games/results/random", label: "Random Game", icon: Shuffle }
      ]
    },
    { 
      label: "Logs", 
      icon: History,
      isSubmenu: true,
      href: "/admin/logs", // Parent path
      items: [
        { href: "/admin/logs/audit", label: "Audit Logs", icon: ClipboardList },
        { href: "/admin/logs/player", label: "Player Logs", icon: Users }
      ]
    },
    { href: "/admin/settings", label: "Settings", icon: Cog },
    { href: "/admin/users", label: "Admin Users", icon: UserCog },
  ]

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          {logoUrl ? (
            <img src={logoUrl} alt={siteTitle} className="h-8 w-8 rounded-md object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-semibold">WG</span>
            </div>
          )}
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-semibold">{siteTitle}</span>
            <span className="truncate text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon
            
            if (item.isSubmenu && item.items) {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Collapsible key={item.label} asChild defaultOpen={isActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.label}>
                        <Icon />
                        <span>{item.label}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = pathname === subItem.href
                          return (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton 
                                asChild 
                                isActive={isSubActive}
                                onClick={() => router.push(subItem.href)}
                              >
                                <span className="flex items-center gap-2 cursor-pointer">
                                  <SubIcon className="h-4 w-4" />
                                  <span>{subItem.label}</span>
                                </span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }

            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.label}
                  onClick={() => router.push(item.href!)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
