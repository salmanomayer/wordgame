"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Sending password reset email to:", email)

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to send reset email"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("[v0] Reset password success:", data)
      setSuccess(true)
    } catch (err) {
      console.error("[v0] Caught error:", err)
      setError(err instanceof Error ? err.message : "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-600 opacity-20 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-600 opacity-20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 sm:mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-300 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              Brain Training Made Fun
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-400">Enter your email to receive a password reset link</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10">
            {success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-white">Check Your Email</h2>
                <p className="text-gray-400">
                  We&apos;ve sent a password reset link to <strong className="text-indigo-400">{email}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
                <Button
                  onClick={() => router.push("/play/login")}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-11 sm:h-12 text-base sm:text-lg font-medium"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-sm sm:text-base">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-indigo-500 h-11 sm:h-12 text-base"
                    />
                  </div>
                  {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-11 sm:h-12 text-base sm:text-lg font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-sm text-gray-400">
                    Remember your password?{" "}
                    <button
                      onClick={() => router.push("/play/login")}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Sign In
                    </button>
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/")}
                    className="gap-2 text-gray-400 hover:text-white hover:bg-white/5 w-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
