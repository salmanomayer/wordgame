"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react"
 

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const validateToken = async () => {
      try {
        setError("Password reset is unavailable: Supabase removed")
        setIsValidating(false)
      } catch (err) {
        console.log("[v0] Error validating token:", err)
        setError("Password reset is unavailable: Supabase removed")
        setIsValidating(false)
      }
    }

    validateToken()
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setError(null)

    setError("Password reset is unavailable: Supabase removed")
    setIsLoading(false)
  }

  if (isValidating) {
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
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-400 mx-auto mb-4" />
            <p className="text-gray-400">Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
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
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create New Password</h1>
            <p className="text-gray-400">Enter your new password below</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10">
            {success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-white">Password Reset Successful</h2>
                <p className="text-gray-400">Your password has been reset successfully. Redirecting to login...</p>
              </div>
            ) : error ? (
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>
                </div>
                <Button
                  onClick={() => router.push("/play/forgot-password")}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-11 sm:h-12 text-base sm:text-lg font-medium"
                >
                  Request New Reset Link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white text-sm sm:text-base">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-indigo-500 h-11 sm:h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white text-sm sm:text-base">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-indigo-500 h-11 sm:h-12 text-base"
                  />
                </div>
                {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-11 sm:h-12 text-base sm:text-lg font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
