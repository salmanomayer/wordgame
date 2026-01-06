"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function AdminFooter() {
  const [copyright, setCopyright] = useState(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
  const [text, setText] = useState("")
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" })
        const data = await res.json()
        setCopyright(data?.footer_text || `© ${new Date().getFullYear()} Word Game. All rights reserved.`)
        setText(data?.admin_footer_text || "")
        setLinks(Array.isArray(data?.admin_footer_links) ? data.admin_footer_links : [])
      } catch {
        setCopyright(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
        setText("")
        setLinks([])
      }
    }
    load()
  }, [])

  return (
    <footer className="relative py-3 text-center text-sm border-t border-white/10 bg-background">
      <div className="relative z-10">
        <p className="text-gray-300 text-xs mb-1">{copyright}</p>
        <p className="text-gray-400 text-xs">
          Developed by{" "}
          <Link
            href="https://musamalab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-colors underline font-medium"
          >
            Musama Lab
          </Link>
        </p>
        {text && <p className="text-muted-foreground text-xs mt-2">{text}</p>}
        {Array.isArray(links) && links.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-center mt-2 text-xs">
            {links.map((l, idx) =>
              l?.url ? (
                <Link
                  key={`${l.url}-${idx}`}
                  href={l.url}
                  target={l.url.startsWith("http") ? "_blank" : undefined}
                  rel={l.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-primary hover:underline"
                >
                  {l.label || l.url}
                </Link>
              ) : null,
            )}
          </div>
        )}
      </div>
    </footer>
  )
}
