"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { AdminFooter } from "@/components/admin/admin-footer"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

export default function AdminSettingsPage() {
  const [title, setTitle] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [footerText, setFooterText] = useState("")
  const [adminFooterText, setAdminFooterText] = useState("")
  const [adminLinks, setAdminLinks] = useState<Array<{ label: string; url: string }>>([])
  
  // Landing Page Settings
  const [landingHeaderTitle, setLandingHeaderTitle] = useState("")
  const [landingHeaderSubtitle, setLandingHeaderSubtitle] = useState("")
  const [landingDescription, setLandingDescription] = useState("")
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isBrandingOpen, setIsBrandingOpen] = useState(false)
  const [isLandingOpen, setIsLandingOpen] = useState(true)
  const [isFooterOpen, setIsFooterOpen] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setTitle(data?.title || "")
        setLogoUrl(data?.logo_url || "")
        setFooterText(data?.footer_text || "")
        setAdminFooterText(data?.admin_footer_text || "")
        setAdminLinks(Array.isArray(data?.admin_footer_links) ? data.admin_footer_links : [])
        setLandingHeaderTitle(data?.landing_header_title || "Level Up Your Brain\nOne Word at a Time")
        setLandingHeaderSubtitle(data?.landing_header_subtitle || "")
        setLandingDescription(data?.landing_description || "Challenge yourself with engaging word puzzles across multiple difficulty levels. Improve vocabulary, boost memory, and have fun while learning.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const handleSave = async () => {
    const token = localStorage.getItem("admin_token")
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          title, 
          logo_url: logoUrl, 
          footer_text: footerText, 
          admin_footer_text: adminFooterText, 
          admin_footer_links: adminLinks,
          landing_header_title: landingHeaderTitle,
          landing_header_subtitle: landingHeaderSubtitle,
          landing_description: landingDescription
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save settings")
      }
      alert("Settings saved")
    } catch (e: any) {
      alert(e?.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AdminNav />
        <SidebarInset className="bg-muted/40">
          <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Settings</h2>
          </header>
          <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center">
            <div className="text-lg">Loading...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AdminNav />
      <SidebarInset className="min-w-0 bg-muted/40">
        <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <h2 className="text-lg font-semibold">Settings</h2>
        </header>
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
          
          <Collapsible open={isLandingOpen} onOpenChange={setIsLandingOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
                  <div className="space-y-1.5">
                    <CardTitle>Landing Page Content</CardTitle>
                    <CardDescription>Manage main headings and descriptions (Bangla supported)</CardDescription>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isLandingOpen ? "rotate-180" : ""}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="landing-title">Main Header Title</Label>
                    <Textarea 
                      id="landing-title" 
                      value={landingHeaderTitle} 
                      onChange={(e) => setLandingHeaderTitle(e.target.value)} 
                      placeholder="Enter title (use line breaks for spacing)"
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">This is the large text on the home page.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="landing-desc">Description</Label>
                    <Textarea 
                      id="landing-desc" 
                      value={landingDescription} 
                      onChange={(e) => setLandingDescription(e.target.value)} 
                      placeholder="Enter description"
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Content"}</Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={isBrandingOpen} onOpenChange={setIsBrandingOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
                  <div className="space-y-1.5">
                    <CardTitle>Logo & Site Title</CardTitle>
                    <CardDescription>Manage site branding</CardDescription>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isBrandingOpen ? "rotate-180" : ""}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-title">Site Title</Label>
                    <Input id="site-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Word Game" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo-url">Logo URL</Label>
                    <Input id="logo-url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Branding"}</Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={isFooterOpen} onOpenChange={setIsFooterOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
                  <div className="space-y-1.5">
                    <CardTitle>Footer Configuration</CardTitle>
                    <CardDescription>Manage copyright and developed by information</CardDescription>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFooterOpen ? "rotate-180" : ""}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer-text">Copyright Text</Label>
                    <Input id="footer-text" value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="© 2026 Word Puzzle Game. All rights reserved." />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="admin-footer-text">Developer Prefix Text</Label>
                     <Input id="admin-footer-text" value={adminFooterText} onChange={(e) => setAdminFooterText(e.target.value)} placeholder="Developed By" />
                  </div>
                  <div className="space-y-2">
                    <Label>Developer Info</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       <Input
                        value={adminLinks.length > 0 ? adminLinks[0].label : ""}
                        onChange={(e) => {
                           const newLabel = e.target.value
                           const currentUrl = adminLinks.length > 0 ? adminLinks[0].url : ""
                           setAdminLinks([{ label: newLabel, url: currentUrl }])
                        }}
                        placeholder="Name (e.g. Musala Lab)"
                      />
                      <Input
                        value={adminLinks.length > 0 ? adminLinks[0].url : ""}
                        onChange={(e) => {
                           const newUrl = e.target.value
                           const currentLabel = adminLinks.length > 0 ? adminLinks[0].label : ""
                           setAdminLinks([{ label: currentLabel, url: newUrl }])
                        }}
                        placeholder="URL (e.g. https://musamalab.com)"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Footer"}</Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          
          <AdminFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}