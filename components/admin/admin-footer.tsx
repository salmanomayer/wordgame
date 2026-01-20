"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function AdminFooter() {
  const [copyright, setCopyright] = useState(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
  const [developerPrefix, setDeveloperPrefix] = useState("Developed By")
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" })
        const data = await res.json()
        setCopyright(data?.footer_text || `© ${new Date().getFullYear()} Word Game. All rights reserved.`)
        setDeveloperPrefix(data?.admin_footer_text || "Developed By")
        setLinks(Array.isArray(data?.admin_footer_links) ? data.admin_footer_links : [])
      } catch {
        setCopyright(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
        setDeveloperPrefix("Developed By")
        setLinks([])
      }
    }
    load()
  }, [])

  return (
    <footer className="relative py-3 text-center text-sm border-t border-white/10 bg-background">
      <div className="relative z-10">
        <p className="text-muted-foreground text-xs mb-1 font-bold">{copyright}</p>
        <p className="text-foreground text-sm">
          {developerPrefix} {links.length > 0 && links[0].url ? (
            <Link
              href={links[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors font-bold underline decoration-wavy decoration-red-500"
            >
              {links[0].label}
            </Link>
          ) : (
            <span className="text-primary font-bold">{links.length > 0 ? links[0].label : ""}</span>
          )}
        </p>
      </div>
    </footer>
  )
}
