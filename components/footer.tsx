 "use client"
 import Link from "next/link"
 import { useEffect, useState } from "react"
 import { usePathname } from "next/navigation"
 
 export function Footer() {
   const pathname = usePathname()
   const [text, setText] = useState(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
 
   useEffect(() => {
     const load = async () => {
       try {
         const res = await fetch("/api/settings", { cache: "no-store" })
         const data = await res.json()
         setText(data?.footer_text || `© ${new Date().getFullYear()} Word Game. All rights reserved.`)
       } catch {
         setText(`© ${new Date().getFullYear()} Word Game. All rights reserved.`)
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
           <Link
             href="https://musamalab.com"
             target="_blank"
             rel="noopener noreferrer"
             className="text-indigo-400 hover:text-indigo-300 transition-colors underline font-medium"
           >
             Musama Lab
           </Link>
         </p>
       </div>
     </footer>
   )
 }
