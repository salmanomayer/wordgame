 "use client"
 import Link from "next/link"
 import { useEffect, useState } from "react"
 import { usePathname } from "next/navigation"
 
 export function Footer() {
  const pathname = usePathname()
  const [text, setText] = useState(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
  const [developerPrefix, setDeveloperPrefix] = useState("Developed By")
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" })
        const data = await res.json()
        setText(data?.footer_text || `© ${new Date().getFullYear()} Word Game. All rights reserved.`)
        setDeveloperPrefix(data?.admin_footer_text || "Developed By")
        setLinks(Array.isArray(data?.admin_footer_links) ? data.admin_footer_links : [])
      } catch {
        setText(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
        setDeveloperPrefix("Developed By")
        setLinks([])
      }
    }
    load()
  }, [])

  if (pathname.startsWith("/admin")) return null

  return (
    <footer className="relative py-3 text-center text-sm border-t border-white/10">
      <div className="relative z-10">
        <p className="text-white text-sm font-bold mb-1">{text}</p>
        <p className="text-white text-sm">
          {links.length > 0 && links[0].url ? (
            <>
              {developerPrefix} <Link
                href={links[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors font-bold"
              >
                {links[0].label}
              </Link>
            </>
          ) : (
             <span>{developerPrefix} {links.length > 0 ? links[0].label : ""}</span>
          )}
        </p>
      </div>
    </footer>
  )
}
