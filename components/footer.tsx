import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative py-3 text-center text-sm border-t border-white/10">
      <div className="relative z-10">
        <p className="text-gray-300 text-xs mb-1">© 2025 Word Game. All rights reserved.</p>
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
