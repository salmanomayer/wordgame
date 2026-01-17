"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AdminFooter } from "@/components/admin/admin-footer"

export default function AdminSettingsPage() {
  const [title, setTitle] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [footerText, setFooterText] = useState("")
  const [adminFooterText, setAdminFooterText] = useState("")
  const [adminLinks, setAdminLinks] = useState<Array<{ label: string; url: string }>>([])
  const [developedByText, setDevelopedByText] = useState("")
  const [developedByUrl, setDevelopedByUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        setDevelopedByText(data?.developed_by_text || "Musama Lab")
        setDevelopedByUrl(data?.developed_by_url || "https://musamalab.com")
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
          developed_by_text: developedByText,
          developed_by_url: developedByUrl
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
        <div className="p-4 sm:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Title</CardTitle>
              <CardDescription>Manage site branding</CardDescription>
            </CardHeader>
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
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer</CardTitle>
              <CardDescription>Manage copyright text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Input id="footer-text" value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder={`© ${new Date().getFullYear()} Word Game. All rights reserved.`} />
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Footer"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Footer</CardTitle>
              <CardDescription>Show links only in admin panel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-footer-text">Admin Footer Text</Label>
                <Input id="admin-footer-text" value={adminFooterText} onChange={(e) => setAdminFooterText(e.target.value)} placeholder="Admin footer note or description" />
              </div>
              <div className="space-y-2">
                <Label>Admin Footer Links</Label>
                <div className="space-y-3">
                  {adminLinks.map((link, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const arr = [...adminLinks]
                          arr[idx] = { ...arr[idx], label: e.target.value }
                          setAdminLinks(arr)
                        }}
                        placeholder="Label"
                        className="sm:col-span-2"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const arr = [...adminLinks]
                          arr[idx] = { ...arr[idx], url: e.target.value }
                          setAdminLinks(arr)
                        }}
                        placeholder="https://example.com"
                        className="sm:col-span-2"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          const arr = [...adminLinks]
                          arr.splice(idx, 1)
                          setAdminLinks(arr)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setAdminLinks([...adminLinks, { label: "", url: "" }])}
                  >
                    Add Link
                  </Button>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Admin Footer"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Developed By</CardTitle>
              <CardDescription>Customize the "Developed by" text and link in footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="developed-by-text">Developed By Text</Label>
                <Input 
                  id="developed-by-text" 
                  value={developedByText} 
                  onChange={(e) => setDevelopedByText(e.target.value)} 
                  placeholder="Paragon Team" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="developed-by-url">Developed By URL</Label>
                <Input 
                  id="developed-by-url" 
                  value={developedByUrl} 
                  onChange={(e) => setDevelopedByUrl(e.target.value)} 
                  placeholder="https://example.com" 
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Developed By"}</Button>
            </CardContent>
          </Card>
          <AdminFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
