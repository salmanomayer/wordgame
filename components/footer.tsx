 "use client"
 import Link from "next/link"
 import { useEffect, useState } from "react"
 import { usePathname } from "next/navigation"
 
export function Footer() {
  const pathname = usePathname()
  const [text, setText] = useState(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
  const [developedByText, setDevelopedByText] = useState("Musama Lab")
  const [developedByUrl, setDevelopedByUrl] = useState("https://musamalab.com")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" })
        const data = await res.json()
        setText(data?.footer_text || `© ${new Date().getFullYear()} Word Game. All rights reserved.`)
        setDevelopedByText(data?.developed_by_text || "Musama Lab")
        setDevelopedByUrl(data?.developed_by_url || "https://musamalab.com")
      } catch {
        setText(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
        setDevelopedByText("Musama Lab")
        setDevelopedByUrl("https://musamalab.com")
      }
    }
    load()
  }, [])
 
   if (pathname.startsWith("/admin")) return null
 
   return (
     <footer className="relative py-3 text-center text-sm border-t border-white/10">
       <div className="relative z-10">
         <p className="text-gray-300 text-xs mb-1">{text}</p>
        <p className="text-gray-400 text-xs">
          Developed by{" "}
          {developedByUrl ? (
            <Link
              href={developedByUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors underline font-medium"
            >
              {developedByText}
            </Link>
          ) : (
            <span className="text-indigo-400 font-medium">{developedByText}</span>
          )}
        </p>
       </div>
     </footer>
   )
 }
